import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { Link } from "react-router-dom";

type WrapItem = { id: string; name: string; date: string; notes?: string | null };
type Wrap = { id: string; title: string; kind: string; year: number; items: WrapItem[]; createdAt: string };

export default function Wraps() {
  const [wraps, setWraps] = useState<Wrap[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("Burger Wrapped");
  const [kind, setKind] = useState("burgers");
  const [year, setYear] = useState(new Date().getFullYear());
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api<Wrap[]>("/api/wraps");
      setWraps(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createWrap(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/api/wraps", {
        method: "POST",
        body: JSON.stringify({ title, kind, year: Number(year) }),
      });
      await load();
    } catch (error) {
      setErr(getApiErrorMessage(error, "No pude crear el wrap."));
    }
  }

  return (
    <div className="page">
      <div className="grid">
        <div className="card">
          <h2>Crear wrap</h2>
          <form className="form" onSubmit={createWrap}>
            <label>
              Título
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <label>
              Tipo (kind)
              <input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="burgers" />
            </label>

            <label>
              Año
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </label>

            {err && <div className="error">{err}</div>}

            <button className="btn primary">Crear</button>
          </form>
        </div>

        <div className="card">
          <h2>Mis wraps</h2>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : wraps.length === 0 ? (
            <p className="muted">Todavía no tienes wraps.</p>
          ) : (
            <div className="list">
              {wraps.map((w) => (
                <Link key={w.id} className="list-item" to={`/wraps/${w.id}`}>
                  <div>
                    <div className="list-title">{w.title}</div>
                    <div className="muted">{w.kind} • {w.year} • {w.items.length} items</div>
                  </div>
                  <div className="chev">›</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
