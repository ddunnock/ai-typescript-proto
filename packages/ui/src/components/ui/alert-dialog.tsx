/**
 * @module @convergence/ui/components/ui/alert-dialog
 * @file AlertDialog component for important confirmations. Provides accessible
 *   modal dialogs for actions that require user confirmation, built on Radix UI
 *   Alert Dialog primitives.
 */

"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Root component for the AlertDialog.
 *
 * Provides the context for all AlertDialog sub-components. Manages the
 * open/closed state of the dialog.
 *
 * @example
 *   ```tsx
 *   <AlertDialog>
 *     <AlertDialogTrigger>Open</AlertDialogTrigger>
 *     <AlertDialogContent>
 *       <AlertDialogHeader>
 *         <AlertDialogTitle>Are you sure?</AlertDialogTitle>
 *         <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
 *       </AlertDialogHeader>
 *       <AlertDialogFooter>
 *         <AlertDialogCancel>Cancel</AlertDialogCancel>
 *         <AlertDialogAction>Continue</AlertDialogAction>
 *       </AlertDialogFooter>
 *     </AlertDialogContent>
 *   </AlertDialog>
 *   ```;
 *
 * @param props - AlertDialog root props from Radix UI
 * @param props.open - Controlled open state
 * @param props.defaultOpen - Default open state for uncontrolled usage
 * @param props.onOpenChange - Callback when open state changes
 * @param props.children - AlertDialog trigger and content
 * @returns React AlertDialog root component
 * @see {@link https://www.radix-ui.com/primitives/docs/components/alert-dialog Radix UI AlertDialog}
 */
function AlertDialog({
  ...props
}: Readonly<React.ComponentProps<typeof AlertDialogPrimitive.Root>>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 * Trigger button that opens the AlertDialog.
 *
 * Renders a button that, when clicked, opens the associated AlertDialog. Can be
 * styled with any button variant.
 *
 * @param props - Trigger props from Radix UI
 * @param props.asChild - Merge props onto child element instead of rendering
 *   button
 * @param props.children - Trigger content
 * @returns React button element that triggers the dialog
 * @see {@link AlertDialog} For the parent container
 */
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

/**
 * Portal container for rendering AlertDialog outside the DOM hierarchy.
 *
 * Renders AlertDialog content into a portal, ensuring proper stacking context
 * and avoiding z-index issues.
 *
 * @param props - Portal props from Radix UI
 * @param props.container - DOM element to render into (defaults to
 *   document.body)
 * @param props.children - Content to render in portal
 * @returns React portal component
 */
function AlertDialogPortal({
  ...props
}: Readonly<React.ComponentProps<typeof AlertDialogPrimitive.Portal>>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

/**
 * Semi-transparent overlay behind the AlertDialog.
 *
 * Renders a full-screen overlay that dims the background content. Includes
 * fade-in/fade-out animations for open/close states.
 *
 * @param props - Overlay props from Radix UI
 * @param props.className - Additional CSS classes
 * @returns React overlay element
 */
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * Main content container for the AlertDialog.
 *
 * Renders the dialog box centered on screen with overlay. Includes zoom and
 * fade animations, responsive max-width, and proper accessibility attributes.
 * Automatically includes Portal and Overlay.
 *
 * @example
 *   ```tsx
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Confirm Action</AlertDialogTitle>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Cancel</AlertDialogCancel>
 *       <AlertDialogAction>Confirm</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 *   ```;
 *
 * @param props - Content props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.children - Dialog content (header, footer, etc.)
 * @returns React dialog content container
 */
function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-card/80 backdrop-blur-xl border-glass-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border p-6 shadow-lg shadow-glass duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

/**
 * Header container for AlertDialog title and description.
 *
 * Flex column layout for organizing the dialog's title and description. Text is
 * centered on mobile and left-aligned on larger screens.
 *
 * @param props - Header div props
 * @param props.className - Additional CSS classes
 * @param props.children - Header content (title, description)
 * @returns React div element styled as dialog header
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/**
 * Footer container for AlertDialog action buttons.
 *
 * Flex layout for action buttons. Stacks vertically (reverse order) on mobile
 * and horizontally (right-aligned) on larger screens.
 *
 * @param props - Footer div props
 * @param props.className - Additional CSS classes
 * @param props.children - Footer content (Cancel and Action buttons)
 * @returns React div element styled as dialog footer
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

/**
 * Title component for the AlertDialog.
 *
 * Renders the main heading for the dialog with large, semibold text. Used for
 * accessibility to announce the dialog purpose to screen readers.
 *
 * @param props - Title props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.children - Title text
 * @returns React heading element
 */
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

/**
 * Description component for the AlertDialog.
 *
 * Renders explanatory text below the title with muted styling. Provides
 * additional context about the action being confirmed.
 *
 * @param props - Description props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.children - Description text
 * @returns React paragraph element
 */
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * Primary action button for the AlertDialog.
 *
 * Renders the confirm/proceed button with default button styling. Clicking this
 * button closes the dialog and should trigger the confirmed action.
 *
 * @example
 *   ```tsx
 *   <AlertDialogAction onClick={handleDelete}>
 *     Delete Item
 *   </AlertDialogAction>
 *   ```;
 *
 * @param props - Action props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.onClick - Handler for the action (in addition to closing dialog)
 * @param props.children - Button text
 * @returns React button element with primary styling
 */
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

/**
 * Cancel button for the AlertDialog.
 *
 * Renders the cancel/dismiss button with outline button styling. Clicking this
 * button closes the dialog without triggering any action.
 *
 * @example
 *   ```tsx
 *   <AlertDialogCancel>Cancel</AlertDialogCancel>
 *   ```;
 *
 * @param props - Cancel props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.children - Button text (typically "Cancel")
 * @returns React button element with outline styling
 */
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
