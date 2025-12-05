/**
 * @module @convergence/ui/components/ui/glass/button
 * @file Glass Button - Enhanced button component with glassmorphism effects.
 *   Provides a visually striking button with customizable glass appearance,
 *   hover effects, and smooth animations.
 */

"use client";

import * as React from "react";
import { Button as BaseButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GlassCustomization } from "@/lib/glass-utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";
import { getGlassStyles } from "@/lib/glass-utils";

/**
 * Props for the Glass Button component.
 *
 * Extends the base Button props with glass-specific options for customized
 * glassmorphism effects.
 *
 * @extends {React.ComponentProps<typeof BaseButton>}
 * @interface ButtonProps
 */
export interface ButtonProps extends React.ComponentProps<typeof BaseButton> {
  /**
   * The hover animation effect to apply when the user hovers over the button.
   * Available options: "none", "glow", "lift", "scale", "shimmer".
   *
   * @default "glow"
   * @see {@link HoverEffect}
   */
  effect?: HoverEffect;

  /**
   * Custom glass styling configuration for fine-grained control over the
   * glassmorphism appearance including color, blur, and outline.
   *
   * @example
   *   ```tsx
   *   glass={{
   *     color: "rgba(59, 130, 246, 0.2)",
   *     blur: 25,
   *     outline: "rgba(59, 130, 246, 0.4)"
   *   }}
   *   ```;
   *
   * @see {@link GlassCustomization}
   */
  glass?: GlassCustomization;
}

/**
 * Glass-styled button with customizable effects and appearance.
 *
 * An enhanced version of the base Button that applies glassmorphism styling and
 * supports a "glow" hover effect. Use this component for primary actions and
 * interactive elements that should stand out with a glassmorphism aesthetic.
 *
 * The glass prop allows fine-grained customization of the glassmorphism effect,
 * including the background color tint, blur intensity, and outline color.
 *
 * @example
 *   ```tsx
 *   // Basic glass button with default glow effect
 *   <GlassButton>Click me</GlassButton>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Custom glass styling with lift effect
 *   <GlassButton
 *     effect="lift"
 *     glass={{
 *       color: "rgba(59, 130, 246, 0.2)",
 *       blur: 25,
 *       outline: "rgba(59, 130, 246, 0.4)"
 *     }}
 *   >
 *     Custom Glass
 *   </GlassButton>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Destructive glass button
 *   <GlassButton
 *     variant="destructive"
 *     glass={{
 *       color: "rgba(239, 68, 68, 0.2)",
 *       outline: "rgba(239, 68, 68, 0.4)"
 *     }}
 *   >
 *     Delete
 *   </GlassButton>
 *   ```;
 *
 * @param props - Button component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.effect - Hover animation effect to apply (default: "glow")
 * @param props.variant - Visual variant style from base button
 * @param props.glass - Custom glass styling configuration
 * @param props.size - Button size variant (default, sm, lg, icon)
 * @param props.asChild - If true, renders as child component using Radix Slot
 * @param props.disabled - Whether the button is disabled
 * @param props.children - Button content (text, icons, etc.)
 * @param props... - All other standard button HTML attributes
 * @returns Glass-styled button element
 * @see {@link https://www.radix-ui.com/primitives/docs/components/slot Radix UI Slot}
 * @see {@link GlassCustomization} For glass styling options
 * @see {@link HoverEffect} For available hover effects
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, effect = "glow", glass, style, ...props }, ref) => {
    const glassStyle = glass ? getGlassStyles(glass) : undefined;

    return (
      <BaseButton
        ref={ref}
        style={{ ...glassStyle, ...style }}
        className={cn(
          "relative overflow-hidden",
          "bg-glass-bg backdrop-blur-md border-2 border-white/30",
          "shadow-md shadow-black/20",
          hoverEffects({ hover: effect }),
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
