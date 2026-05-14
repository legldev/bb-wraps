import { useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Login({ onAuthed }: { onAuthed: () => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await onAuthed();
      nav("/wraps");
    } catch (error) {
      setErr(getApiErrorMessage(error, "No pude iniciar sesion. Revisa username/contrasena."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-copy">
        <p className="eyebrow">Burger Wrap Counter</p>
        <h1>Tu balance anual de burgers, privado y sin vueltas.</h1>
        <p>Entra, suma cada burger y deja que el resumen se arme solo.</p>
      </section>

      <section className="panel auth-panel">
        <h2>Entrar</h2>
        <p className="muted">Usa tu username y contrasena.</p>

        <form onSubmit={submit} className="form">
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {err && <div className="error">{err}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="muted">
          No tenes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </section>
    </div>
  );
}
