import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Wraps from "./pages/Wraps";
import WrapDetail from "./pages/WrapDetail";
import PublicWrap from "./pages/PublicWrap";

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

  if (loading) return <div className="page"><div className="panel">Cargando...</div></div>;

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">BW</span>
            <span>Burger Wrap Counter</span>
          </Link>

          <div className="topbar-right">
            {me ? (
              <>
                <span className="user-pill">@{me.username}</span>
                <button className="btn ghost" onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <Link className="link" to="/login">Entrar</Link>
                <Link className="btn small" to="/register">Crear cuenta</Link>
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
        <Route path="/public/:slug" element={<PublicWrap />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
