/**
 * @module @convergence/ui/components/ui/glass/accordion
 * @file Glass Accordion - Enhanced accordion component with glassmorphism
 *   effects. Provides a collapsible content container with glass-styled
 *   triggers featuring optional glow effects on expansion.
 */

"use client";

import * as React from "react";
import {
  Accordion as BaseAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger as BaseAccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/**
 * Props for the Glass AccordionTrigger component.
 *
 * Extends the base AccordionTrigger props with glass-specific options for
 * enhanced visual effects.
 *
 * @extends {React.ComponentProps<typeof BaseAccordionTrigger>}
 * @interface AccordionTriggerProps
 */
export interface AccordionTriggerProps extends React.ComponentProps<
  typeof BaseAccordionTrigger
> {
  /**
   * Whether to show a purple glow effect when the accordion item is open.
   *
   * @default false
   */
  glow?: boolean;
}

/**
 * Glass-styled accordion trigger with optional glow effects.
 *
 * An enhanced version of the base AccordionTrigger that defaults to the glass
 * variant and supports an optional purple glow effect when expanded. Use this
 * component within a GlassAccordion for consistent glassmorphism styling.
 *
 * @example
 *   ```tsx
 *   <GlassAccordion type="single" collapsible>
 *     <GlassAccordionItem value="item-1">
 *       <GlassAccordionTrigger glow>
 *         Click to expand
 *       </GlassAccordionTrigger>
 *       <GlassAccordionContent>
 *         Hidden content revealed on expansion
 *       </GlassAccordionContent>
 *     </GlassAccordionItem>
 *   </GlassAccordion>
 *   ```;
 *
 * @param props - AccordionTrigger component props
 * @param props.className - Additional CSS classes to merge with variant classes
 * @param props.variant - Visual variant style (default: "glass")
 * @param props.glow - Whether to show purple glow on open state (default:
 *   false)
 * @param props.children - Trigger content (text, icons, etc.)
 * @param props... - All other standard AccordionTrigger props
 * @returns Glass-styled accordion trigger element
 * @see {@link https://www.radix-ui.com/primitives/docs/components/accordion Radix Accordion}
 */
export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof BaseAccordionTrigger>,
  AccordionTriggerProps
>(({ className, glow = false, ...props }, ref) => {
  return (
    <BaseAccordionTrigger
      ref={ref}
      className={cn(
        glow &&
          "data-[state=open]:[box-shadow:0_0_15px_hsl(var(--primary)/0.5),0_0_30px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    />
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

/**
 * Re-exported Accordion components for Glass UI composition.
 *
 * These components are re-exported from the base accordion module to provide a
 * complete Glass accordion API. Use GlassAccordion as the root, with
 * GlassAccordionItem for each collapsible section.
 *
 * @see {@link AccordionTrigger} Glass-styled trigger component
 */
export {
  /** Root accordion container - manages single or multiple expansion */
  BaseAccordion as Accordion,
  /** Individual accordion section wrapper */
  AccordionItem,
  /** Content container revealed when item is expanded */
  AccordionContent,
};
