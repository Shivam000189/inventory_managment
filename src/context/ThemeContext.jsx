import { useEffect, useState } from "react";
import { ThemeContext } from "./themeContext.js";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
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
