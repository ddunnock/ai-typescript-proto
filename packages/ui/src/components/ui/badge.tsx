/**
 * @module @convergence/ui/components/ui/badge
 * @file Badge component for displaying labels, status indicators, and tags.
 *   Provides a flexible badge component with multiple variants using
 *   class-variance-authority for styling and Radix UI Slot for composition.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Creates badge variant styles using class-variance-authority.
 *
 * Defines all available badge variants with their corresponding Tailwind CSS
 * classes. Includes focus, hover, and accessibility states.
 *
 * @example
 *   ```typescript
 *   const classes = badgeVariants({ variant: "default" });
 *   ```;
 *
 * @returns CVA function for generating badge class names
 * @see {@link https://cva.style/docs class-variance-authority}
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.15)] [a&]:hover:bg-gradient-to-r [a&]:hover:from-primary/95 [a&]:hover:via-primary [a&]:hover:to-primary [a&]:hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]",
        secondary:
          "border-transparent bg-gradient-to-r from-secondary via-secondary/95 to-secondary/90 text-secondary-foreground shadow-[0_2px_4px_rgba(0,0,0,0.15)] [a&]:hover:bg-gradient-to-r [a&]:hover:from-secondary/95 [a&]:hover:via-secondary [a&]:hover:to-secondary [a&]:hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)]",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive via-destructive/95 to-destructive/90 text-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] [a&]:hover:bg-gradient-to-r [a&]:hover:from-destructive/95 [a&]:hover:via-destructive [a&]:hover:to-destructive [a&]:hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-2 border-primary bg-transparent text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)] [a&]:hover:bg-primary/10 [a&]:hover:shadow-[0_2px_4px_rgba(0,0,0,0.15)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Props for the Badge component.
 *
 * Extends React span props and variant props from badgeVariants.
 *
 * @property {boolean} [asChild=false] - If true, the component will render its
 *   child as a badge. Default is `false`
 */
export interface BadgeProps
  extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

/**
 * Renders a customizable badge component.
 *
 * This component supports various visual styles and can render as a child
 * component. Commonly used for labels, status indicators, tags, and
 * notifications.
 *
 * @example
 *   ```tsx
 *   <Badge>New</Badge>
 *   <Badge variant="secondary">Draft</Badge>
 *   <Badge variant="destructive">Error</Badge>
 *   <Badge variant="outline">Tag</Badge>
 *   ```;
 *
 * @example
 *   ```tsx
 *   <Badge asChild>
 *     <Link href="/tags/react">React</Link>
 *   </Badge>
 *   ```;
 *
 * @param props - The properties for the Badge component
 * @param props.className - Additional CSS classes to apply to the badge
 * @param props.variant - The visual style of the badge (default, secondary,
 *   destructive, outline)
 * @param props.asChild - If true, the component will render its child as a
 *   badge
 * @param props.children - Badge content (text, icons, etc.)
 * @param props... - All other standard span HTML attributes
 * @returns {JSX.Element} The rendered badge component
 * @see badgeVariants
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: Readonly<BadgeProps>) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
