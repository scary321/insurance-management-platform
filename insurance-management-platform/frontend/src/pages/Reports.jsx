import { useEffect, useState } from "react";
import api, { apiMessage } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";

const API = import.meta.env.VITE_API_URL || "";
const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/api/reports/summary")
      .then((r) => setData(r.data.data))
      .catch((e) => setError(apiMessage(e, "Could not load the report.")));
  }, []);

  async function downloadPdf() {
    setBusy(true);
    try {
      const token = localStorage.getItem("imp_token");
      const res = await fetch(`${API}/api/reports/monthly.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "monthly_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not generate the PDF. Check that you are signed in as staff.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports">
        <button className="btn-primary" onClick={downloadPdf} disabled={busy}>
          {busy ? "Generating…" : "Download monthly PDF"}
        </button>
      </PageHeader>

      {error && <div className="card p-4 text-danger text-sm mb-4">{error}</div>}
      {!data ? (
        <div className="text-ink/40 text-sm">Loading report…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active policies" value={data.policies.active} accent />
            <StatCard label="Expired policies" value={data.policies.expired} />
            <StatCard label="Cancelled" value={data.policies.cancelled} />
            <StatCard label="Customers" value={data.customers} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-4">
            <div className="card p-6">
              <div className="label mb-4">Claims</div>
              <dl className="divide-y divide-line">
                {[["Pending", data.claims.pending], ["Approved", data.claims.approved], ["Rejected", data.claims.rejected]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <dt className="text-sm text-ink/70">{k}</dt>
                    <dd className="font-mono tnum text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card p-6">
              <div className="label mb-4">Premium collection</div>
              <dl className="divide-y divide-line">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-ink/70">Collected</dt>
                  <dd className="font-mono tnum text-ok">{money(data.premium.collected)}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-ink/70">Outstanding</dt>
                  <dd className="font-mono tnum text-warn">{money(data.premium.outstanding)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="mt-6 text-xs text-ink/40 font-mono">
            The monthly PDF is generated on the server with ReportLab and mirrors these figures.
          </p>
        </>
      )}
    </>
  );
}
