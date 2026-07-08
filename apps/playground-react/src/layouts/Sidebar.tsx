import { useEffect, useState } from "react";
import { navigateTo } from "../utils/navigation";
import { routeItems } from "../utils/routes";
import gridNexaMark from "../assets/GridNexa-Without-Text-Logo-transparent.png";

function getCurrentPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

interface SidebarProps {
  collapsed: boolean;
  onNavigate: () => void;
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = routeItems
    .map((group) => ({
      ...group,
      items: collapsed || !normalizedQuery
        ? group.items
        : group.items.filter((item) =>
            [group.title, item.label, item.path, item.description ?? "", ...(item.tags ?? [])]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery),
          ),
    }))
    .filter((group) => group.items.length);

  useEffect(() => {
    const syncPath = () => setCurrentPath(getCurrentPath());

    window.addEventListener("popstate", syncPath);
    window.addEventListener("gridnexa:navigate", syncPath);

    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("gridnexa:navigate", syncPath);
    };
  }, []);

  return (
    <aside className="app-sidebar" aria-label="Primary navigation" data-collapsed={collapsed}>
      <button
        className="brand-lockup"
        type="button"
        onClick={() => {
          navigateTo("/");
          onNavigate();
        }}
      >
        <span className="brand-mark">
          <img src={gridNexaMark} alt="" aria-hidden="true" />
        </span>
        <div>
          <strong>GridNexa</strong>
          <span>Developer docs</span>
        </div>
      </button>

      {!collapsed ? (
        <label className="sidebar-search">
          <i className="bi bi-search" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter pages..."
          />
        </label>
      ) : null}

      <nav className="sidebar-nav" aria-label="GridNexa examples">
        {filteredGroups.map((group) => (
          <div className="sidebar-group" key={group.title}>
            <div className="sidebar-heading">{group.title}</div>
            {group.items.map((item) => {
              const active = item.path === currentPath;

              return (
                <button
                  className={`sidebar-link${active ? " active" : ""}`}
                  key={item.path}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    navigateTo(item.path);
                    onNavigate();
                  }}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
