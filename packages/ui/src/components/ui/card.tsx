/**
 * @module @convergence/ui/components/ui/card
 * @file Card component system for displaying content in containers. Provides a
 *   composition-based card component with header, title, description, content,
 *   footer, and action sections.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Root card container component.
 *
 * The main container for card content. Provides base styling with background,
 * border, shadow, and padding. All other card components should be children of
 * this component.
 *
 * @example
 *   ```tsx
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Title</CardTitle>
 *     </CardHeader>
 *     <CardContent>Content</CardContent>
 *   </Card>
 *   ```;
 *
 * @param props - Card component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Card content (typically CardHeader, CardContent,
 *   CardFooter)
 * @param props... - All other standard div HTML attributes
 * @returns React card container component
 * @see {@link CardHeader}
 * @see {@link CardContent}
 * @see {@link CardFooter}
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card/80 backdrop-blur-xl text-card-foreground flex flex-col gap-6 rounded-xl border border-glass-border py-6 shadow-lg transition-all duration-200 hover:shadow-xl hover:bg-card/90",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card header section component.
 *
 * Container for card title, description, and optional action. Uses CSS
 * container queries for responsive layout. Automatically adjusts when
 * CardAction is present.
 *
 * @example
 *   ```tsx
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *     <CardAction>
 *       <Button>Action</Button>
 *     </CardAction>
 *   </CardHeader>
 *   ```;
 *
 * @param props - CardHeader component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Header content (typically CardTitle, CardDescription,
 *   CardAction)
 * @param props... - All other standard div HTML attributes
 * @returns React card header component
 * @see {@link CardTitle}
 * @see {@link CardDescription}
 * @see {@link CardAction}
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card title component.
 *
 * Displays the main title text for the card. Uses semibold font weight and
 * proper line height for readability.
 *
 * @example
 *   ```tsx
 *   <CardTitle>Product Name</CardTitle>
 *   ```;
 *
 * @param props - CardTitle component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Title text content
 * @param props... - All other standard div HTML attributes
 * @returns React card title component
 * @see {@link CardHeader}
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

/**
 * Card description component.
 *
 * Displays secondary descriptive text below the title. Uses muted foreground
 * color and smaller font size.
 *
 * @example
 *   ```tsx
 *   <CardDescription>
 *     Additional information about the card content
 *   </CardDescription>
 *   ```;
 *
 * @param props - CardDescription component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Description text content
 * @param props... - All other standard div HTML attributes
 * @returns React card description component
 * @see {@link CardHeader}
 * @see {@link CardTitle}
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * Card action component.
 *
 * Container for action buttons or controls in the card header. Positioned in
 * the top-right corner when used within CardHeader.
 *
 * @example
 *   ```tsx
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardAction>
 *       <Button variant="ghost" size="icon">
 *         <MoreIcon />
 *       </Button>
 *     </CardAction>
 *   </CardHeader>
 *   ```;
 *
 * @param props - CardAction component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Action content (typically Button components)
 * @param props... - All other standard div HTML attributes
 * @returns React card action component
 * @see {@link CardHeader}
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

/**
 * Card content section component.
 *
 * Main content area of the card. Provides horizontal padding to align with
 * header and footer sections.
 *
 * @example
 *   ```tsx
 *   <CardContent>
 *     <p>Main card content goes here</p>
 *   </CardContent>
 *   ```;
 *
 * @param props - CardContent component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Main card content
 * @param props... - All other standard div HTML attributes
 * @returns React card content component
 * @see {@link Card}
 * @see {@link CardHeader}
 * @see {@link CardFooter}
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

/**
 * Card footer section component.
 *
 * Container for footer content such as action buttons or additional
 * information. Uses flexbox layout with responsive column/row direction.
 *
 * @example
 *   ```tsx
 *   <CardFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Submit</Button>
 *   </CardFooter>
 *   ```;
 *
 * @param props - CardFooter component props
 * @param props.className - Additional CSS classes to merge
 * @param props.children - Footer content (typically Button components)
 * @param props... - All other standard div HTML attributes
 * @returns React card footer component
 * @see {@link Card}
 * @see {@link CardContent}
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
