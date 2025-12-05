/**
 * @module @convergence/ui/components/ui/dialog
 * @file Dialog component system for modal dialogs and overlays. Built on Radix
 *   UI Dialog primitives with portal rendering, focus management, and
 *   accessibility features.
 */

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Dialog root component.
 *
 * Root container for dialog system. Manages dialog state (open/closed) and
 * provides context to child components. Must wrap all other dialog components.
 *
 * @example
 *   ```tsx
 *   <Dialog>
 *     <DialogTrigger>Open</DialogTrigger>
 *     <DialogContent>
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>Description</DialogDescription>
 *     </DialogContent>
 *   </Dialog>
 *   ```;
 *
 * @param props - Dialog root props from Radix UI
 * @param props.open - Controlled open state
 * @param props.defaultOpen - Uncontrolled default open state
 * @param props.onOpenChange - Callback when open state changes
 * @param props.modal - Whether dialog is modal (default: true)
 * @param props.children - Dialog content (typically DialogTrigger and
 *   DialogContent)
 * @param props... - All other Radix UI Dialog.Root props
 * @returns React dialog root component
 * @see {@link https://www.radix-ui.com/primitives/docs/components/dialog Radix UI Dialog}
 * @see {@link DialogTrigger}
 * @see {@link DialogContent}
 */
function Dialog({
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Root>>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * Dialog trigger component.
 *
 * Button or element that opens the dialog when clicked. Automatically manages
 * aria attributes and keyboard interactions.
 *
 * @example
 *   ```tsx
 *   <DialogTrigger asChild>
 *     <Button>Open Dialog</Button>
 *   </DialogTrigger>
 *   ```;
 *
 * @param props - Dialog trigger props from Radix UI
 * @param props.asChild - Render as child component (default: false)
 * @param props.children - Trigger content (typically Button)
 * @param props... - All other Radix UI Dialog.Trigger props
 * @returns React dialog trigger component
 * @see {@link Dialog}
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * Dialog portal component.
 *
 * Renders dialog content in a portal outside the main DOM tree. Ensures proper
 * z-index stacking and prevents layout issues.
 *
 * @param props - Dialog portal props from Radix UI
 * @param props.container - Portal container element (default: document.body)
 * @param props.children - Content to portal (typically DialogContent)
 * @param props... - All other Radix UI Dialog.Portal props
 * @returns React dialog portal component
 * @internal
 * @see {@link DialogContent}
 */
function DialogPortal({
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Portal>>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * Dialog close component.
 *
 * Button that closes the dialog when clicked. Can be used anywhere within the
 * dialog content.
 *
 * @example
 *   ```tsx
 *   <DialogClose asChild>
 *     <Button variant="ghost" size="icon">
 *       <XIcon />
 *     </Button>
 *   </DialogClose>
 *   ```;
 *
 * @param props - Dialog close props from Radix UI
 * @param props.asChild - Render as child component (default: false)
 * @param props.children - Close button content
 * @param props... - All other Radix UI Dialog.Close props
 * @returns React dialog close component
 * @see {@link DialogContent}
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Dialog overlay component.
 *
 * Backdrop overlay that appears behind the dialog content. Provides visual
 * separation and can be clicked to close the dialog.
 *
 * @param props - Dialog overlay props from Radix UI
 * @param props.className - Additional CSS classes to merge
 * @param props... - All other Radix UI Dialog.Overlay props
 * @returns React dialog overlay component
 * @internal
 * @see {@link DialogContent}
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * Dialog content component.
 *
 * Main content container for the dialog. Renders in a portal with overlay,
 * animations, and focus management. Includes optional close button.
 *
 * @example
 *   ```tsx
 *   <DialogContent showCloseButton={true}>
 *     <DialogHeader>
 *       <DialogTitle>Confirm Action</DialogTitle>
 *       <DialogDescription>Are you sure?</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <Button>Cancel</Button>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 *   ```;
 *
 * @param props - Dialog content props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Dialog content (typically DialogHeader, DialogTitle,
 *   etc.)
 * @param props.showCloseButton - Whether to show the close button (default:
 *   true)
 * @param props.onEscapeKeyDown - Handler for Escape key press
 * @param props.onPointerDownOutside - Handler for outside click
 * @param props.onInteractOutside - Handler for outside interaction
 * @param props... - All other Radix UI Dialog.Content props
 * @returns React dialog content component
 * @see {@link DialogHeader}
 * @see {@link DialogTitle}
 * @see {@link DialogDescription}
 * @see {@link DialogFooter}
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-card/80 backdrop-blur-xl border-glass-border data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border p-6 shadow-lg shadow-glass duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Dialog header section component.
 *
 * Container for dialog title and description. Provides consistent spacing and
 * layout for header content.
 *
 * @example
 *   ```tsx
 *   <DialogHeader>
 *     <DialogTitle>Dialog Title</DialogTitle>
 *     <DialogDescription>Dialog description text</DialogDescription>
 *   </DialogHeader>
 *   ```;
 *
 * @param props - Dialog header props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Header content (typically DialogTitle and
 *   DialogDescription)
 * @param props... - All other standard div HTML attributes
 * @returns React dialog header component
 * @see {@link DialogTitle}
 * @see {@link DialogDescription}
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/**
 * Dialog footer section component.
 *
 * Container for dialog action buttons. Uses responsive flexbox layout (column
 * on mobile, row on desktop).
 *
 * @example
 *   ```tsx
 *   <DialogFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Confirm</Button>
 *   </DialogFooter>
 *   ```;
 *
 * @param props - Dialog footer props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Footer content (typically Button components)
 * @param props... - All other standard div HTML attributes
 * @returns React dialog footer component
 * @see {@link DialogContent}
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

/**
 * Dialog title component.
 *
 * Accessible title for the dialog. Required for screen readers and
 * accessibility compliance. Automatically associated with dialog content.
 *
 * @example
 *   ```tsx
 *   <DialogTitle>Delete Item</DialogTitle>
 *   ```;
 *
 * @param props - Dialog title props from Radix UI
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Title text content
 * @param props... - All other Radix UI Dialog.Title props
 * @returns React dialog title component
 * @see {@link DialogHeader}
 * @see {@link DialogDescription}
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

/**
 * Dialog description component.
 *
 * Accessible description for the dialog. Provides additional context for screen
 * readers and users. Optional but recommended.
 *
 * @example
 *   ```tsx
 *   <DialogDescription>
 *     This action cannot be undone. This will permanently delete the item.
 *   </DialogDescription>
 *   ```;
 *
 * @param props - Dialog description props from Radix UI
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Description text content
 * @param props... - All other Radix UI Dialog.Description props
 * @returns React dialog description component
 * @see {@link DialogHeader}
 * @see {@link DialogTitle}
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
