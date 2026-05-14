import { buildSocialStats } from "../socialWrapStats";

export type SocialWrapItem = {
  id: string;
  name: string;
  date: string;
  notes?: string | null;
};

export type SocialWrap = {
  title: string;
  kind: string;
  year: number;
  publicSlug?: string | null;
  items: SocialWrapItem[];
  user?: { username: string };
};

export default function SocialWrapCard({ wrap, publicUrl }: { wrap: SocialWrap; publicUrl?: string }) {
  const stats = buildSocialStats(wrap);
  const topMonth = stats.topMonth ? formatMonth(stats.topMonth.month) : "Sin mes top";
  const topPlace = stats.topPlace?.place ?? "Ruta secreta";
  const topBurger = stats.topItems[0]?.name ?? "Primera burger pendiente";

  return (
    <div className="social-card">
      <div className="social-card-glow" />
      <div className="social-card-top">
        <span>BURGER WRAP</span>
        <span>{wrap.year}</span>
      </div>

      <div className="social-card-main">
        <p className="social-owner">{wrap.user ? `@${wrap.user.username}` : "Mi wrap del ano"}</p>
        <h2>{stats.total}</h2>
        <p>{stats.total === 1 ? "burger registrada" : "burgers registradas"}</p>
      </div>

      <div className="social-card-grid">
        <div>
          <span>Mes top</span>
          <strong>{topMonth}</strong>
        </div>
        <div>
          <span>Lugar insignia</span>
          <strong>{topPlace}</strong>
        </div>
        <div>
          <span>Repetida</span>
          <strong>{topBurger}</strong>
        </div>
      </div>

      <div className="social-card-list">
        {stats.topItems.length === 0 ? (
          <div className="social-rank">
            <span>01</span>
            <strong>Carga tu primera burger</strong>
            <em>0</em>
          </div>
        ) : (
          stats.topItems.map((item, index) => (
            <div className="social-rank" key={item.name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.name}</strong>
              <em>{item.count}</em>
            </div>
          ))
        )}
      </div>

      <div className="social-card-bottom">
        <span>{wrap.title}</span>
        <span>{publicUrl ? publicUrl.replace(/^https?:\/\//, "") : "Burger Wrap Counter"}</span>
      </div>
    </div>
  );
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("es", { month: "long" });
}
