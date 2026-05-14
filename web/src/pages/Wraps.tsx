import { useEffect, useState } from "react";
import { api, getApiErrorMessage } from "../api";
import { Link } from "react-router-dom";

type WrapItem = { id: string; name: string; date: string; notes?: string | null };
type Wrap = { id: string; title: string; kind: string; year: number; items: WrapItem[]; createdAt: string };

export default function Wraps() {
  const [wraps, setWraps] = useState<Wrap[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState(`Burger Wrap ${currentYear}`);
  const [kind, setKind] = useState("burgers");
  const [year, setYear] = useState(currentYear);
  const [err, setErr] = useState<string | null>(null);
  const totalItems = wraps.reduce((sum, wrap) => sum + wrap.items.length, 0);
  const activeWrap = wraps.find((wrap) => wrap.year === currentYear) ?? wraps[0];

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
      setTitle(`Burger Wrap ${year}`);
      setKind("burgers");
      await load();
    } catch (error) {
      setErr(getApiErrorMessage(error, "No pude crear el wrap."));
    }
  }

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">MVP privado</p>
          <h1>Conta tus burgers del ano sin convertirlo en una app gigante.</h1>
          <p className="hero-copy">
            Crea un contador por ano, carga cada burger con fecha y lugar, y al cierre tenes un resumen simple para compartir.
          </p>
        </div>
        <div className="hero-stats" aria-label="Resumen">
          <div>
            <span className="stat-label">Wraps</span>
            <strong>{wraps.length}</strong>
          </div>
          <div>
            <span className="stat-label">Burgers</span>
            <strong>{totalItems}</strong>
          </div>
          <div>
            <span className="stat-label">Activo</span>
            <strong>{activeWrap ? activeWrap.year : currentYear}</strong>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel compact-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Nuevo contador</p>
              <h2>Crear wrap</h2>
            </div>
          </div>
          <form className="form" onSubmit={createWrap}>
            <label>
              Nombre
              <input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <div className="field-row">
              <label>
                Ano
                <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
              </label>

              <label>
                Tipo
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  <option value="burgers">Burgers</option>
                  <option value="wraps">Wraps</option>
                  <option value="food">Comidas</option>
                </select>
              </label>
            </div>

            {err && <div className="error">{err}</div>}

            <button className="btn primary">Crear</button>
          </form>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Tus datos</p>
              <h2>Mis wraps</h2>
            </div>
          </div>
          {loading ? (
            <p className="muted">Cargando...</p>
          ) : wraps.length === 0 ? (
            <div className="empty-state">
              <strong>Arranca con el ano actual.</strong>
              <span>Despues solo vas sumando burgers cuando pasan.</span>
            </div>
          ) : (
            <div className="list">
              {wraps.map((w) => (
                <Link key={w.id} className="list-item" to={`/wraps/${w.id}`}>
                  <div>
                    <div className="list-title">{w.title}</div>
                    <div className="muted">{w.year} / {w.kind} / {w.items.length} cargadas</div>
                  </div>
                  <div className="count-badge">{w.items.length}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
