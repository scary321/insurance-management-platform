export default function EmptyState({ title, hint }) {
  return (
    <div className="text-center py-14">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full border-2 border-dashed border-line" />
      <p className="text-sm text-ink/70">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}
