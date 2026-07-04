import { useEffect, useState } from "react";
import { navigateTo } from "../utils/navigation";
import { routeItems } from "../utils/routes";

function getCurrentPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

interface SidebarProps {
  collapsed: boolean;
  onNavigate: () => void;
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const [currentPath, setCurrentPath] = useState(getCurrentPath);

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
      <div className="brand-lockup">
        <span className="brand-mark">SG</span>
        <div>
          <strong>GridNexa</strong>
          <span>Developer docs</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="GridNexa examples">
        {routeItems.map((group) => (
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
