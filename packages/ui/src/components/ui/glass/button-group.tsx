/**
 * @module @convergence/ui/components/ui/glass/button-group
 * @file Glass Button Group - Enhanced button group component with glassmorphism
 *   effects. Provides a visually striking button group with customizable glass
 *   appearance and hover effects.
 */

"use client";

import * as React from "react";
import { ButtonGroup as BaseButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import type { GlassCustomization } from "@/lib/glass-utils";
import { getGlassStyles } from "@/lib/glass-utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

export interface ButtonGroupProps extends React.ComponentProps<"div"> {
  /**
   * The hover animation effect to apply when the user hovers over the button
   * group. Available options: "none", "glow", "lift", "scale", "shimmer",
   * "ripple".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  effect?: HoverEffect;

  /**
   * Custom glass styling configuration for fine-grained control over the
   * glassmorphism appearance including color, blur, and outline.
   *
   * @see {@link GlassCustomization}
   */
  glass?: GlassCustomization;
}

/**
 * Glass-styled button group with customizable effects and appearance.
 *
 * An enhanced version of the base ButtonGroup that applies glassmorphism
 * styling and supports hover effects. Use this component for grouped buttons
 * that should stand out with a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass button group
 *   <GlassButtonGroup>
 *     <Button>First</Button>
 *     <Button>Second</Button>
 *   </GlassButtonGroup>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass button group with glow effect
 *   <GlassButtonGroup effect="glow">
 *     <Button>First</Button>
 *     <Button>Second</Button>
 *   </GlassButtonGroup>
 *   ```;
 *
 * @param props - ButtonGroup component props
 * @param props.className - Additional CSS classes to merge with button group
 *   styles
 * @param props.effect - Hover animation effect to apply (default: "none")
 * @param props.glass - Custom glass styling configuration
 * @param props.children - Button group content
 * @param props... - All other standard ButtonGroup HTML attributes
 * @returns Glass-styled button group element
 * @see {@link GlassCustomization} For glass styling options
 * @see {@link HoverEffect} For available hover effects
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, effect = "none", glass, style, ...props }, ref) => {
    const glassStyle = glass ? getGlassStyles(glass) : undefined;

    return (
      <BaseButtonGroup
        ref={ref}
        style={{ ...glassStyle, ...style }}
        className={cn(
          "relative overflow-hidden",
          "bg-glass-bg/80 backdrop-blur-md border-2 border-white/30",
          "shadow-md shadow-black/20",
          hoverEffects({ hover: effect }),
          className
        )}
        {...props}
      />
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";
