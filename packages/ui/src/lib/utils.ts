import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for merging Tailwind CSS classes.
 *
 * Combines clsx for conditional class names with tailwind-merge to
 * intelligently merge Tailwind classes, resolving conflicts and removing
 * duplicates.
 *
 * @example
 *   ```typescript
 *   cn("px-2 py-1", "px-4") // Returns "py-1 px-4" (px-4 overrides px-2)
 *   cn("bg-red-500", { "bg-blue-500": true }) // Returns "bg-blue-500"
 *   ```;
 *
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns Merged class string
 * @see {@link https://github.com/dcastil/tailwind-merge tailwind-merge}
 * @see {@link https://github.com/lukeed/clsx clsx}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
