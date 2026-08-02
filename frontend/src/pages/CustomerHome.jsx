import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import EmptyState from "../components/EmptyState.jsx";

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

// A customer's landing view, built entirely from their own scoped records.
export default function CustomerHome() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [premiums, setPremiums] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/policies", { params: { per_page: 100 } }),
      api.get("/api/claims", { params: { per_page: 100 } }),
      api.get("/api/premiums", { params: { per_page: 100 } }),
    ])
      .then(([p, c, pr]) => { setPolicies(p.data.data); setClaims(c.data.data); setPremiums(pr.data.data); })
      .catch((e) => setError(apiMessage(e, "Could not load your account.")));
  }, []);

  if (error) return <div className="card p-6 text-danger text-sm">{error}</div>;

  const active = policies.filter((p) => p.status === "active").length;
  const openClaims = claims.filter((c) => c.status === "pending").length;
  const outstanding = premiums
    .filter((p) => p.payment_status !== "paid")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const firstName = (user?.name || "").split(" ")[0];

  return (
    <>
      <PageHeader eyebrow="Your account" title={firstName ? `Welcome, ${firstName}` : "Welcome"}>
        <Link to="/claims" className="btn-primary">File a claim</Link>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active policies" value={active} sub={`of ${policies.length} total`} accent />
        <StatCard label="Open claims" value={openClaims} sub={`of ${claims.length} filed`} />
        <StatCard label="Amount due" value={money(outstanding)} sub="pending + overdue" />
        <StatCard label="Documents" value="—" sub="upload in Documents" />
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div className="label">Your policies</div>
          <Link to="/policies" className="text-xs text-teal hover:underline">View all</Link>
        </div>
        {policies.length === 0 ? (
          <EmptyState title="No policies on file" hint="Your agent will set these up for you." />
        ) : (
          <table className="w-full">
            <thead><tr>
              <th className="th">Policy no.</th><th className="th">Type</th>
              <th className="th text-right">Premium</th><th className="th">Expires</th><th className="th">Status</th>
            </tr></thead>
            <tbody>
              {policies.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-paper/60">
                  <td className="td font-mono text-teal">{p.policy_number}</td>
                  <td className="td">{p.policy_type}</td>
                  <td className="td text-right font-mono tnum">{money(p.premium_amount)}</td>
                  <td className="td font-mono text-ink/70">{p.end_date}</td>
                  <td className="td"><StatusPill status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
