import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import { api, getApiErrorMessage } from "../api";
import SocialWrapCard from "../components/SocialWrapCard";

type WrapItem = { id: string; name: string; date: string; notes?: string | null };
type Wrap = {
  id: string;
  title: string;
  kind: string;
  year: number;
  publicSlug?: string | null;
  items: WrapItem[];
  createdAt: string;
};

export default function WrapDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [wrap, setWrap] = useState<Wrap | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const socialCardRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) return;
      const found = await api<Wrap>(`/api/wraps/${id}`);
      setWrap(found);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    if (!wrap) return null;
    const total = wrap.items.length;
    const byMonth: Record<string, number> = {};
    for (const it of wrap.items) {
      const m = new Date(it.date).toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    }
    const monthly = Object.entries(byMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    const topMonth = monthly.reduce<{ month: string; count: number } | null>(
      (best, current) => (!best || current.count > best.count ? current : best),
      null
    );
    const lastItem = wrap.items[0] ?? null;
    return { total, monthly, topMonth, lastItem };
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
    const ok = window.confirm("Eliminar este wrap y todas sus burgers?");
    if (!ok) return;
    await api(`/api/wraps/${id}`, { method: "DELETE" });
    nav("/wraps");
  }

  async function removeItem(itemId: string) {
    if (!id) return;
    await api(`/api/wraps/${id}/items/${itemId}`, { method: "DELETE" });
    await load();
  }

  async function copySummary() {
    if (!wrap || !stats) return;
    const monthText = stats.topMonth
      ? `Mi mes mas fuerte fue ${formatMonth(stats.topMonth.month)} con ${stats.topMonth.count}.`
      : "Todavia no tengo mes ganador.";
    const text = `${wrap.title}: comi ${stats.total} ${wrap.kind} en ${wrap.year}. ${monthText}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function setPublic(isPublic: boolean) {
    if (!id) return;
    setPublishing(true);
    setShareStatus(null);
    try {
      const updated = await api<Wrap>(`/api/wraps/${id}/public`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic }),
      });
      setWrap(updated);
    } catch (error) {
      setShareStatus(getApiErrorMessage(error, "No pude actualizar el link publico."));
    } finally {
      setPublishing(false);
    }
  }

  async function copyPublicLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setShareStatus("Link copiado.");
  }

  async function renderSocialImage() {
    if (!socialCardRef.current) return null;
    return toPng(socialCardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#111111",
      width: 1080,
      height: 1350,
      style: {
        width: "1080px",
        height: "1350px",
      },
    });
  }

  async function downloadSocialImage() {
    if (!wrap) return;
    const dataUrl = await renderSocialImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `${slugify(wrap.title)}-${wrap.year}.png`;
    link.href = dataUrl;
    link.click();
    setShareStatus("Imagen descargada.");
  }

  async function shareSocialImage() {
    if (!wrap) return;
    const dataUrl = await renderSocialImage();
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `${slugify(wrap.title)}-${wrap.year}.png`, { type: "image/png" });
    const shareData = {
      title: wrap.title,
      text: `${wrap.title}: ${stats?.total ?? 0} ${wrap.kind} en ${wrap.year}.`,
      url: publicUrl,
      files: [file],
    };

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share(shareData);
      setShareStatus("Compartido.");
      return;
    }

    await downloadSocialImage();
  }

  if (loading) return <div className="page"><div className="panel">Cargando...</div></div>;
  if (!wrap) return <div className="page"><div className="panel">Wrap no encontrado.</div></div>;

  const publicUrl = wrap.publicSlug ? `${window.location.origin}/public/${wrap.publicSlug}` : "";

  return (
    <div className="page">
      <section className="panel wrap-header">
        <div className="row">
          <div>
            <p className="eyebrow">{wrap.year} / {wrap.kind}</p>
            <h1>{wrap.title}</h1>
            <p className="muted">
              Tu cuenta personal para llegar a diciembre con numeros claros.
            </p>
          </div>
          <div className="actions">
            <button className="btn" onClick={copySummary}>{copied ? "Copiado" : "Copiar resumen"}</button>
            <button className="btn danger" onClick={removeWrap}>Eliminar</button>
          </div>
        </div>

        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Mes top</div>
              <div className="stat-value small-stat">
                {stats.topMonth ? `${formatMonth(stats.topMonth.month)} (${stats.topMonth.count})` : "Sin datos"}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Ultima</div>
              <div className="stat-value small-stat">
                {stats.lastItem ? stats.lastItem.name : "Sin datos"}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="panel compact-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Carga rapida</p>
              <h2>Agregar burger</h2>
            </div>
          </div>
          <form className="form" onSubmit={addItem}>
            <label>
              Nombre
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Big Mac" autoFocus />
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
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Historial</p>
              <h2>Burgers cargadas</h2>
            </div>
          </div>
          {wrap.items.length === 0 ? (
            <div className="empty-state">
              <strong>Todavia no hay burgers.</strong>
              <span>Cuando cargues la primera, aparece aca con fecha y lugar.</span>
            </div>
          ) : (
            <div className="list">
              {wrap.items.map((it) => (
                <div key={it.id} className="list-item static-item">
                  <div>
                    <div className="list-title">{it.name}</div>
                    <div className="muted">
                      {new Date(it.date).toLocaleDateString()} {it.notes ? `/ ${it.notes}` : ""}
                    </div>
                  </div>
                  <button className="icon-btn" aria-label={`Eliminar ${it.name}`} onClick={() => removeItem(it.id)}>
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {stats && stats.monthly.length > 0 && (
        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Resumen</p>
              <h2>Por mes</h2>
            </div>
          </div>
          <div className="bar-chart">
            {stats.monthly.map((item) => {
              const max = Math.max(...stats.monthly.map((month) => month.count));
              return (
                <div className="bar-row" key={item.month}>
                  <span>{formatMonth(item.month)}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
                  </div>
                  <strong>{item.count}</strong>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="share-studio">
        <div className="panel share-controls">
          <p className="eyebrow">Social wrap</p>
          <h2>Imagen lista para redes</h2>
          <p className="muted">
            Publica un link de solo lectura y descarga una placa vertical para stories o feed.
          </p>

          <div className="share-url-box">
            <span>{publicUrl || "Publica el wrap para generar un link"}</span>
            {publicUrl && <button className="btn small" onClick={copyPublicLink}>Copiar link</button>}
          </div>

          <div className="actions">
            {publicUrl ? (
              <button className="btn" disabled={publishing} onClick={() => setPublic(false)}>
                {publishing ? "Actualizando..." : "Despublicar"}
              </button>
            ) : (
              <button className="btn" disabled={publishing} onClick={() => setPublic(true)}>
                {publishing ? "Generando..." : "Crear link publico"}
              </button>
            )}
            <button className="btn primary" onClick={downloadSocialImage}>Descargar PNG</button>
            <button className="btn primary" onClick={shareSocialImage}>Compartir</button>
          </div>

          {shareStatus && <div className="success">{shareStatus}</div>}
        </div>

        <div className="social-preview">
          <div ref={socialCardRef}>
            <SocialWrapCard wrap={wrap} publicUrl={publicUrl} />
          </div>
        </div>
      </section>
    </div>
  );
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("es", { month: "short" });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "burger-wrap";
}
