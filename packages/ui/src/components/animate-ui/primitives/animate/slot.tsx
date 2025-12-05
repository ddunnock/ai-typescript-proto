/**
 * @module @convergence/ui/components/animate-ui/primitives/animate/slot
 * @file Animated Slot component for motion-enhanced rendering. Provides a
 *   composable slot primitive that wraps child elements with Framer Motion
 *   capabilities while preserving their original functionality.
 */

"use client";

import * as React from "react";
import { motion, isMotionComponent, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Generic props type for any object with unknown values. Used for flexible prop
 * merging between slot and child components.
 */
type AnyProps = Record<string, unknown>;

/**
 * Motion-enabled DOM props for HTML elements. Extends Framer Motion's
 * HTMLMotionProps with ref support.
 *
 * @template T - The HTML element type
 */
type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  "ref"
> & { ref?: React.Ref<T> };

/**
 * Utility type for components supporting the asChild composition pattern. When
 * asChild is true, the component renders its child instead of its default
 * element, merging props and motion capabilities onto the child.
 *
 * @example
 *   ```tsx
 *   // When asChild is true, must provide a single ReactElement child
 *   <Button asChild>
 *     <a href="/link">Link styled as button</a>
 *   </Button>
 *   ```;
 *
 * @template Base - The base props type to extend
 */
type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false });

/**
 * Props for the Slot component.
 *
 * @template T - The HTML element type for ref handling
 */
type SlotProps<T extends HTMLElement = HTMLElement> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
} & DOMMotionProps<T>;

/**
 * Merges multiple React refs into a single ref callback. Handles both callback
 * refs and RefObject refs.
 *
 * @template T - The element type for the refs
 * @param refs - Array of refs to merge (can include undefined values)
 * @returns A ref callback that forwards the node to all provided refs
 * @internal
 */
function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        ref.current = node;
      }
    });
  };
}

/**
 * Merges props from child element and slot component. Handles special merging
 * for className (using cn utility) and style objects.
 *
 * @template T - The HTML element type
 * @param childProps - Props from the child element
 * @param slotProps - Props from the Slot component
 * @returns Merged props object with properly combined className and style
 * @internal
 */
function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

/**
 * Module-level cache for motion components. Created at module initialization,
 * not during component render.
 *
 * @internal
 */
const motionCache = new Map<React.ElementType, React.ElementType>();

/**
 * Helper function to get or create a motion component for a given type. Uses
 * module-level cache to avoid recreating components.
 *
 * @param type - The React element type to create a motion component for
 * @returns The motion-wrapped component from cache
 * @internal
 */
function getMotionComponent(type: React.ElementType): React.ElementType {
  if (!motionCache.has(type)) {
    motionCache.set(type, motion.create(type));
  }
  return motionCache.get(type)!;
}

/**
 * Animated Slot component that wraps child elements with Framer Motion
 * capabilities.
 *
 * Renders its child element with motion props applied, enabling animations on
 * any element without requiring it to be a motion component. If the child is
 * already a motion component, it preserves that; otherwise, it wraps it with
 * motion.create().
 *
 * @example
 *   ```tsx
 *   // Add hover animation to any element
 *   <Slot whileHover={{ scale: 1.1 }}>
 *     <button>Animated Button</button>
 *   </Slot>
 *
 *   // Combine with existing motion props
 *   <Slot initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 *     <div className="card">Content</div>
 *   </Slot>
 *   ```;
 *
 * @template T - The HTML element type for ref handling
 * @param props - Slot component props
 * @param props.children - The child element to wrap with motion capabilities
 * @param props.ref - Ref to attach to the rendered element
 * @param props... - All Framer Motion props (animate, initial, transition,
 *   etc.)
 * @returns The child element wrapped with motion capabilities, or null if
 *   invalid
 * @see {@link https://www.framer.com/motion/ Framer Motion}
 */
function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  if (!React.isValidElement(children)) return null;

  const isAlreadyMotion =
    typeof children.type === "object" &&
    children.type !== null &&
    isMotionComponent(children.type);

  // Use child's type directly if already a motion component, otherwise get motion version
  const Base: React.ElementType = isAlreadyMotion
    ? (children.type as React.ElementType)
    : getMotionComponent(children.type as React.ElementType);

  const { ref: childRef, ...childProps } = children.props as AnyProps;

  const mergedProps = mergeProps(childProps, props);

  return (
    <Base {...mergedProps} ref={mergeRefs(childRef as React.Ref<T>, ref)} />
  );
}

export {
  Slot,
  type SlotProps,
  type WithAsChild,
  type DOMMotionProps,
  type AnyProps,
};
