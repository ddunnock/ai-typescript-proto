/**
 * @module @convergence/ui/components/ui/animated-theme-toggler
 * @file Animated theme toggler component with view transition animations.
 *   Provides a button component that toggles between light and dark themes with
 *   smooth circular clip-path animations using the View Transitions API.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/** Props for the AnimatedThemeToggler component. */
export interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  /** Animation duration in milliseconds (default: 400) */
  duration?: number;
}

/**
 * Animated theme toggler button with smooth view transition animations.
 *
 * A button component that toggles between light and dark themes using the View
 * Transitions API. The transition creates a smooth circular clip-path animation
 * that expands from the button's position. Automatically detects and syncs with
 * the current theme state via MutationObserver.
 *
 * @example
 *   ```tsx
 *   // Basic usage with default duration
 *   <AnimatedThemeToggler />
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Custom duration and styling
 *   <AnimatedThemeToggler
 *     duration={600}
 *     className="rounded-full p-2"
 *   />
 *   ```;
 *
 * @example
 *   ```tsx
 *   // With custom button props
 *   <AnimatedThemeToggler
 *     aria-label="Switch theme"
 *     title="Toggle dark mode"
 *   />
 *   ```;
 *
 * @param props - AnimatedThemeToggler component props
 * @param props.className - Additional CSS classes to merge with default styles
 * @param props.duration - Animation duration in milliseconds (default: 400)
 * @param props.onClick - Click event handler (overridden by internal toggle
 *   handler)
 * @param props.children - Button content (not typically used, icon is
 *   automatic)
 * @param props... - All other standard button HTML attributes
 * @returns Animated theme toggler button component
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API View Transitions API}
 */
export const AnimatedThemeToggler = ({
  className,
  duration = 400,
  ...props
}: AnimatedThemeTogglerProps) => {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle("dark");
        localStorage.setItem("theme", newTheme ? "dark" : "light");
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [isDark, duration]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      {...props}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
