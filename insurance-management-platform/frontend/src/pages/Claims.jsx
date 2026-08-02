import { useEffect, useState, useCallback } from "react";
import api, { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import StatusPill from "../components/StatusPill.jsx";
import EmptyState from "../components/EmptyState.jsx";

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const FILTERS = ["all", "pending", "approved", "rejected"];

export default function Claims() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ policy_id: "", claim_amount: "", reason: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");

  const load = useCallback(() => {
    const params = { page, per_page: 8 };
    if (status !== "all") params.status = status;
    api.get("/api/claims", { params })
      .then((r) => { setRows(r.data.data); setMeta({ page: r.data.page, pages: r.data.pages, total: r.data.total }); })
      .catch((e) => setBanner(apiMessage(e)));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/api/policies", { params: { per_page: 100, status: "active" } }).then((r) => setPolicies(r.data.data)).catch(() => {}); }, []);

  async function submit() {
    setErrors({});
    try {
      await api.post("/api/claims", { ...form, policy_id: Number(form.policy_id), claim_amount: Number(form.claim_amount) });
      setOpen(false); setForm({ policy_id: "", claim_amount: "", reason: "" }); setPage(1); load();
    } catch (e) { setErrors(e.response?.data?.errors || {}); setBanner(apiMessage(e)); }
  }

  async function review(id, verb) {
    try { await api.post(`/api/claims/${id}/${verb}`, {}); load(); }
    catch (e) { setBanner(apiMessage(e)); }
  }

  return (
    <>
      <PageHeader eyebrow="Settlements" title="Claims">
        <button className="btn-primary" onClick={() => { setBanner(""); setOpen(true); }}>Submit claim</button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-1.5 p-4 border-b border-line">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => { setPage(1); setStatus(f); }}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                status === f ? "bg-teal text-white" : "text-ink/60 hover:bg-ink/5"}`}>{f}</button>
          ))}
          <span className="ml-auto font-mono text-xs text-ink/40 tnum">{meta.total} total</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No claims here" hint="Submit a claim or switch filters." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <th className="th">Policy no.</th><th className="th">Reason</th>
              <th className="th text-right">Amount</th><th className="th">Submitted</th>
              <th className="th">Status</th>
              {isStaff && <th className="th text-right">Review</th>}
            </tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-paper/60 align-top">
                  <td className="td font-mono text-teal">{c.policy_number}</td>
                  <td className="td max-w-xs">{c.reason}</td>
                  <td className="td text-right font-mono tnum">{money(c.claim_amount)}</td>
                  <td className="td font-mono text-ink/60">{c.submission_date?.slice(0, 10)}</td>
                  <td className="td"><StatusPill status={c.status} /></td>
                  {isStaff && (
                    <td className="td text-right whitespace-nowrap">
                      {c.status === "pending" ? (
                        <>
                          <button className="text-xs text-ok hover:underline" onClick={() => review(c.id, "approve")}>Approve</button>
                          <span className="mx-2 text-line">|</span>
                          <button className="text-xs text-danger hover:underline" onClick={() => review(c.id, "reject")}>Reject</button>
                        </>
                      ) : <span className="text-xs text-ink/30">—</span>}
                    </td>
                  )}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Submit claim"
        footer={<><button className="btn-line" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={submit}>Submit</button></>}>
        {banner && <div className="mb-3 rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{banner}</div>}
        <div className="space-y-3">
          <Field label="Policy" error={errors.policy_id}>
            <select className="input" value={form.policy_id} onChange={(e) => setForm({ ...form, policy_id: e.target.value })}>
              <option value="">Select a policy</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.policy_number} — {p.customer_name}</option>)}
            </select>
          </Field>
          <Field label="Claim amount" error={errors.claim_amount}>
            <input type="number" className="input" value={form.claim_amount} onChange={(e) => setForm({ ...form, claim_amount: e.target.value })} />
          </Field>
          <Field label="Reason" error={errors.reason}>
            <textarea rows={3} className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
