/**
 * @module @convergence/ui/components/ui/glass/alert-dialog
 * @file Glass Alert Dialog - Enhanced alert dialog with glassmorphism effects.
 *   Provides a modal dialog for important confirmations and alerts with glass
 *   styling and optional backdrop blur animations.
 */

"use client";

import * as React from "react";
import {
  AlertDialog as BaseAlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as BaseAlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Props for the Glass AlertDialogContent component.
 *
 * Extends the base AlertDialogContent props with glass-specific options for
 * enhanced visual effects.
 *
 * @extends {React.ComponentProps<typeof BaseAlertDialogContent>}
 * @interface AlertDialogContentProps
 */
export interface AlertDialogContentProps extends React.ComponentProps<
  typeof BaseAlertDialogContent
> {
  /**
   * Whether to apply animated backdrop blur effect when the dialog opens. When
   * enabled, the content receives additional blur styling for a more immersive
   * glass effect.
   *
   * @default true
   */
  animated?: boolean;
}

/**
 * Glass-styled alert dialog content with optional blur animation.
 *
 * An enhanced version of the base AlertDialogContent that defaults to the glass
 * variant and supports animated backdrop blur effects. Use this component for
 * important confirmations and alerts that require user attention with a
 * glassmorphism aesthetic.
 *
 * @example
 *   ```tsx
 *   <GlassAlertDialog>
 *     <GlassAlertDialogTrigger asChild>
 *       <Button>Delete Item</Button>
 *     </GlassAlertDialogTrigger>
 *     <GlassAlertDialogContent>
 *       <GlassAlertDialogHeader>
 *         <GlassAlertDialogTitle>Are you sure?</GlassAlertDialogTitle>
 *         <GlassAlertDialogDescription>
 *           This action cannot be undone.
 *         </GlassAlertDialogDescription>
 *       </GlassAlertDialogHeader>
 *       <GlassAlertDialogFooter>
 *         <GlassAlertDialogCancel>Cancel</GlassAlertDialogCancel>
 *         <GlassAlertDialogAction>Delete</GlassAlertDialogAction>
 *       </GlassAlertDialogFooter>
 *     </GlassAlertDialogContent>
 *   </GlassAlertDialog>
 *   ```;
 *
 * @example
 *   ```tsx
 *   // Without animated blur effect
 *   <GlassAlertDialogContent animated={false}>
 *     {content}
 *   </GlassAlertDialogContent>
 *   ```;
 *
 * @param props - AlertDialogContent component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.variant - Visual variant style (default: "glass")
 * @param props.animated - Whether to apply animated backdrop blur (default:
 *   true)
 * @param props.children - Dialog content (header, description, footer, actions)
 * @param props... - All other standard AlertDialogContent props
 * @returns Glass-styled alert dialog content element
 * @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog Radix AlertDialog}
 */
export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof BaseAlertDialogContent>,
  AlertDialogContentProps
>(({ className, animated = true, ...props }, ref) => {
  return (
    <BaseAlertDialogContent
      ref={ref}
      className={cn(animated && "backdrop-blur-[var(--blur-lg)]", className)}
      {...props}
    />
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

/**
 * Re-exported AlertDialog sub-components for Glass UI composition.
 *
 * These components are re-exported from the base alert-dialog module to provide
 * a complete Glass alert dialog API. The composition follows a standard
 * pattern: AlertDialog root, Trigger to open, Content container, Header with
 * Title and Description, Footer with Action and Cancel buttons.
 *
 * @see {@link AlertDialogContent} Glass-styled content container
 */
export {
  /** Root alert dialog container - manages open/close state */
  BaseAlertDialog as AlertDialog,
  /** Button or element that triggers the dialog to open */
  AlertDialogTrigger,
  /** Container for dialog title and description */
  AlertDialogHeader,
  /** Container for action and cancel buttons */
  AlertDialogFooter,
  /** Dialog heading text */
  AlertDialogTitle,
  /** Dialog body/description text */
  AlertDialogDescription,
  /** Primary action button (typically destructive or confirming) */
  AlertDialogAction,
  /** Secondary button to dismiss the dialog */
  AlertDialogCancel,
};
