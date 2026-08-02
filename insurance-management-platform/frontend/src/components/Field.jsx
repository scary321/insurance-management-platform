export default function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="label block mb-1.5">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
