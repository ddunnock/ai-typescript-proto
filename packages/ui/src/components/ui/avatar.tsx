/**
 * @module @convergence/ui/components/ui/avatar
 * @file Avatar component system for displaying user avatars with fallback
 *   support. Provides a flexible avatar component with image loading, error
 *   handling, and fallback display capabilities using Radix UI primitives.
 */

"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

/**
 * Root Avatar container component.
 *
 * The main container for avatar components. Provides base styling and layout
 * for AvatarImage and AvatarFallback components. Automatically handles fallback
 * display when image fails to load.
 *
 * @example
 *   ```tsx
 *   <Avatar>
 *     <AvatarImage src="/user.jpg" alt="User" />
 *     <AvatarFallback>JD</AvatarFallback>
 *   </Avatar>
 *   ```;
 *
 * @param props - Component props extending AvatarPrimitive.Root
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Avatar content (AvatarImage and/or AvatarFallback)
 * @param props... - All other AvatarPrimitive.Root props
 * @returns React avatar container component
 * @see {@link AvatarImage}
 * @see {@link AvatarFallback}
 * @see {@link https://www.radix-ui.com/primitives/docs/components/avatar Radix UI Avatar}
 */
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

/**
 * Avatar image component that displays the user's avatar image.
 *
 * Displays an image within the Avatar container. Automatically falls back to
 * AvatarFallback if the image fails to load or is unavailable.
 *
 * @example
 *   ```tsx
 *   <AvatarImage src="/user-avatar.jpg" alt="John Doe" />
 *   ```;
 *
 * @param props - Component props extending AvatarPrimitive.Image
 * @param props.src - Image source URL
 * @param props.alt - Alternative text for the image (required for
 *   accessibility)
 * @param props.className - Additional CSS classes to merge
 * @param props... - All other standard img HTML attributes
 * @returns React avatar image component
 * @see {@link Avatar}
 * @see {@link AvatarFallback}
 */
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

/**
 * Avatar fallback component displayed when image fails to load.
 *
 * Shown when the AvatarImage fails to load or is unavailable. Typically
 * displays initials, an icon, or a placeholder. Automatically shown/hidden
 * based on image loading state.
 *
 * @example
 *   ```tsx
 *   <AvatarFallback>JD</AvatarFallback>
 *   ```;
 *
 * @example
 *   ```tsx
 *   <AvatarFallback>
 *     <UserIcon />
 *   </AvatarFallback>
 *   ```;
 *
 * @param props - Component props extending AvatarPrimitive.Fallback
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Fallback content (typically initials or icon)
 * @param props... - All other AvatarPrimitive.Fallback props
 * @returns React avatar fallback component
 * @see {@link Avatar}
 * @see {@link AvatarImage}
 */
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full text-xs font-medium",
        // Responsive text sizing based on parent size
        "[.h-8_&]:text-[10px]",
        "[.h-10_&]:text-xs",
        "[.h-12_&]:text-sm",
        "[.h-16_&]:text-base",
        "[.h-20_&]:text-lg",
        "[.h-24_&]:text-xl",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
