export default function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="card p-5">
      <div className="label">{label}</div>
      <div className={`mt-2 font-display text-[30px] leading-none tnum ${accent ? "text-bronze" : "text-ink"}`}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-ink/45 font-mono tnum">{sub}</div>}
    </div>
  );
}
