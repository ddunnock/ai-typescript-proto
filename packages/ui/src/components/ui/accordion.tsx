/**
 * @fileoverview Accordion component for collapsible content sections.
 * Provides accessible, animated accordion panels built on Radix UI primitives
 * with chevron indicators and keyboard navigation support.
 * @module @convergence/ui/components/ui/accordion
 */

"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Root component for the Accordion.
 *
 * @description Provides context for accordion items and manages expanded state.
 * Supports single item expansion (default) or multiple item expansion modes.
 *
 * @param props - Accordion root props from Radix UI
 * @param props.type - "single" for one item at a time, "multiple" for any number
 * @param props.collapsible - Allow all items to be collapsed (single mode only)
 * @param props.defaultValue - Default expanded item(s)
 * @param props.value - Controlled expanded item(s)
 * @param props.onValueChange - Callback when expanded items change
 * @param props.children - AccordionItem components
 * @returns React Accordion root component
 *
 * @example
 * ```tsx
 * // Single item expansion (default)
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>Section 1</AccordionTrigger>
 *     <AccordionContent>Content 1</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // Multiple items can be expanded
 * <Accordion type="multiple">
 *   <AccordionItem value="item-1">...</AccordionItem>
 *   <AccordionItem value="item-2">...</AccordionItem>
 * </Accordion>
 * ```
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/accordion Radix UI Accordion}
 */
function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

/**
 * Individual accordion item container.
 *
 * @description Wraps a single collapsible section with its trigger and content.
 * Includes a bottom border that is removed from the last item.
 *
 * @param props - AccordionItem props from Radix UI
 * @param props.value - Unique identifier for this item (required)
 * @param props.disabled - Prevent this item from being expanded
 * @param props.className - Additional CSS classes
 * @param props.children - AccordionTrigger and AccordionContent
 * @returns React accordion item container
 *
 * @example
 * ```tsx
 * <AccordionItem value="faq-1">
 *   <AccordionTrigger>What is this?</AccordionTrigger>
 *   <AccordionContent>This is an accordion.</AccordionContent>
 * </AccordionItem>
 * ```
 */
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

/**
 * Clickable trigger that expands/collapses accordion content.
 *
 * @description Renders a button that toggles the visibility of the associated
 * AccordionContent. Includes a chevron icon that rotates 180 degrees when expanded.
 * Supports keyboard navigation and focus states.
 *
 * @param props - AccordionTrigger props from Radix UI
 * @param props.className - Additional CSS classes
 * @param props.disabled - Disable the trigger
 * @param props.children - Trigger label text
 * @returns React button element with chevron icon
 *
 * @example
 * ```tsx
 * <AccordionTrigger>Click to expand</AccordionTrigger>
 * ```
 */
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

/**
 * Collapsible content container for an accordion item.
 *
 * @description Renders the expandable content section with smooth slide animations.
 * Content is hidden when collapsed and revealed with an accordion-down animation
 * when expanded.
 *
 * @param props - AccordionContent props from Radix UI
 * @param props.className - Additional CSS classes for the inner content wrapper
 * @param props.children - Content to display when expanded
 * @param props.forceMount - Force content to remain mounted when collapsed
 * @returns React collapsible content container
 *
 * @example
 * ```tsx
 * <AccordionContent>
 *   <p>This content is revealed when the accordion is expanded.</p>
 *   <p>It can contain any React elements.</p>
 * </AccordionContent>
 * ```
 */
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
