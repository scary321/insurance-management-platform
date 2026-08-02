export default function PageHeader({ eyebrow, title, children }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="label mb-1">{eyebrow}</div>}
        <h1 className="font-display text-[26px] leading-none text-ink">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
