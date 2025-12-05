/**
 * @module @convergence/ui/components/ui/glass/carousel
 * @file Glass Carousel - Enhanced carousel component with glassmorphism
 *   effects. Provides a visually striking carousel with customizable glass
 *   appearance and hover effects.
 */

"use client";

import * as React from "react";
import { Carousel as BaseCarousel } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { GlassCustomization } from "@/lib/glass-utils";
import { getGlassStyles } from "@/lib/glass-utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

export type CarouselProps = Parameters<typeof BaseCarousel>[0] & {
  /**
   * The hover animation effect to apply when the user hovers over the carousel.
   * Available options: "none", "glow", "lift", "scale", "shimmer", "ripple".
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
};

/**
 * Glass-styled carousel with customizable effects and appearance.
 *
 * An enhanced version of the base Carousel that applies glassmorphism styling
 * and supports hover effects. Use this component for image/content carousels
 * that should stand out with a glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   // Basic glass carousel
 *   <GlassCarousel>
 *     <CarouselContent>
 *       <CarouselItem>Item 1</CarouselItem>
 *     </CarouselContent>
 *   </GlassCarousel>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Glass carousel with glow effect
 *   <GlassCarousel effect="glow">
 *     <CarouselContent>
 *       <CarouselItem>Item 1</CarouselItem>
 *     </CarouselContent>
 *   </GlassCarousel>
 *   ```;
 *
 * @param props - Carousel component props
 * @param props.className - Additional CSS classes to merge with carousel styles
 * @param props.effect - Hover animation effect to apply (default: "none")
 * @param props.glass - Custom glass styling configuration
 * @param props.children - Carousel content
 * @param props... - All other standard Carousel HTML attributes
 * @returns Glass-styled carousel element
 * @see {@link GlassCustomization} For glass styling options
 * @see {@link HoverEffect} For available hover effects
 */
export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, effect = "none", glass, style, ...props }, ref) => {
    const glassStyle = glass ? getGlassStyles(glass) : undefined;

    return (
      <BaseCarousel
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
Carousel.displayName = "Carousel";
