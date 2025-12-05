/**
 * @fileoverview AspectRatio component for maintaining consistent aspect ratios.
 * Provides a wrapper component that maintains a specific aspect ratio for its
 * content, useful for responsive images, videos, and other media.
 * @module @convergence/ui/components/ui/aspect-ratio
 */

"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

/**
 * AspectRatio component that maintains a consistent aspect ratio for its content.
 *
 * @description Wraps content in a container that maintains a specific aspect ratio,
 * ensuring consistent sizing across different screen sizes. Commonly used for
 * images, videos, and other media that need to maintain proportions.
 *
 * @param props - Component props extending AspectRatioPrimitive.Root
 * @param props.ratio - The aspect ratio to maintain (width/height, e.g., 16/9 = 1.777)
 * @param props.className - Additional CSS classes to apply
 * @param props.children - Content to maintain aspect ratio for
 * @param props... - All other AspectRatioPrimitive.Root props
 * @returns React component that maintains aspect ratio
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="/image.jpg" alt="Description" />
 * </AspectRatio>
 * ```
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={1}>
 *   <div className="bg-primary">Square content</div>
 * </AspectRatio>
 * ```
 *
 * @see {@link https://www.radix-ui.com/primitives/docs/components/aspect-ratio Radix UI AspectRatio}
 */
function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
