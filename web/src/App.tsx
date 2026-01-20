import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wraps from "./pages/Wraps";
import WrapDetail from "./pages/WrapDetail";

type Me = { id: string; email: string; username: string };

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function loadMe() {
    try {
      const data = await api<Me>("/api/me");
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function logout() {
    await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    setMe(null);
    nav("/login");
  }

  if (loading) return <div className="page"><div className="card">Cargando…</div></div>;

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">🍔 Burger Wraps</Link>

          <div className="topbar-right">
            {me ? (
              <>
                <span className="muted">@{me.username}</span>
                <button className="btn" onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <Link className="link" to="/login">Login</Link>
                <Link className="link" to="/register">Registro</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/" element={me ? <Navigate to="/wraps" /> : <Navigate to="/login" />} />
        <Route path="/login" element={<Login onAuthed={loadMe} />} />
        <Route path="/register" element={<Register onAuthed={loadMe} />} />

        <Route path="/wraps" element={me ? <Wraps /> : <Navigate to="/login" />} />
        <Route path="/wraps/:id" element={me ? <WrapDetail /> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
