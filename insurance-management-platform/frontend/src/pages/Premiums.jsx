import { useEffect, useState, useCallback } from "react";
import api, { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import StatusPill from "../components/StatusPill.jsx";
import EmptyState from "../components/EmptyState.jsx";

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const FILTERS = ["all", "paid", "pending", "overdue"];

export default function Premiums() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ policy_id: "", amount: "", due_date: "", payment_status: "paid" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");

  const load = useCallback(() => {
    const params = { page, per_page: 8 };
    if (status !== "all") params.status = status;
    api.get("/api/premiums", { params })
      .then((r) => { setRows(r.data.data); setMeta({ page: r.data.page, pages: r.data.pages, total: r.data.total }); })
      .catch((e) => setBanner(apiMessage(e)));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/api/policies", { params: { per_page: 100 } }).then((r) => setPolicies(r.data.data)).catch(() => {}); }, []);

  async function record() {
    setErrors({});
    const payload = { ...form, policy_id: Number(form.policy_id), amount: Number(form.amount) };
    if (!payload.due_date) delete payload.due_date;
    try {
      await api.post("/api/premiums", payload);
      setOpen(false); setForm({ policy_id: "", amount: "", due_date: "", payment_status: "paid" }); setPage(1); load();
    } catch (e) { setErrors(e.response?.data?.errors || {}); setBanner(apiMessage(e)); }
  }

  return (
    <>
      <PageHeader eyebrow="Billing" title="Premiums">
        {isStaff && (
          <button className="btn-primary" onClick={() => { setBanner(""); setOpen(true); }}>Record payment</button>
        )}
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
          <EmptyState title="No payments here" hint="Record a payment or switch filters." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <th className="th">Policy no.</th><th className="th text-right">Amount</th>
              <th className="th">Due</th><th className="th">Paid</th><th className="th">Status</th>
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="td font-mono text-teal">{p.policy_number}</td>
                  <td className="td text-right font-mono tnum">{money(p.amount)}</td>
                  <td className="td font-mono text-ink/60">{p.due_date || "—"}</td>
                  <td className="td font-mono text-ink/60">{p.payment_date || "—"}</td>
                  <td className="td"><StatusPill status={p.payment_status} /></td>
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

      <Modal open={open} onClose={() => setOpen(false)} title="Record premium payment"
        footer={<><button className="btn-line" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={record}>Record</button></>}>
        {banner && <div className="mb-3 rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{banner}</div>}
        <div className="space-y-3">
          <Field label="Policy" error={errors.policy_id}>
            <select className="input" value={form.policy_id} onChange={(e) => setForm({ ...form, policy_id: e.target.value })}>
              <option value="">Select a policy</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.policy_number} — {p.customer_name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" error={errors.amount}>
              <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Status" error={errors.payment_status}>
              <select className="input" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                {["paid", "pending", "overdue"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Due date" error={errors.due_date}>
            <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
