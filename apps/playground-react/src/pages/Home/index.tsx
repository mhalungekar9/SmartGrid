import { navigateTo } from "../../utils/navigation";
import { routeItems } from "../../utils/routes";

const stats = [
  ["22", "feature pages"],
  ["2", "themes"],
  ["100%", "hands-on examples"],
];

export function Home() {
  const featureRoutes = routeItems.flatMap((group) => group.items).filter((route) => route.path !== "/");

  return (
    <div className="home-page">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">GridNexa React</span>
          <h2>Every grid capability, shown as a focused developer example.</h2>
          <p>
            Explore focused examples, copy working React snippets, and learn how each GridNexa feature behaves in a real interface.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" type="button" onClick={() => navigateTo("/basic-grid")}>
              <i className="bi bi-play-circle me-2" />
              Start examples
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigateTo("/theme")}>
              <i className="bi bi-palette me-2" />
              Theme guide
            </button>
          </div>
        </div>
        <div className="stats-grid">
          {stats.map(([value, label]) => (
            <div className="stat-tile" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-index">
        {featureRoutes.map((route) => (
          <button className="feature-index-card" key={route.path} type="button" onClick={() => navigateTo(route.path)}>
            <i className={`bi ${route.icon}`} />
            <span>{route.label}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
