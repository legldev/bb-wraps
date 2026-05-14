import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../api";
import SocialWrapCard, { type SocialWrap } from "../components/SocialWrapCard";
import { buildSocialStats } from "../socialWrapStats";

type PublicWrapData = SocialWrap & {
  id: string;
  createdAt: string;
};

export default function PublicWrap() {
  const { slug } = useParams();
  const [wrap, setWrap] = useState<PublicWrapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<PublicWrapData>(`/api/public/wraps/${slug}`);
        setWrap(data);
      } catch (err) {
        setError(getApiErrorMessage(err, "No encontre este wrap publico."));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const stats = useMemo(() => (wrap ? buildSocialStats(wrap) : null), [wrap]);

  if (loading) return <div className="page"><div className="panel">Cargando...</div></div>;
  if (error || !wrap || !stats) {
    return (
      <div className="page">
        <div className="panel">
          <p className="eyebrow">Wrap publico</p>
          <h1>No disponible</h1>
          <p className="muted">{error ?? "Este wrap no existe o dejo de ser publico."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page public-page">
      <section className="public-copy">
        <p className="eyebrow">Wrap publico</p>
        <h1>{wrap.title}</h1>
        <p>
          @{wrap.user?.username} registro {stats.total} {wrap.kind} en {wrap.year}.
        </p>
      </section>

      <div className="social-preview">
        <div>
          <SocialWrapCard wrap={wrap} publicUrl={window.location.href} />
        </div>
      </div>
    </div>
  );
}
