/**
 * @module @convergence/ui/components/ui/breadcrumb
 * @file Breadcrumb component for displaying navigation hierarchy. Provides a
 *   flexible breadcrumb navigation system with links, separators, ellipsis, and
 *   page indicators.
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";

/**
 * Root breadcrumb navigation container.
 *
 * The main container for breadcrumb navigation. Provides semantic HTML with
 * proper ARIA labeling for accessibility. All breadcrumb components should be
 * children of this component.
 *
 * @example
 *   ```tsx
 *   <Breadcrumb>
 *     <BreadcrumbList>
 *       <BreadcrumbItem>
 *         <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *       </BreadcrumbItem>
 *       <BreadcrumbSeparator />
 *       <BreadcrumbItem>
 *         <BreadcrumbPage>Current Page</BreadcrumbPage>
 *       </BreadcrumbItem>
 *     </BreadcrumbList>
 *   </Breadcrumb>
 *   ```;
 *
 * @param props - Breadcrumb component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Breadcrumb content (typically BreadcrumbList)
 * @param props... - All other standard nav HTML attributes
 * @returns React breadcrumb navigation container
 * @see {@link BreadcrumbList}
 * @see {@link BreadcrumbItem}
 * @see {@link BreadcrumbLink}
 */
function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/**
 * Breadcrumb list container.
 *
 * The ordered list container for breadcrumb items. Provides flex layout with
 * responsive gap spacing and text wrapping for mobile devices.
 *
 * @example
 *   ```tsx
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 *   ```;
 *
 * @param props - BreadcrumbList component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Breadcrumb items
 * @param props... - All other standard ol HTML attributes
 * @returns React breadcrumb list component
 * @see {@link BreadcrumbItem}
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className
      )}
      {...props}
    />
  );
}

/**
 * Individual breadcrumb item container.
 *
 * Container for a single breadcrumb link or page indicator. Provides inline
 * flex layout with consistent gap spacing.
 *
 * @example
 *   ```tsx
 *   <BreadcrumbItem>
 *     <BreadcrumbLink href="/">Home</BreadcrumbLink>
 *   </BreadcrumbItem>
 *   ```;
 *
 * @param props - BreadcrumbItem component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Breadcrumb link or page content
 * @param props... - All other standard li HTML attributes
 * @returns React breadcrumb item component
 * @see {@link BreadcrumbLink}
 * @see {@link BreadcrumbPage}
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

/**
 * Breadcrumb link component.
 *
 * A clickable link within a breadcrumb navigation. Supports both standard
 * anchor tags and custom components via the asChild prop. Includes hover state
 * transitions for better UX.
 *
 * @example
 *   ```tsx
 *   // Standard link
 *   <BreadcrumbLink href="/home">Home</BreadcrumbLink>
 *
 *   // Custom component
 *   <BreadcrumbLink asChild>
 *     <Link to="/home">Home</Link>
 *   </BreadcrumbLink>
 *   ```;
 *
 * @param props - BreadcrumbLink component props
 * @param props.asChild - If true, renders as child component using Radix Slot
 * @param props.className - Additional CSS classes to merge
 * @param props.href - Link destination URL
 * @param props.children - Link text or content
 * @param props... - All other standard anchor HTML attributes
 * @returns React breadcrumb link component
 * @see {@link https://www.radix-ui.com/primitives/docs/components/slot Radix UI Slot}
 */
function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  );
}

/**
 * Breadcrumb page indicator.
 *
 * Displays the current page in the breadcrumb navigation. This component is
 * non-clickable and represents the current location. Uses appropriate ARIA
 * attributes for accessibility.
 *
 * @example
 *   ```tsx
 *   <BreadcrumbPage>Settings</BreadcrumbPage>
 *   ```;
 *
 * @param props - BreadcrumbPage component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Page name or content
 * @param props... - All other standard span HTML attributes
 * @returns React breadcrumb page component
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

/**
 * Breadcrumb separator component.
 *
 * Visual separator between breadcrumb items. Defaults to a chevron right icon
 * but can be customized by passing children. Uses presentation role for
 * accessibility.
 *
 * @example
 *   ```tsx
 *   // Default chevron separator
 *   <BreadcrumbSeparator />
 *
 *   // Custom separator
 *   <BreadcrumbSeparator>/</BreadcrumbSeparator>
 *   ```;
 *
 * @param props - BreadcrumbSeparator component props
 * @param props.children - Custom separator content (defaults to
 *   ChevronRightIcon)
 * @param props.className - Additional CSS classes to merge
 * @param props... - All other standard li HTML attributes
 * @returns React breadcrumb separator component
 */
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  );
}

/**
 * Breadcrumb ellipsis component.
 *
 * Displays an ellipsis indicator when breadcrumb items are collapsed. Used to
 * indicate that there are more items in the navigation hierarchy that are not
 * currently visible. Includes screen reader text for accessibility.
 *
 * @example
 *   ```tsx
 *   <BreadcrumbEllipsis />
 *   ```;
 *
 * @param props - BreadcrumbEllipsis component props
 * @param props.className - Additional CSS classes to merge
 * @param props... - All other standard span HTML attributes
 * @returns React breadcrumb ellipsis component
 */
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <DotsHorizontalIcon className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
