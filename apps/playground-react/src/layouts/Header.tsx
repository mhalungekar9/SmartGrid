import { useEffect, useMemo, useRef, useState } from "react";
import type { AppTheme } from "../hooks/useTheme";
import { navigateTo } from "../utils/navigation";
import { appRoutes, routeItems } from "../utils/routes";

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
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchableRoutes = useMemo(
    () =>
      appRoutes.map((route) => {
        const group = routeItems.find((entry) => entry.items.some((item) => item.path === route.path));
        return { ...route, groupTitle: group?.title ?? "Home" };
      }),
    [],
  );
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchableRoutes.filter((route) => route.path !== "/").slice(0, 8);

    return searchableRoutes
      .filter((route) =>
        [route.label, route.path, route.description ?? "", route.groupTitle, ...(route.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, 10);
  }, [query, searchableRoutes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "/") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const goToResult = (path: string) => {
    navigateTo(path);
    setOpen(false);
    setQuery("");
  };

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
        <div className="global-search" role="search" ref={searchRef}>
          <i className="bi bi-search" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            placeholder="Search docs..."
            aria-label="Search GridNexa playground"
          />
          <kbd>Ctrl+/</kbd>
          {open ? (
            <div className="global-search-popover" role="listbox">
              {searchResults.map((route) => (
                <button key={route.path} type="button" onMouseDown={() => goToResult(route.path)}>
                  <i className={`bi ${route.icon}`} />
                  <span>
                    <strong>{route.label}</strong>
                    <small>{route.groupTitle} · {route.description ?? route.path}</small>
                  </span>
                </button>
              ))}
              {!searchResults.length ? <div className="global-search-empty">No matching docs found</div> : null}
            </div>
          ) : null}
        </div>
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
