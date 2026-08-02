const MAP = {
  active:   "bg-ok/10 text-ok",
  approved: "bg-ok/10 text-ok",
  paid:     "bg-ok/10 text-ok",
  pending:  "bg-warn/10 text-warn",
  overdue:  "bg-danger/10 text-danger",
  expired:  "bg-danger/10 text-danger",
  rejected: "bg-danger/10 text-danger",
  cancelled:"bg-ink/8 text-ink/50",
};

export default function StatusPill({ status }) {
  const cls = MAP[status] || "bg-ink/8 text-ink/60";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
