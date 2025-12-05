/**
 * @module @convergence/ui/hooks/use-is-in-view
 * @file Hook for detecting when an element is in the viewport. Wraps Framer
 *   Motion's useInView with additional configuration options.
 */

import * as React from "react";
import { useInView, type UseInViewOptions } from "motion/react";

interface UseIsInViewOptions {
  inView?: boolean;
  inViewOnce?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
}

/**
 * Hook for detecting when an element enters the viewport.
 *
 * Uses Framer Motion's intersection observer-based detection with customizable
 * options for margin and once-only triggering.
 *
 * @example
 *   ```tsx
 *   const { ref, isInView } = useIsInView<HTMLDivElement>(null, {
 *     inViewOnce: true,
 *     inViewMargin: "100px"
 *   });
 *
 *   return <div ref={ref}>{isInView && 'Visible!'}</div>;
 *   ```;
 *
 * @template T - The HTML element type
 * @param ref - React ref to forward to the element
 * @param options - Configuration options
 * @param options.inView - If false, always returns true (disables detection)
 * @param options.inViewOnce - If true, only triggers once when element first
 *   enters view
 * @param options.inViewMargin - Margin around viewport for triggering (e.g.
 *   "100px")
 * @returns Object with ref to attach to element and isInView boolean
 */
function useIsInView<T extends HTMLElement = HTMLElement>(
  ref: React.Ref<T>,
  options: UseIsInViewOptions = {}
) {
  const { inView, inViewOnce = false, inViewMargin = "0px" } = options;
  const localRef = React.useRef<T>(null);
  React.useImperativeHandle(ref, () => localRef.current as T);
  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;
  return { ref: localRef, isInView };
}

export { useIsInView, type UseIsInViewOptions };
