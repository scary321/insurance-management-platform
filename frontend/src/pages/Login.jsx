import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiMessage } from "../api/client.js";
import Field from "../components/Field.jsx";

const DEMO = [
  ["Administrator", "admin@insure.dev", "admin123"],
  ["Agent", "agent@insure.dev", "agent123"],
  ["Customer", "customer@insure.dev", "customer123"],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@insure.dev");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(apiMessage(err, "Unable to sign in."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-pine text-white p-12">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-6 w-1 rounded-full bg-bronze" />
          <span className="font-display text-lg">Assured</span>
        </div>
        <div>
          <div className="label text-white/40 mb-3">Policy Ledger</div>
          <h1 className="font-display text-4xl leading-tight max-w-md">
            Every policy, claim and premium in one accountable place.
          </h1>
          <p className="mt-4 text-white/55 text-sm max-w-sm">
            Register customers, issue policies, track premiums and settle claims — from
            first contact to final payout.
          </p>
        </div>
        <div className="font-mono text-xs text-white/30">Insurance Management Platform</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="inline-block h-6 w-1 rounded-full bg-bronze" />
            <span className="font-display text-lg text-ink">Assured</span>
          </div>
          <h2 className="font-display text-2xl text-ink">Sign in</h2>
          <p className="text-sm text-ink/50 mt-1 mb-6">Use a demo account below to explore.</p>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input className="input" type="email" value={email}
                     onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={password}
                     onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            {error && (
              <div className="rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">{error}</div>
            )}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-4">
            <div className="label mb-2">Demo accounts</div>
            <div className="space-y-1.5">
              {DEMO.map(([role, e, p]) => (
                <button
                  key={e}
                  onClick={() => { setEmail(e); setPassword(p); }}
                  className="w-full flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2 text-left hover:border-teal transition-colors"
                >
                  <span className="text-sm text-ink/80">{role}</span>
                  <span className="font-mono text-xs text-ink/45">{e}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
