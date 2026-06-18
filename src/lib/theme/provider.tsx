"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Theme } from "@/i18n/config";

type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
  setTheme: (theme: Theme) => void;
};

const THEME_OPTIONS: Theme[] = ["light", "dark", "system"];
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

function applyTheme(theme: Theme, systemTheme: ResolvedTheme) {
  const resolvedTheme = resolveTheme(theme, systemTheme);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);

    function updateSystemTheme() {
      const nextSystemTheme = mediaQuery.matches ? "dark" : "light";
      setSystemTheme(nextSystemTheme);
      setThemeState((currentTheme) => {
        applyTheme(currentTheme, nextSystemTheme);
        return currentTheme;
      });
    }

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      applyTheme(nextTheme, systemTheme);
    },
    [systemTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: resolveTheme(theme, systemTheme),
      systemTheme,
      themes: THEME_OPTIONS,
      setTheme,
    }),
    [setTheme, systemTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme phải được dùng bên trong ThemeProvider");
  }
  return context;
}
