import { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

export const AppThemeContext = createContext<AppTheme>("dark");

export function useAppTheme() {
  return useContext(AppThemeContext);
}

const storageKey = "gridnexa-playground-theme";

function getInitialTheme(): AppTheme {
  const savedTheme = localStorage.getItem(storageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
    document.documentElement.dataset.appTheme = theme;
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () =>
      setTheme((currentTheme) =>
        currentTheme === "dark" ? "light" : "dark",
      ),
  };
}
