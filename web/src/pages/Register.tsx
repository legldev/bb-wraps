import { useState } from "react";
import { api, getApiErrorMessage } from "../api";
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
    } catch (error) {
      setErr(getApiErrorMessage(error, "No pude registrar. Revisa los datos."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-copy">
        <p className="eyebrow">Nuevo wrap</p>
        <h1>Arranca el contador y olvidate de la planilla.</h1>
        <p>Una cuenta privada alcanza para guardar tus burgers del ano y cerrar con estadisticas simples.</p>
      </section>

      <section className="panel auth-panel">
        <h2>Crear cuenta</h2>
        <p className="muted">Solo email, username y contrasena.</p>

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
          Ya tenes cuenta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </div>
  );
}
