"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("theme") === "dark") {
        localStorage.setItem("theme", "light");
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
