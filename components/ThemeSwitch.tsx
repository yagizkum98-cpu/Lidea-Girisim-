"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("lidea-theme", nextTheme);
  }

  return (
    <div className="theme-switch" role="group" aria-label="Görünüm teması">
      <button
        type="button"
        className="theme-switch-option"
        aria-label="Gündüz temasını kullan"
        aria-pressed={theme === "light"}
        title="Gündüz teması"
        onClick={() => selectTheme("light")}
      >
        <span className="theme-switch-sun" aria-hidden="true" />
        <span className="hidden lg:inline">Gündüz</span>
      </button>
      <button
        type="button"
        className="theme-switch-option"
        aria-label="Gece temasını kullan"
        aria-pressed={theme === "dark"}
        title="Gece teması"
        onClick={() => selectTheme("dark")}
      >
        <span className="theme-switch-moon" aria-hidden="true" />
        <span className="hidden lg:inline">Gece</span>
      </button>
    </div>
  );
}
