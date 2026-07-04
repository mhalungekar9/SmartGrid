import { useEffect, useMemo, useState } from "react";
import { appRoutes } from "../utils/routes";

function getCurrentPath() {
  const path = window.location.pathname.replace(/\/$/, "");
  return path || "/";
}

export function AppRoutes() {
  const [path, setPath] = useState(getCurrentPath);
  const routes = useMemo(() => appRoutes, []);
  const activeRoute = routes.find((route) => route.path === path) ?? routes[0];
  const Page = activeRoute.component;

  useEffect(() => {
    const handleNavigation = () => setPath(getCurrentPath());

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("gridnexa:navigate", handleNavigation);

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("gridnexa:navigate", handleNavigation);
    };
  }, []);

  return <Page />;
}
