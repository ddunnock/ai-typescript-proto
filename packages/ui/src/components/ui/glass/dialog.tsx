/**
 * @module @convergence/ui/components/ui/glass/dialog
 * @file Glass Dialog - Enhanced dialog component with glassmorphism effects.
 *   Provides a modal dialog with customizable glass appearance, backdrop blur
 *   animations, and hover effects for immersive UI experiences.
 */

"use client";

import * as React from "react";
import {
  Dialog as BaseDialog,
  DialogContent as BaseDialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { GlassCustomization } from "@/lib/glass-utils";
import { getGlassStyles } from "@/lib/glass-utils";
import { hoverEffects, type HoverEffect } from "@/lib/hover-effects";

/**
 * Props for the Glass DialogContent component.
 *
 * Extends the base DialogContent props with glass-specific options for
 * customized glassmorphism effects including variant selection, animations, and
 * hover interactions.
 *
 * @extends {React.ComponentProps<typeof BaseDialogContent>}
 * @interface DialogContentProps
 */
export interface DialogContentProps extends React.ComponentProps<
  typeof BaseDialogContent
> {
  /**
   * The glass style variant to apply. Each variant provides a different level
   * of glass effect intensity and visual style.
   *
   * - "default": Standard glass styling
   * - "subtle": Lighter glass effect for subtle emphasis
   * - "frosted": Heavy frosted glass effect
   * - "crystal": Highly transparent crystal-like effect
   *
   * @default "default"
   */
  variant?: "default" | "subtle" | "frosted" | "crystal";

  /**
   * Whether to apply animated backdrop blur effect when the dialog opens. When
   * enabled, the content receives additional blur styling for a more immersive
   * glass effect.
   *
   * @default true
   */
  animated?: boolean;

  /**
   * The hover animation effect to apply when the user hovers over the dialog.
   * Available options: "none", "glow", "lift", "scale", "shimmer".
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
   *     color: "rgba(139, 92, 246, 0.15)",
   *     blur: 40,
   *     outline: "rgba(139, 92, 246, 0.3)"
   *   }}
   *   ```;
   *
   * @see {@link GlassCustomization}
   */
  glass?: GlassCustomization;
}

/** Variant-specific class names for glass dialog styles. */
const variantClasses = {
  default: "bg-glass-bg backdrop-blur-md border-glass-border shadow-glass",
  subtle: "bg-glass-bg/50 backdrop-blur-sm border-glass-border/50",
  frosted:
    "bg-[var(--glass-frosted-bg)] backdrop-blur-[var(--blur-frosted)] shadow-[var(--glass-frosted-shadow)]",
  crystal:
    "bg-[var(--glass-crystal-bg)] border-[var(--glass-crystal-border)] shadow-[var(--glass-crystal-shadow)]",
};

/**
 * Glass-styled dialog content with customizable effects and appearance.
 *
 * An enhanced version of the base DialogContent that applies glassmorphism
 * styling and supports animated backdrop blur effects. Use this component for
 * modal dialogs that should have a glassmorphism aesthetic, such as settings
 * panels, forms, or information displays.
 *
 * The component supports multiple glass variants from subtle to crystal, and
 * can be further customized with the glass prop for precise control over the
 * visual appearance.
 *
 * @example
 *   ```tsx
 *   // Basic glass dialog
 *   <GlassDialog>
 *     <GlassDialogTrigger asChild>
 *       <Button>Open Settings</Button>
 *     </GlassDialogTrigger>
 *     <GlassDialogContent>
 *       <GlassDialogHeader>
 *         <GlassDialogTitle>Settings</GlassDialogTitle>
 *         <GlassDialogDescription>
 *           Customize your preferences
 *         </GlassDialogDescription>
 *       </GlassDialogHeader>
 *       <GlassDialogFooter>
 *         <Button>Save</Button>
 *       </GlassDialogFooter>
 *     </GlassDialogContent>
 *   </GlassDialog>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Custom purple-tinted glass dialog with hover effect
 *   <GlassDialogContent
 *     variant="frosted"
 *     hover="glow"
 *     glass={{
 *       color: "rgba(139, 92, 246, 0.15)",
 *       blur: 40,
 *       outline: "rgba(139, 92, 246, 0.3)"
 *     }}
 *   >
 *     {content}
 *   </GlassDialogContent>
 *   ```;
 *
 * @param props - DialogContent component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.variant - Glass style variant (default: "default")
 * @param props.animated - Whether to apply animated backdrop blur (default:
 *   true)
 * @param props.hover - Hover animation effect to apply (default: "none")
 * @param props.glass - Custom glass styling configuration
 * @param props.children - Dialog content (header, body, footer)
 * @param props... - All other standard DialogContent props
 * @returns Glass-styled dialog content element
 * @see {@link https://www.radix-ui.com/primitives/docs/components/dialog Radix Dialog}
 * @see {@link GlassCustomization} For glass styling options
 * @see {@link HoverEffect} For available hover effects
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  DialogContentProps
>(
  (
    {
      className,
      variant = "default",
      animated = true,
      hover = "none",
      glass,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const glassStyle = glass ? getGlassStyles(glass) : undefined;

    return (
      <BaseDialogContent
        ref={ref}
        style={{ ...glassStyle, ...style }}
        className={cn(
          "relative overflow-hidden",
          variantClasses[variant],
          animated && "backdrop-blur-[var(--blur-lg)]",
          hoverEffects({ hover }),
          className
        )}
        {...props}
      >
        {children}
      </BaseDialogContent>
    );
  }
);
DialogContent.displayName = "DialogContent";

/**
 * Re-exported Dialog sub-components for Glass UI composition.
 *
 * These components are re-exported from the base dialog module to provide a
 * complete Glass dialog API. The composition follows a standard pattern: Dialog
 * root, Trigger to open, Content container, Header with Title and Description,
 * and Footer for actions.
 *
 * @see {@link DialogContent} Glass-styled content container
 */
export {
  /** Root dialog container - manages open/close state */
  BaseDialog as Dialog,
  /** Button or element that triggers the dialog to open */
  DialogTrigger,
  /** Container for dialog title and description */
  DialogHeader,
  /** Container for action buttons at the bottom */
  DialogFooter,
  /** Dialog heading text */
  DialogTitle,
  /** Dialog body/description text */
  DialogDescription,
};
