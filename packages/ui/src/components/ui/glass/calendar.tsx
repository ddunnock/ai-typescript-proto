/**
 * @module @convergence/ui/components/ui/glass/calendar
 * @file Glass Calendar - Enhanced calendar component with glassmorphism
 *   effects. Provides a visually striking calendar with customizable glass
 *   appearance.
 */

"use client";

import * as React from "react";
import { Calendar as BaseCalendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

export type CalendarProps = Parameters<typeof BaseCalendar>[0] & {
  /**
   * The hover animation effect to apply when the user hovers over the calendar.
   * Available options: "none", "glow", "lift", "scale", "shimmer", "ripple".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  effect?: HoverEffect;

  /**
   * Whether to apply a glow effect to the calendar.
   *
   * @default false
   */
  glow?: boolean;
};

/**
 * Glass-styled calendar with customizable effects and appearance.
 *
 * An enhanced version of the base Calendar that applies glassmorphism styling
 * and supports hover effects. Use this component for date selection that should
 * stand out with a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass calendar
 *   <GlassCalendar />
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass calendar with glow effect
 *   <GlassCalendar effect="glow" glow />
 *   ```;
 *
 * @param props - Calendar component props
 * @param props.className - Additional CSS classes to merge with calendar styles
 * @param props.effect - Hover animation effect to apply (default: "none")
 * @param props.glow - Whether to apply a glow effect (default: false)
 * @param props... - All other standard Calendar props
 * @returns Glass-styled calendar element
 * @see {@link HoverEffect} For available hover effects
 */
export function Calendar({
  className,
  effect = "none",
  glow = false,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn(
        "bg-glass-bg/80 backdrop-blur-md border-2 border-white/30",
        "shadow-md shadow-black/20 rounded-md p-4",
        glow &&
          "[box-shadow:0_0_15px_hsl(var(--primary)/0.6),0_0_30px_hsl(var(--primary)/0.4),0_4px_16px_rgba(0,0,0,0.1)]",
        hoverEffects({ hover: effect }),
        className
      )}
    >
      <BaseCalendar {...props} />
    </div>
  );
}
