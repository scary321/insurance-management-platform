import { useEffect, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import api, { apiMessage } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const money = (n) => "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/reports/summary")
      .then((r) => setData(r.data.data))
      .catch((e) => setError(apiMessage(e, "Could not load the dashboard.")));
  }, []);

  if (error) return <div className="card p-6 text-danger text-sm">{error}</div>;
  if (!data) return <div className="text-ink/40 text-sm">Loading dashboard…</div>;

  const totalPolicies = data.policies.active + data.policies.expired + data.policies.cancelled;
  const totalClaims = data.claims.pending + data.claims.approved + data.claims.rejected;

  const growth = {
    labels: data.customer_growth.map((d) => d.month.slice(5)),
    datasets: [{
      label: "Customers",
      data: data.customer_growth.map((d) => d.count),
      borderColor: "#1F5F5B",
      backgroundColor: "rgba(31,95,91,0.10)",
      fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: "#1F5F5B",
    }],
  };

  const premium = {
    labels: data.premium_by_month.map((d) => d.month.slice(5)),
    datasets: [{
      label: "Premium collected",
      data: data.premium_by_month.map((d) => d.amount),
      backgroundColor: "#C6803D",
      borderRadius: 4, barThickness: 22,
    }],
  };

  const claims = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [{
      data: [data.claims.approved, data.claims.pending, data.claims.rejected],
      backgroundColor: ["#1F7A4D", "#C4881F", "#B0433C"],
      borderWidth: 0,
    }],
  };

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9AA3A0", font: { family: "IBM Plex Mono", size: 11 } } },
      y: { grid: { color: "#EDEFEC" }, ticks: { color: "#9AA3A0", font: { family: "IBM Plex Mono", size: 11 } }, beginAtZero: true },
    },
  };

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active policies" value={data.policies.active} sub={`of ${totalPolicies} total`} accent />
        <StatCard label="Premium collected" value={money(data.premium.collected)} sub={`${money(data.premium.outstanding)} outstanding`} />
        <StatCard label="Open claims" value={data.claims.pending} sub={`of ${totalClaims} submitted`} />
        <StatCard label="Customers" value={data.customers} sub="registered" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="label">Customer growth · 6 months</div>
          </div>
          <div className="h-56"><Line data={growth} options={baseOpts} /></div>
        </div>
        <div className="card p-5">
          <div className="label mb-4">Claims by status</div>
          <div className="h-40 grid place-items-center"><Doughnut data={claims} options={{ responsive: true, maintainAspectRatio: false, cutout: "62%", plugins: { legend: { display: false } } }} /></div>
          <div className="mt-4 space-y-1.5">
            {[["Approved", data.claims.approved, "#1F7A4D"], ["Pending", data.claims.pending, "#C4881F"], ["Rejected", data.claims.rejected, "#B0433C"]].map(([l, v, c]) => (
              <div key={l} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink/70">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />{l}
                </span>
                <span className="font-mono tnum text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="label mb-4">Premium collection · 6 months</div>
        <div className="h-52"><Bar data={premium} options={baseOpts} /></div>
      </div>
    </>
  );
}
