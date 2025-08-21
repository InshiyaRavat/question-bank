"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Define light and dark theme configurations
const lightTheme = {
  name: "light",
  colors: {
    // Primary colors
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    primaryLight: "#dbeafe",
    primaryDark: "#1e40af",

    // Background colors
    background: "#ffffff",
    backgroundSecondary: "#f9fafb",
    backgroundTertiary: "#f3f4f6",
    surface: "#ffffff",
    surfaceHover: "#f9fafb",

    // Text colors
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    textInverse: "#ffffff",

    // Border colors
    border: "#d1d5db",
    borderLight: "#e5e7eb",
    borderDark: "#9ca3af",

    // Semantic colors
    success: "#10b981",
    successLight: "#d1fae5",
    error: "#ef4444",
    errorLight: "#fee2e2",
    warning: "#f59e0b",
    warningLight: "#fef3c7",
    info: "#3b82f6",
    infoLight: "#dbeafe",

    // Neutral scale
    neutral50: "#f9fafb",
    neutral100: "#f3f4f6",
    neutral200: "#e5e7eb",
    neutral300: "#d1d5db",
    neutral400: "#9ca3af",
    neutral500: "#6b7280",
    neutral600: "#4b5563",
    neutral700: "#374151",
    neutral800: "#1f2937",
    neutral900: "#111827",

    // Special colors
    white: "#ffffff",
    black: "#000000",
  },
};

const darkTheme = {
  name: "dark",
  colors: {
    // Primary colors
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryLight: "#1e3a8a",
    primaryDark: "#1d4ed8",

    // Background colors
    background: "#0f172a",
    backgroundSecondary: "#1e293b",
    backgroundTertiary: "#334155",
    surface: "#1e293b",
    surfaceHover: "#334155",

    // Text colors
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    textInverse: "#0f172a",

    // Border colors
    border: "#475569",
    borderLight: "#334155",
    borderDark: "#64748b",

    // Semantic colors
    success: "#22c55e",
    successLight: "#064e3b",
    error: "#ef4444",
    errorLight: "#7f1d1d",
    warning: "#f59e0b",
    warningLight: "#78350f",
    info: "#3b82f6",
    infoLight: "#1e3a8a",

    // Neutral scale (inverted for dark theme)
    neutral50: "#0f172a",
    neutral100: "#1e293b",
    neutral200: "#334155",
    neutral300: "#475569",
    neutral400: "#64748b",
    neutral500: "#94a3b8",
    neutral600: "#cbd5e1",
    neutral700: "#e2e8f0",
    neutral800: "#f1f5f9",
    neutral900: "#f8fafc",

    // Special colors
    white: "#ffffff",
    black: "#000000",
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      setIsDark(prefersDark);
    }

    setMounted(true);
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", isDark ? "dark" : "light");

      // Apply theme class to document root
      if (isDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }

      // Apply theme colors as CSS variables
      const theme = isDark ? darkTheme : lightTheme;
      const root = document.documentElement;

      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  const value = {
    theme,
    isDark,
    toggleTheme,
    colors: theme.colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Legacy support - export the current THEME object for backward compatibility
export const THEME = lightTheme.colors;
