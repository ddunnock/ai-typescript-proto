/**
 * @module @convergence/ui/components/ui/glass/card
 * @file Glass Card - Enhanced card component with glassmorphism effects.
 *   Provides a beautifully designed container with glass styling, gradient
 *   overlays, animations, and customizable hover effects.
 */

"use client";

import * as React from "react";
import {
  Card as BaseCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GlassCustomization } from "@/lib/glass-utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

/**
 * Props for the Glass Card component.
 *
 * Extends the base Card props with glass-specific options for gradients,
 * animations, hover effects, and custom glassmorphism styling.
 *
 * @extends {React.ComponentProps<typeof BaseCard>}
 * @interface CardProps
 */
export interface CardProps extends React.ComponentProps<typeof BaseCard> {
  /**
   * Whether to apply a purple-blue-pink gradient overlay to the card. Creates a
   * subtle colorful tint over the glass effect.
   *
   * @default false
   */
  gradient?: boolean;

  /**
   * Whether to enable scale animation on hover. When true, the card scales up
   * slightly and enhances its shadow on hover.
   *
   * @default false
   */
  animated?: boolean;

  /**
   * The hover animation effect to apply when the user hovers over the card.
   * Available options: "none", "glow", "lift", "scale", "shimmer", "ripple".
   *
   * @default "none"
   * @see {@link HoverEffect}
   */
  hover?: HoverEffect;

  /**
   * Custom glass styling configuration for fine-grained control over the
   * glassmorphism appearance including color, blur, and outline.
   *
   * @example
   *   ```tsx
   *   glass={{
   *     color: "rgba(139, 92, 246, 0.2)",
   *     blur: 30,
   *     transparency: 0.3,
   *     outline: "rgba(139, 92, 246, 0.5)",
   *     innerGlow: "rgba(255, 255, 255, 0.3)",
   *     innerGlowBlur: 25
   *   }}
   *   ```;
   *
   * @see {@link GlassCustomization}
   */
  glass?: GlassCustomization;
}

/**
 * Glass-styled card with customizable effects and appearance.
 *
 * An enhanced version of the base Card that applies glassmorphism styling and
 * supports gradients, animations, and hover effects. Use this component for
 * content containers, feature highlights, or any grouped content that should
 * stand out with a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass card
 *   <Card>Content</Card>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Card with gradient overlay
 *   <Card gradient>Content</Card>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Card with scale animation on hover
 *   <Card animated>Content</Card>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Card with hover effect
 *   <Card hover="lift">Content</Card>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Card with all effects combined
 *   <Card gradient animated hover="glow">
 *     Content
 *   </Card>
 *   ```;
 *
 * @param props - Card component props
 * @param props.className - Additional CSS classes to merge with card styles
 * @param props.gradient - Whether to apply a gradient overlay (default: false)
 * @param props.animated - Whether to enable hover scale animation (default:
 *   false)
 * @param props.hover - Hover animation effect to apply (default: "none")
 * @param props.glass - Custom glass styling configuration (reserved for future
 *   use)
 * @param props.children - Card content (typically CardHeader, CardContent,
 *   CardFooter)
 * @param props... - All other standard Card HTML attributes
 * @returns Glass-styled card element
 * @see {@link CardHeader} For card header section
 * @see {@link CardTitle} For card title text
 * @see {@link CardDescription} For card description text
 * @see {@link CardContent} For card main content area
 * @see {@link CardFooter} For card footer section
 * @see {@link GlassCustomization} For glass styling options
 * @see {@link HoverEffect} For available hover effects
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      gradient = false,
      animated = false,
      hover = "none",
      glass: _glass,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <BaseCard
        ref={ref}
        className={cn(
          "relative overflow-hidden border-glass-border bg-glass-bg backdrop-blur-md shadow-[var(--glass-shadow)]",
          gradient &&
            "bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10",
          animated &&
            "transition-all duration-300 hover:scale-[1.02] hover:shadow-[var(--glass-shadow-lg)]",
          hoverEffects({ hover }),
          className
        )}
        {...props}
      >
        {children}
      </BaseCard>
    );
  }
);
Card.displayName = "Card";

/**
 * Content section for the Card component. Contains the main body content of the
 * card.
 *
 * @see {@link https://ui.shadcn.com/docs/components/card Shadcn UI Card}
 */
export { CardContent };

/**
 * Description text for the Card component. Typically used within CardHeader to
 * provide supplementary text.
 *
 * @see {@link https://ui.shadcn.com/docs/components/card Shadcn UI Card}
 */
export { CardDescription };

/**
 * Footer section for the Card component. Contains actions or supplementary
 * information at the bottom of the card.
 *
 * @see {@link https://ui.shadcn.com/docs/components/card Shadcn UI Card}
 */
export { CardFooter };

/**
 * Header section for the Card component. Contains the title and optional
 * description of the card.
 *
 * @see {@link https://ui.shadcn.com/docs/components/card Shadcn UI Card}
 */
export { CardHeader };

/**
 * Title text for the Card component. Typically used within CardHeader as the
 * primary heading.
 *
 * @see {@link https://ui.shadcn.com/docs/components/card Shadcn UI Card}
 */
export { CardTitle };
