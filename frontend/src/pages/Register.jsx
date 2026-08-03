import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiMessage } from "../api/client.js";
import Field from "../components/Field.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(apiMessage(err, "Unable to create account."));
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
            Your policies, premiums and claims — in one place.
          </h1>
          <p className="mt-4 text-white/55 text-sm max-w-sm">
            Create a customer account to view your policies, track premium
            payments, submit claims and manage your documents.
          </p>
        </div>
        <div className="font-mono text-xs text-white/30">
          Insurance Management Platform
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="inline-block h-6 w-1 rounded-full bg-bronze" />
            <span className="font-display text-lg text-ink">Assured</span>
          </div>
          <h2 className="font-display text-2xl text-ink">Create account</h2>
          <p className="text-sm text-ink/50 mt-1 mb-6">
            Customer accounts only. Staff accounts are created by an
            administrator.
          </p>

          <form onSubmit={submit} className="space-y-4">
            <Field label="Full name">
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field label="Email">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Field label="Confirm password">
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Field>
            {error && (
              <div className="rounded-lg bg-danger/10 text-danger text-sm px-3 py-2">
                {error}
              </div>
            )}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-4 text-sm text-ink/60">
            Already have an account?{" "}
            <Link to="/login" className="text-teal hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
