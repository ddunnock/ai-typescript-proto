/**
 * @module @convergence/ui/components/ui/glass/badge
 * @file Glass Badge - Enhanced badge component with glassmorphism effects.
 *   Provides a stylized label or tag with optional glow effects and hover
 *   animations for visual feedback and categorization.
 */

"use client";

import * as React from "react";
import { Badge as BaseBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

/**
 * Props for the Glass Badge component.
 *
 * Extends the base Badge props with glass-specific options for glow effects and
 * hover animations.
 *
 * @extends {React.ComponentProps<typeof BaseBadge>}
 * @interface BadgeProps
 */
export interface BadgeProps extends React.ComponentProps<typeof BaseBadge> {
  /**
   * Whether to apply a purple glow effect around the badge. Useful for
   * highlighting important tags or status indicators.
   *
   * @default false
   */
  glow?: boolean;

  /**
   * The hover animation effect to apply when the user hovers over the badge.
   * Available options: "none", "glow", "lift", "scale", "shimmer", "ripple".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  hover?: HoverEffect;
}

/**
 * Glass-styled badge with customizable glow and hover effects.
 *
 * An enhanced version of the base Badge that applies glassmorphism styling with
 * optional purple glow effect and configurable hover animations. Use this
 * component for labels, tags, status indicators, or category markers.
 *
 * @example
 *   ```tsx
 *   // Basic glass badge
 *   <Badge>New</Badge>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Badge with glow effect for emphasis
 *   <Badge glow>Featured</Badge>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Badge with hover animation
 *   <Badge hover="lift">Interactive</Badge>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Combined glow and hover effects
 *   <Badge glow hover="scale">
 *     Premium
 *   </Badge>
 *   ```;
 *
 * @param props - Badge component props
 * @param props.className - Additional CSS classes to merge with badge styles
 * @param props.glow - Whether to apply a purple glow effect (default: false)
 * @param props.hover - Hover animation effect to apply (default: "none")
 * @param props.children - Badge content (text, icons, etc.)
 * @param props... - All other standard Badge HTML attributes
 * @returns Glass-styled badge element
 * @see {@link HoverEffect} For available hover effects
 * @see {@link https://ui.shadcn.com/docs/components/badge Shadcn UI Badge}
 */
export function Badge({
  className,
  glow = false,
  hover = "none",
  ...props
}: BadgeProps) {
  return (
    <BaseBadge
      className={cn(
        "relative overflow-hidden border-glass-border bg-glass-bg backdrop-blur-sm",
        glow &&
          "[box-shadow:0_0_10px_hsl(var(--primary)/0.6),0_0_20px_hsl(var(--primary)/0.4)]",
        "transition-all duration-200",
        hoverEffects({ hover }),
        className
      )}
      {...props}
    />
  );
}
