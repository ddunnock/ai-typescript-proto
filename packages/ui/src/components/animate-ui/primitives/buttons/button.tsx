/**
 * @module @convergence/ui/components/animate-ui/primitives/buttons/button
 * @file Animated Button primitive with scale effects. Provides a
 *   motion-enhanced button with configurable hover and tap animations. Supports
 *   the asChild pattern for composition with other components.
 */

"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "motion/react";

import {
  Slot,
  type WithAsChild,
} from "@/components/animate-ui/primitives/animate/slot";

/**
 * Props for the animated Button primitive component. Extends Framer Motion
 * button props with scale animation configuration.
 */
type ButtonProps = WithAsChild<
  HTMLMotionProps<"button"> & {
    /** Scale factor on hover (default: 1.05) */
    hoverScale?: number;
    /** Scale factor on tap/press (default: 0.95) */
    tapScale?: number;
  }
>;

/**
 * Animated Button primitive with configurable scale effects.
 *
 * A motion-enhanced button that provides smooth scale animations on hover and
 * tap interactions. Supports the asChild pattern to compose motion capabilities
 * onto any child element.
 *
 * @example
 *   ```tsx
 *   // Basic animated button
 *   <Button>Click me</Button>
 *
 *   // Custom scale effects
 *   <Button hoverScale={1.1} tapScale={0.9}>
 *     Bounce more
 *   </Button>
 *
 *   // As child composition (animate a link as button)
 *   <Button asChild>
 *     <a href="/page">Link with button animation</a>
 *   </Button>
 *   ```;
 *
 * @param props - Button component props
 * @param props.hoverScale - Scale multiplier on hover (default: 1.05)
 * @param props.tapScale - Scale multiplier on tap/press (default: 0.95)
 * @param props.asChild - If true, renders child element with motion props
 *   merged
 * @param props.children - Button content or child element when asChild is true
 * @param props... - All other Framer Motion button props
 * @returns Animated button component
 * @see {@link Slot} For the underlying animation slot primitive
 * @see {@link https://www.framer.com/motion/ Framer Motion}
 */
function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : motion.button;

  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...props}
    />
  );
}

export { Button, type ButtonProps };
