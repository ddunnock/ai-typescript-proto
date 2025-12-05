/**
 * @fileoverview Theme switcher UI component for selecting theme variants and color modes.
 * @module @convergence/ui/components/theme-switcher
 */

"use client";

import { useTheme, type ThemeVariant, type ColorMode } from "../providers";

/**
 * Props for the ThemeSwitcher component.
 *
 * @example
 * ```tsx
 * // Show both selectors
 * <ThemeSwitcher />
 *
 * // Show only color mode selector
 * <ThemeSwitcher colorModeOnly />
 *
 * // Show only theme variant selector
 * <ThemeSwitcher variantOnly />
 *
 * // With custom className
 * <ThemeSwitcher className="my-4" />
 * ```
 */
export interface ThemeSwitcherProps {
  /** Additional CSS classes to apply to the container */
  className?: string;
  /** Show only color mode selector (hides theme variant selector) */
  colorModeOnly?: boolean;
  /** Show only theme variant selector (hides color mode selector) */
  variantOnly?: boolean;
}

/**
 * Theme switcher component for user-facing theme and color mode selection.
 *
 * @description Renders dropdown selectors for theme variant (convergence/synthwave)
 * and color mode (light/dark/system). Shows a loading skeleton during SSR hydration
 * to prevent flash of unstyled content.
 *
 * @param props - Component props
 * @param props.className - Additional CSS classes to apply to the container
 * @param props.colorModeOnly - Show only color mode selector (hides theme variant selector)
 * @param props.variantOnly - Show only theme variant selector (hides color mode selector)
 * @returns Theme switcher component or loading skeleton
 *
 * @example
 * ```tsx
 * // In a navbar or settings page
 * function Navbar() {
 *   return (
 *     <nav>
 *       <Logo />
 *       <ThemeSwitcher className="ml-auto" />
 *     </nav>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Just color mode for minimal UI
 * <ThemeSwitcher colorModeOnly />
 * ```
 *
 * @see useTheme
 * @see ThemeSwitcherProps
 */
export function ThemeSwitcher({
  className = "",
  colorModeOnly = false,
  variantOnly = false,
}: ThemeSwitcherProps) {
  const { themeVariant, setThemeVariant, colorMode, setColorMode, mounted } =
    useTheme();

  // Prevent hydration mismatch by showing skeleton until mounted
  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-4 ${className}`}
        aria-hidden="true"
      >
        {!colorModeOnly && (
          <div className="h-9 w-32 animate-pulse rounded-md bg-secondary" />
        )}
        {!variantOnly && (
          <div className="h-9 w-24 animate-pulse rounded-md bg-secondary" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {!colorModeOnly && (
        <select
          value={themeVariant}
          onChange={(e) => setThemeVariant(e.target.value as ThemeVariant)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Theme variant"
        >
          <option value="convergence">Convergence</option>
          <option value="synthwave">SynthWave</option>
        </select>
      )}

      {!variantOnly && (
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as ColorMode)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Color mode"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      )}
    </div>
  );
}
