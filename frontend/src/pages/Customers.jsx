import { useEffect, useState, useCallback } from "react";
import api, { apiMessage } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import EmptyState from "../components/EmptyState.jsx";

const empty = { name: "", email: "", phone: "", dob: "", address: "" };

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");

  const load = useCallback(() => {
    api.get("/api/customers", { params: { q, page, per_page: 8 } })
      .then((r) => { setRows(r.data.data); setMeta({ page: r.data.page, pages: r.data.pages, total: r.data.total }); })
      .catch((e) => setBanner(apiMessage(e)));
  }, [q, page]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setErrors({});
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
    try {
      await api.post("/api/customers", payload);
      setOpen(false); setForm(empty); setPage(1); load();
    } catch (e) {
      setErrors(e.response?.data?.errors || {});
      setBanner(apiMessage(e));
    }
  }

  return (
    <>
      <PageHeader eyebrow="Records" title="Customers">
        <button className="btn-primary" onClick={() => { setForm(empty); setBanner(""); setOpen(true); }}>
          Register customer
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-line">
          <input
            className="input max-w-xs" placeholder="Search name, email or phone"
            value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
          <span className="ml-auto font-mono text-xs text-ink/40 tnum">{meta.total} total</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No customers yet" hint="Register your first customer to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">Name</th><th className="th">Email</th>
                <th className="th">Phone</th><th className="th text-right">Policies</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-paper/60">
                  <td className="td font-medium text-ink">{c.name}</td>
                  <td className="td">{c.email}</td>
                  <td className="td font-mono text-ink/70">{c.phone || "—"}</td>
                  <td className="td text-right font-mono tnum">{c.policy_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {meta.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="font-mono text-xs text-ink/45 tnum">Page {meta.page} / {meta.pages}</span>
            <button className="btn-ghost" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      <Modal
        open={open} onClose={() => setOpen(false)} title="Register customer"
        footer={<><button className="btn-line" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={save}>Save customer</button></>}
      >
        {banner && <div className="mb-3 rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{banner}</div>}
        <div className="space-y-3">
          <Field label="Full name" error={errors.name}>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" error={errors.email}>
              <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" error={errors.dob}>
              <input type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </Field>
            <Field label="Address" error={errors.address}>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
