/**
 * @module @convergence/ui/components/ui/glass/avatar
 * @file Glass Avatar - Enhanced avatar component with glassmorphism effects.
 *   Provides a user avatar with customizable size variants and optional glow
 *   effects for visual emphasis.
 */

"use client";

import * as React from "react";
import {
  Avatar as BaseAvatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/**
 * Props for the Glass Avatar component.
 *
 * Extends the base Avatar props with glass-specific options for size variants
 * and glow effects.
 *
 * @extends {React.ComponentProps<typeof BaseAvatar>}
 * @interface AvatarProps
 */
export interface AvatarProps extends React.ComponentProps<typeof BaseAvatar> {
  /**
   * Whether to apply a purple glow effect around the avatar. Useful for
   * highlighting active users or important profiles.
   *
   * @default false
   */
  glow?: boolean;

  /**
   * The size variant for the avatar.
   *
   * - `sm`: 32x32px (h-8 w-8)
   * - `md`: 40x40px (h-10 w-10)
   * - `lg`: 64x64px (h-16 w-16)
   *
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Glass-styled avatar with customizable size and glow effects.
 *
 * An enhanced version of the base Avatar that supports predefined size variants
 * and an optional purple glow effect. Use this component for user profiles,
 * team members, or any visual identity representation.
 *
 * @example
 *   ```tsx
 *   // Basic avatar with image
 *   <Avatar>
 *     <AvatarImage src="/user.jpg" alt="User" />
 *     <AvatarFallback>JD</AvatarFallback>
 *   </Avatar>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Large avatar with glow effect
 *   <Avatar size="lg" glow>
 *     <AvatarImage src="/profile.jpg" alt="Profile" />
 *     <AvatarFallback>AB</AvatarFallback>
 *   </Avatar>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Small avatar for compact layouts
 *   <Avatar size="sm">
 *     <AvatarFallback>U</AvatarFallback>
 *   </Avatar>
 *   ```;
 *
 * @param props - Avatar component props
 * @param props.className - Additional CSS classes to merge with size and glow
 *   classes
 * @param props.glow - Whether to apply a purple glow effect (default: false)
 * @param props.size - Size variant: "sm", "md", or "lg" (default: "md")
 * @param props.children - Avatar content (AvatarImage and/or AvatarFallback)
 * @param props... - All other standard Avatar HTML attributes
 * @returns Glass-styled avatar element
 * @see {@link AvatarImage} For displaying avatar images
 * @see {@link AvatarFallback} For fallback content when image fails
 */
export const Avatar = React.forwardRef<
  React.ElementRef<typeof BaseAvatar>,
  AvatarProps
>(({ className, glow = false, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  return (
    <BaseAvatar
      ref={ref}
      className={cn(
        sizeClasses[size],
        // Glass effect styling
        "bg-glass-bg/80 backdrop-blur-md border-2 border-glass-border",
        "shadow-glass",
        // Glow effect - colored glow instead of drop shadow
        glow &&
          "[box-shadow:0_0_15px_hsl(var(--primary)/0.6),0_0_30px_hsl(var(--primary)/0.4)] hover:[box-shadow:0_0_20px_hsl(var(--primary)/0.8),0_0_40px_hsl(var(--primary)/0.6)] hover:ring-2 hover:ring-primary/70",
        // Transitions
        "transition-all duration-300 hover:scale-105",
        className
      )}
      {...props}
    />
  );
});
Avatar.displayName = "Avatar";

/**
 * Glass-styled image component for the Avatar. Displays the user's profile
 * picture with glassmorphism effects applied.
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/avatar Radix UI Avatar}
 */
export const GlassAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarImage>,
  React.ComponentProps<typeof AvatarImage>
>(({ className, ...props }, ref) => {
  return (
    <AvatarImage
      ref={ref}
      className={cn("rounded-full", className)}
      {...props}
    />
  );
});
GlassAvatarImage.displayName = "GlassAvatarImage";

/**
 * Glass-styled fallback component for the Avatar. Displayed when the image
 * fails to load or is not provided. Features glassmorphism styling with
 * backdrop blur and transparency.
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/avatar Radix UI Avatar}
 */
export const GlassAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarFallback>,
  React.ComponentProps<typeof AvatarFallback>
>(({ className, ...props }, ref) => {
  return (
    <AvatarFallback
      ref={ref}
      className={cn(
        "bg-glass-bg/60 backdrop-blur-sm text-foreground font-semibold",
        className
      )}
      {...props}
    />
  );
});
GlassAvatarFallback.displayName = "GlassAvatarFallback";
