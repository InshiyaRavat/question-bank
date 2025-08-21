// Legacy theme object for backward compatibility
// New components should use useTheme() hook from ThemeContext instead
export const THEME = {
  // Primary colors
  primary: "var(--color-primary, #2563eb)",
  primaryHover: "var(--color-primaryHover, #1d4ed8)",
  primaryLight: "var(--color-primaryLight, #dbeafe)",

  // Neutral colors
  neutral900: "var(--color-neutral900, #111827)",
  neutral700: "var(--color-neutral700, #374151)",
  neutral500: "var(--color-neutral500, #6b7280)",
  neutral300: "var(--color-neutral300, #d1d5db)",
  neutral200: "var(--color-neutral200, #e5e7eb)",
  neutral100: "var(--color-neutral100, #f3f4f6)",
  neutral50: "var(--color-neutral50, #f9fafb)",

  // Semantic colors
  success: "var(--color-success, #10b981)",
  error: "var(--color-error, #ef4444)",
  warning: "var(--color-warning, #f59e0b)",

  // Special colors
  white: "var(--color-white, #ffffff)",
  background: "var(--color-background, #ffffff)",
  surface: "var(--color-surface, #f9fafb)",

  // Text colors
  textPrimary: "var(--color-textPrimary, #111827)",
  textSecondary: "var(--color-textSecondary, #6b7280)",
  textMuted: "var(--color-textMuted, #9ca3af)",
};
