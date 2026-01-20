import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, getApiErrorMessage } from "../api";

type WrapItem = { id: string; name: string; date: string; notes?: string | null };
type Wrap = { id: string; title: string; kind: string; year: number; items: WrapItem[]; createdAt: string };

export default function WrapDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [wrap, setWrap] = useState<Wrap | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const wraps = await api<Wrap[]>("/api/wraps");
      const found = wraps.find((w) => w.id === id) || null;
      setWrap(found);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => {
    if (!wrap) return null;
    const total = wrap.items.length;
    const byMonth: Record<string, number> = {};
    for (const it of wrap.items) {
      const m = new Date(it.date).toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    }
    return { total, byMonth };
  }, [wrap]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!id) return;

    try {
      await api(`/api/wraps/${id}/items`, {
        method: "POST",
        body: JSON.stringify({
          name,
          date: new Date(date + "T12:00:00").toISOString(),
          notes: notes || undefined,
        }),
      });
      setName("");
      setNotes("");
      await load();
    } catch (error) {
      setErr(getApiErrorMessage(error, "No pude agregar el item."));
    }
  }

  async function removeWrap() {
    if (!id) return;
    await api(`/api/wraps/${id}`, { method: "DELETE" });
    nav("/wraps");
  }

  if (loading) return <div className="page"><div className="card">Cargando…</div></div>;
  if (!wrap) return <div className="page"><div className="card">Wrap no encontrado.</div></div>;

  return (
    <div className="page">
      <div className="card">
        <div className="row">
          <div>
            <h1 style={{ margin: 0 }}>{wrap.title}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {wrap.kind} • {wrap.year} • {wrap.items.length} items
            </p>
          </div>
          <button className="btn danger" onClick={removeWrap}>Eliminar wrap</button>
        </div>

        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid">
        <div className="card">
          <h2>Agregar item</h2>
          <form className="form" onSubmit={addItem}>
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder='Ej: Big Mac' />
            </label>

            <label>
              Fecha
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <label>
              Lugar
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: mcdonalds" />
            </label>

            {err && <div className="error">{err}</div>}

            <button className="btn primary">Agregar</button>
          </form>
        </div>

        <div className="card">
          <h2>Items</h2>
          {wrap.items.length === 0 ? (
            <p className="muted">Todavía no hay items.</p>
          ) : (
            <div className="list">
              {wrap.items.map((it) => (
                <div key={it.id} className="list-item" style={{ cursor: "default" }}>
                  <div>
                    <div className="list-title">{it.name}</div>
                    <div className="muted">
                      {new Date(it.date).toLocaleDateString()} {it.notes ? `• ${it.notes}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
