/**
 * @module @convergence/ui/components/ui/alert
 * @file Alert component with variant support. Provides accessible alert
 *   messages with default and destructive variants using
 *   class-variance-authority for styling.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Creates alert variant styles using class-variance-authority.
 *
 * Defines all available alert variants with their corresponding Tailwind CSS
 * classes. Includes responsive grid layout for icon support.
 *
 * @example
 *   ```typescript
 *   const classes = alertVariants({ variant: "destructive" });
 *   ```;
 *
 * @returns CVA function for generating alert class names
 * @see {@link https://cva.style/docs class-variance-authority}
 */
const alertVariants = cva(
  "relative w-full rounded-xl border border-glass-border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current backdrop-blur-xl shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-card/80 text-card-foreground",
        destructive:
          "text-destructive bg-card/80 [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Alert component for displaying important messages.
 *
 * A flexible alert component that supports multiple visual variants (default,
 * destructive). Uses role="alert" for accessibility and automatically adjusts
 * layout when an SVG icon is present as a direct child.
 *
 * @example
 *   ```tsx
 *   // Default alert
 *   <Alert>
 *     <AlertTitle>Heads up!</AlertTitle>
 *     <AlertDescription>You can add components to your app.</AlertDescription>
 *   </Alert>
 *
 *   // Destructive alert with icon
 *   <Alert variant="destructive">
 *     <AlertCircle className="h-4 w-4" />
 *     <AlertTitle>Error</AlertTitle>
 *     <AlertDescription>Your session has expired.</AlertDescription>
 *   </Alert>
 *   ```;
 *
 * @param props - Alert component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.variant - Visual variant style ("default" | "destructive")
 * @param props.children - Alert content (text, icons, AlertTitle,
 *   AlertDescription)
 * @returns React alert component
 * @see {@link AlertTitle} For the alert title component
 * @see {@link AlertDescription} For the alert description component
 * @see {@link alertVariants} For available variants
 */
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * Alert title component for the main heading of an alert.
 *
 * Renders the title text within an Alert. Positioned in the second column of
 * the grid layout (next to an optional icon). Text is clamped to a single line
 * with ellipsis for overflow.
 *
 * @example
 *   ```tsx
 *   <Alert>
 *     <AlertTitle>Success!</AlertTitle>
 *     <AlertDescription>Your changes have been saved.</AlertDescription>
 *   </Alert>
 *   ```;
 *
 * @param props - AlertTitle component props
 * @param props.className - Additional CSS classes
 * @param props.children - Title text content
 * @returns React div element styled as alert title
 * @see {@link Alert} For the parent alert container
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

/**
 * Alert description component for the body text of an alert.
 *
 * Renders the descriptive text within an Alert. Positioned in the second column
 * of the grid layout (aligned with the title). Uses muted foreground color and
 * supports nested paragraph elements with relaxed line-height.
 *
 * @example
 *   ```tsx
 *   <Alert>
 *     <AlertTitle>Note</AlertTitle>
 *     <AlertDescription>
 *       <p>This is a longer description with multiple paragraphs.</p>
 *       <p>Each paragraph will have relaxed line-height for readability.</p>
 *     </AlertDescription>
 *   </Alert>
 *   ```;
 *
 * @param props - AlertDescription component props
 * @param props.className - Additional CSS classes
 * @param props.children - Description content (text or elements)
 * @returns React div element styled as alert description
 * @see {@link Alert} For the parent alert container
 * @see {@link AlertTitle} For the alert title component
 */
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
