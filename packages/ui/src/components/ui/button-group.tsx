/**
 * @module @convergence/ui/components/ui/button-group
 * @file Button Group component for grouping related buttons together. Provides
 *   a flexible button group system with horizontal and vertical orientations,
 *   separators, and text labels.
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

/**
 * Creates button group variant styles using class-variance-authority.
 *
 * Defines all available button group variants with their corresponding Tailwind
 * CSS classes. Includes orientation variants (horizontal, vertical) with
 * appropriate border radius and border handling for connected buttons.
 *
 * @example
 *   ```typescript
 *   const classes = buttonGroupVariants({ orientation: "horizontal" });
 *   ```;
 *
 * @returns CVA function for generating button group class names
 * @see {@link https://cva.style/docs class-variance-authority}
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
);

/**
 * Button group container component.
 *
 * Groups related buttons together with connected borders and shared styling.
 * Supports both horizontal and vertical orientations. Automatically handles
 * border radius and border removal for seamless button connections.
 *
 * @example
 *   ```tsx
 *   // Horizontal button group
 *   <ButtonGroup>
 *     <Button>First</Button>
 *     <Button>Second</Button>
 *     <Button>Third</Button>
 *   </ButtonGroup>
 *
 *   // Vertical button group
 *   <ButtonGroup orientation="vertical">
 *     <Button>Top</Button>
 *     <Button>Middle</Button>
 *     <Button>Bottom</Button>
 *   </ButtonGroup>
 *   ```;
 *
 * @param props - ButtonGroup component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.orientation - Button group orientation ("horizontal" |
 *   "vertical")
 * @param props.children - Button group content (buttons, inputs, selects)
 * @param props... - All other standard div HTML attributes
 * @returns React button group component
 * @see {@link buttonGroupVariants} For available variants
 */
function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  );
}

/**
 * Button group text label component.
 *
 * A text label that can be used within a button group to provide context or
 * grouping information. Supports both standard div rendering and custom
 * components via the asChild prop.
 *
 * @example
 *   ```tsx
 *   // Standard text label
 *   <ButtonGroupText>Filter by:</ButtonGroupText>
 *
 *   // Custom component
 *   <ButtonGroupText asChild>
 *     <Label>Filter by:</Label>
 *   </ButtonGroupText>
 *   ```;
 *
 * @param props - ButtonGroupText component props
 * @param props.asChild - If true, renders as child component using Radix Slot
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Text label content
 * @param props... - All other standard div HTML attributes
 * @returns React button group text component
 * @see {@link https://www.radix-ui.com/primitives/docs/components/slot Radix UI Slot}
 */
function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

/**
 * Button group separator component.
 *
 * A visual separator that can be placed between buttons in a button group.
 * Supports both horizontal and vertical orientations to match the button group
 * layout.
 *
 * @example
 *   ```tsx
 *   <ButtonGroup>
 *     <Button>Action 1</Button>
 *     <ButtonGroupSeparator />
 *     <Button>Action 2</Button>
 *   </ButtonGroup>
 *   ```;
 *
 * @param props - ButtonGroupSeparator component props
 * @param props.className - Additional CSS classes to merge
 * @param props.orientation - Separator orientation ("horizontal" | "vertical")
 * @param props... - All other standard Separator HTML attributes
 * @returns React button group separator component
 * @see {@link Separator} For the base separator component
 */
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
