import { useEffect, useState, useCallback } from "react";
import api, { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Modal from "../components/Modal.jsx";
import Field from "../components/Field.jsx";
import StatusPill from "../components/StatusPill.jsx";
import EmptyState from "../components/EmptyState.jsx";

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
const FILTERS = ["all", "active", "expired", "cancelled"];

export default function Policies() {
  const { isStaff } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", policy_type: "Health", premium_amount: "", start_date: "", end_date: "" });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState("");

  const load = useCallback(() => {
    const params = { page, per_page: 8 };
    if (status !== "all") params.status = status;
    api.get("/api/policies", { params })
      .then((r) => { setRows(r.data.data); setMeta({ page: r.data.page, pages: r.data.pages, total: r.data.total }); })
      .catch((e) => setBanner(apiMessage(e)));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/api/customers", { params: { per_page: 100 } }).then((r) => setCustomers(r.data.data)).catch(() => {}); }, []);

  async function create() {
    setErrors({});
    try {
      await api.post("/api/policies", { ...form, customer_id: Number(form.customer_id), premium_amount: Number(form.premium_amount) });
      setOpen(false); setPage(1); load();
    } catch (e) { setErrors(e.response?.data?.errors || {}); setBanner(apiMessage(e)); }
  }

  async function act(id, verb) {
    try {
      const body = verb === "renew"
        ? { end_date: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10) }
        : {};
      await api.post(`/api/policies/${id}/${verb}`, body);
      load();
    } catch (e) { setBanner(apiMessage(e)); }
  }

  return (
    <>
      <PageHeader eyebrow="Coverage" title="Policies">
        {isStaff && (
          <button className="btn-primary" onClick={() => { setBanner(""); setOpen(true); }}>Create policy</button>
        )}
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-1.5 p-4 border-b border-line">
          {FILTERS.map((f) => (
            <button key={f}
              onClick={() => { setPage(1); setStatus(f); }}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                status === f ? "bg-teal text-white" : "text-ink/60 hover:bg-ink/5"}`}>
              {f}
            </button>
          ))}
          <span className="ml-auto font-mono text-xs text-ink/40 tnum">{meta.total} total</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState title="No policies here" hint="Create a policy or switch filters." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <th className="th">Policy no.</th><th className="th">Customer</th>
              <th className="th">Type</th><th className="th text-right">Premium</th>
              <th className="th">Expires</th><th className="th">Status</th>
              {isStaff && <th className="th text-right">Actions</th>}
            </tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="td font-mono text-teal">{p.policy_number}</td>
                  <td className="td text-ink">{p.customer_name}</td>
                  <td className="td">{p.policy_type}</td>
                  <td className="td text-right font-mono tnum">{money(p.premium_amount)}</td>
                  <td className="td font-mono text-ink/70">{p.end_date}</td>
                  <td className="td"><StatusPill status={p.status} /></td>
                  {isStaff && (
                    <td className="td text-right whitespace-nowrap">
                      {p.status !== "cancelled" && (
                        <>
                          <button className="text-xs text-teal hover:underline" onClick={() => act(p.id, "renew")}>Renew</button>
                          <span className="mx-2 text-line">|</span>
                          <button className="text-xs text-danger hover:underline" onClick={() => act(p.id, "cancel")}>Cancel</button>
                        </>
                      )}
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

      <Modal open={open} onClose={() => setOpen(false)} title="Create policy"
        footer={<><button className="btn-line" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={create}>Issue policy</button></>}>
        {banner && <div className="mb-3 rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{banner}</div>}
        <div className="space-y-3">
          <Field label="Customer" error={errors.customer_id}>
            <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select a customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Policy type" error={errors.policy_type}>
              <select className="input" value={form.policy_type} onChange={(e) => setForm({ ...form, policy_type: e.target.value })}>
                {["Life", "Health", "Auto", "Property", "Travel"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Premium amount" error={errors.premium_amount}>
              <input type="number" className="input" value={form.premium_amount} onChange={(e) => setForm({ ...form, premium_amount: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" error={errors.start_date}>
              <input type="date" className="input" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label="End date" error={errors.end_date}>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  );
}
