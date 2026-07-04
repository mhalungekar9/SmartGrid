import type { AppTheme } from "../hooks/useTheme";
import { navigateTo } from "../utils/navigation";

interface HeaderProps {
  theme: AppTheme;
  sidebarCollapsed: boolean;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

export function Header({
  theme,
  sidebarCollapsed,
  onToggleTheme,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-title-wrap">
        <button
          className="btn btn-outline-secondary btn-sm sidebar-toggle"
          type="button"
          aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!sidebarCollapsed}
          onClick={onToggleSidebar}
        >
          <i className="bi bi-list" />
        </button>
        <div>
          <div className="eyebrow">React data grid playground</div>
          <h1>GridNexa Examples</h1>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-outline-secondary btn-sm"
          type="button"
          onClick={() => navigateTo("/")}
        >
          <i className="bi bi-house me-2" />
          Home
        </button>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={onToggleTheme}
        >
          <i className={`bi ${theme === "dark" ? "bi-sun" : "bi-moon"} me-2`} />
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
