/**
 * @module @convergence/ui/components/ui/glass/alert
 * @file Glass Alert - Enhanced alert component with glassmorphism effects.
 *   Provides contextual feedback messages with glass styling, optional glow
 *   effects, and configurable hover animations.
 */

"use client";

import * as React from "react";
import {
  Alert as BaseAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

/**
 * Props for the Glass Alert component.
 *
 * Extends the base Alert props with glass-specific options for enhanced visual
 * effects including glow and hover animations.
 *
 * @extends {React.ComponentProps<typeof BaseAlert>}
 * @interface AlertProps
 */
export interface AlertProps extends React.ComponentProps<typeof BaseAlert> {
  /**
   * Whether to show a purple glow shadow effect around the alert.
   *
   * @default false
   */
  glow?: boolean;

  /**
   * The hover animation effect to apply when the user hovers over the alert.
   * Available options: "none", "glow", "lift", "scale", "shimmer".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  hover?: HoverEffect;
}

/**
 * Glass-styled alert component with optional glow and hover effects.
 *
 * An enhanced version of the base Alert that defaults to the glass variant and
 * supports additional visual effects. Use this component to display important
 * messages with a glassmorphism aesthetic that fits the overall Glass UI design
 * system.
 *
 * @example
 *   ```tsx
 *   // Basic glass alert
 *   <GlassAlert>
 *     <GlassAlertTitle>Heads up!</GlassAlertTitle>
 *     <GlassAlertDescription>
 *       You have new notifications to review.
 *     </GlassAlertDescription>
 *   </GlassAlert>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass alert with glow and hover effect
 *   <GlassAlert glow hover="lift">
 *     <GlassAlertTitle>Important</GlassAlertTitle>
 *     <GlassAlertDescription>
 *       This alert glows and lifts on hover.
 *     </GlassAlertDescription>
 *   </GlassAlert>
 *   ```;
 *
 * @param props - Alert component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.variant - Visual variant style (default: "glass")
 * @param props.glow - Whether to show purple glow shadow (default: false)
 * @param props.hover - Hover animation effect to apply (default: "none")
 * @param props.children - Alert content (typically AlertTitle and
 *   AlertDescription)
 * @param props... - All other standard Alert props
 * @returns Glass-styled alert element
 * @see {@link https://www.radix-ui.com/primitives/docs/components/alert Radix Alert}
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, glow = false, hover = "none", ...props }, ref) => {
    return (
      <BaseAlert
        ref={ref}
        variant={variant}
        className={cn(
          "relative overflow-hidden",
          glow &&
            "[box-shadow:0_0_15px_hsl(var(--primary)/0.5),0_0_30px_hsl(var(--primary)/0.3)]",
          "transition-all duration-200",
          hoverEffects({ hover }),
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

/**
 * Re-exported Alert sub-components for Glass UI composition.
 *
 * These components are re-exported from the base alert module to provide a
 * complete Glass alert API. Use GlassAlertTitle for the heading and
 * GlassAlertDescription for the body content.
 *
 * @see {@link Alert} Glass-styled alert container
 */
export {
  /** Alert body text content */
  AlertDescription,
  /** Alert heading/title text */
  AlertTitle,
};
