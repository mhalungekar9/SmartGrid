import { useMemo, useState } from "react";
import { routeItems } from "../../utils/routes";
import { navigateTo } from "../../utils/navigation";

const spotlight = [
  { icon: "bi-command", title: "Command-first UX", text: "Find features quickly from the global search or GridNexa command palette." },
  { icon: "bi-sliders2", title: "Config by intent", text: "Header controls, toolbar tools, side panels, footer content, and presets are split into focused demos." },
  { icon: "bi-window-stack", title: "Real app surfaces", text: "Every demo is built like an external application with package CSS and copy-ready examples." },
  { icon: "bi-people", title: "Collaborative grids", text: "Provider-based presence, cell locks, conflict modes, and keyboard accessibility are documented together." },
];

export function FeatureIndex() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return routeItems;

    return routeItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          [group.title, item.label, item.path, item.description ?? "", ...(item.tags ?? [])]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.items.length);
  }, [normalizedQuery]);

  return (
    <div className="showcase-page">
      <section className="showcase-hero">
        <div>
          <span className="eyebrow">Feature index</span>
          <h2>Find the exact GridNexa capability you need</h2>
          <p>
            A fast, searchable map of the playground. Use it to jump into focused demos,
            implementation notes, and copy-ready configuration.
          </p>
        </div>
        <label className="global-doc-search feature-index-search">
          <i className="bi bi-search" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search features, configs, APIs..."
          />
        </label>
      </section>

      <section className="spotlight-grid" aria-label="Playground highlights">
        {spotlight.map((item) => (
          <article className="spotlight-card" key={item.title}>
            <i className={`bi ${item.icon}`} />
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </article>
        ))}
      </section>

      <section className="feature-directory" aria-label="Feature directory">
        {filteredGroups.map((group) => (
          <div className="feature-directory-group" key={group.title}>
            <div className="feature-directory-heading">
              <span>{group.title}</span>
              <small>{group.items.length} demos</small>
            </div>
            <div className="feature-directory-grid">
              {group.items.map((item) => (
                <button
                  className="feature-directory-card"
                  key={item.path}
                  type="button"
                  onClick={() => navigateTo(item.path)}
                >
                  <i className={`bi ${item.icon}`} />
                  <strong>{item.label}</strong>
                  <span>{item.description ?? "Open the live example and copy-ready setup."}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
