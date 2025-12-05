/**
 * @module @convergence/ui/components/ui/glass/breadcrumb
 * @file Glass Breadcrumb - Enhanced breadcrumb component with glassmorphism
 *   effects. Provides a visually striking breadcrumb navigation with
 *   customizable glass appearance.
 */

"use client";

import * as React from "react";
import {
  Breadcrumb as BaseBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList as BaseBreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

export interface BreadcrumbListProps extends React.ComponentProps<"ol"> {
  /**
   * The hover animation effect to apply when the user hovers over the
   * breadcrumb. Available options: "none", "glow", "lift", "scale", "shimmer",
   * "ripple".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  effect?: HoverEffect;

  /**
   * Whether to apply a glow effect to the breadcrumb.
   *
   * @default false
   */
  glow?: boolean;
}

/**
 * Glass-styled breadcrumb list with customizable effects and appearance.
 *
 * An enhanced version of the base BreadcrumbList that applies glassmorphism
 * styling and supports hover effects. Use this component for navigation
 * breadcrumbs that should stand out with a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass breadcrumb
 *   <GlassBreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *   </GlassBreadcrumbList>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass breadcrumb with glow effect
 *   <GlassBreadcrumbList effect="glow" glow>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *   </GlassBreadcrumbList>
 *   ```;
 *
 * @param props - BreadcrumbList component props
 * @param props.className - Additional CSS classes to merge with breadcrumb
 *   styles
 * @param props.effect - Hover animation effect to apply (default: "none")
 * @param props.glow - Whether to apply a glow effect (default: false)
 * @param props.children - Breadcrumb items
 * @param props... - All other standard BreadcrumbList HTML attributes
 * @returns Glass-styled breadcrumb list element
 * @see {@link HoverEffect} For available hover effects
 */
export const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  BreadcrumbListProps
>(({ className, effect = "none", glow = false, ...props }, ref) => {
  return (
    <BaseBreadcrumbList
      ref={ref}
      className={cn(
        "bg-glass-bg/80 backdrop-blur-md border-2 border-white/30 shadow-md shadow-black/20",
        glow &&
          "[box-shadow:0_0_15px_hsl(var(--primary)/0.6),0_0_30px_hsl(var(--primary)/0.4),0_4px_16px_rgba(0,0,0,0.1)]",
        hoverEffects({ hover: effect }),
        className
      )}
      {...props}
    />
  );
});
BreadcrumbList.displayName = "BreadcrumbList";

/** Re-export all breadcrumb components for convenience. */
export {
  BaseBreadcrumb as Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
