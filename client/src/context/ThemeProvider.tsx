import React, { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type ThemeMode } from "./ThemeContext";

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode | string>(() => {
    return (
      document.documentElement.dataset.theme ||
      localStorage.getItem("stockroom-theme") ||
      "dark"
    );
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("stockroom-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
