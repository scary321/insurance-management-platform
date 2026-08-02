import { useEffect, useState, useCallback } from "react";
import api, { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import EmptyState from "../components/EmptyState.jsx";

const API = import.meta.env.VITE_API_URL || "";

export default function Documents() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [docType, setDocType] = useState("identity");
  const [file, setFile] = useState(null);
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get("/api/documents").then((r) => setRows(r.data.data)).catch((e) => setBanner(apiMessage(e)));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!isStaff) return; // customers can't (and needn't) list all customers
    api.get("/api/customers", { params: { per_page: 100 } }).then((r) => setCustomers(r.data.data)).catch(() => {});
  }, [isStaff]);

  async function upload() {
    if (!file) { setBanner("Choose a file to upload."); return; }
    if (isStaff && !customerId) { setBanner("Choose a customer."); return; }
    setBusy(true); setBanner("");
    const fd = new FormData();
    fd.append("file", file);
    // Staff pick the owner; for a customer the server forces their own id.
    if (isStaff) fd.append("customer_id", customerId);
    fd.append("doc_type", docType);
    try {
      await api.post("/api/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setOpen(false); setFile(null); setCustomerId(""); load();
    } catch (e) { setBanner(apiMessage(e)); }
    finally { setBusy(false); }
  }

  function download(id) {
    const token = localStorage.getItem("imp_token");
    // Fetch with auth, then trigger a browser download from the blob.
    fetch(`${API}/api/documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = ""; a.click();
        URL.revokeObjectURL(url);
      });
  }

  const nameOf = (cid) => customers.find((c) => c.id === cid)?.name || `#${cid}`;

  return (
    <>
      <PageHeader eyebrow="Files" title="Documents">
        <button className="btn-primary" onClick={() => { setBanner(""); setOpen(true); }}>Upload document</button>
      </PageHeader>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="No documents yet" hint="Upload identity or policy documents for a customer." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <th className="th">File</th>
              {isStaff && <th className="th">Customer</th>}
              <th className="th">Type</th><th className="th">Uploaded</th><th className="th text-right"></th>
            </tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-paper/60">
                  <td className="td font-medium text-ink">{d.file_name}</td>
                  {isStaff && <td className="td">{nameOf(d.customer_id)}</td>}
                  <td className="td capitalize">{d.doc_type}</td>
                  <td className="td font-mono text-ink/60">{d.uploaded_at?.slice(0, 10)}</td>
                  <td className="td text-right">
                    <button className="text-xs text-teal hover:underline" onClick={() => download(d.id)}>Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Upload document"
        footer={<><button className="btn-line" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={upload} disabled={busy}>{busy ? "Uploading…" : "Upload"}</button></>}>
        {banner && <div className="mb-3 rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{banner}</div>}
        <div className="space-y-3">
          {isStaff && (
            <Field label="Customer">
              <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select a customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Document type">
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {["identity", "policy", "claim"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="File">
            <input type="file" className="input" onChange={(e) => setFile(e.target.files[0])} />
            <span className="mt-1 block text-xs text-ink/40">pdf, png, jpg, jpeg, doc, docx · up to 16 MB</span>
          </Field>
        </div>
      </Modal>
    </>
  );
}
