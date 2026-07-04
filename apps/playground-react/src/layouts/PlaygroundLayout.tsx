import type { PropsWithChildren } from "react";
import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function PlaygroundLayout({ children }: PropsWithChildren) {
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
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
  );
}
