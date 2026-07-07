import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { AppThemeContext, useTheme } from "../hooks/useTheme";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function PlaygroundLayout({ children }: PropsWithChildren) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [path, setPath] = useState(() => window.location.pathname);
  const isHome = path.replace(/\/$/, "") === "";

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname);

    window.addEventListener("popstate", syncPath);
    window.addEventListener("gridnexa:navigate", syncPath);

    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener("gridnexa:navigate", syncPath);
    };
  }, []);

  if (isHome || path === "/") {
    return <main className="marketing-shell">{children}</main>;
  }

  return (
    <AppThemeContext.Provider value={theme}>
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onNavigate={() => {
          if (window.matchMedia("(max-width: 1100px)").matches) {
            setSidebarCollapsed(true);
          }
        }}
      />
      <div className="app-main">
        <Header
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
          onToggleTheme={toggleTheme}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
    </AppThemeContext.Provider>
  );
}
