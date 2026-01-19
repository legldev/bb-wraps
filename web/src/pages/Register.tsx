import { useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Register({ onAuthed }: { onAuthed: () => Promise<void> }) {
  const [email, setEmail] = useState("");
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
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });
      await onAuthed();
      nav("/wraps");
    } catch {
      setErr("No pude registrar. Capaz email o username ya existe, o el password es corto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Registro</h1>
        <p className="muted">Solo lo mínimo: email, username y password.</p>

        <form onSubmit={submit} className="form">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {err && <div className="error">{err}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="muted">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}