/**
 * @module @convergence/ui/components/animate-ui/components/buttons/copy
 * @file Copy Button component with animated icon transitions. Provides a button
 *   that copies content to clipboard with visual feedback showing a checkmark
 *   animation when content is successfully copied.
 */

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon, CopyIcon } from "lucide-react";

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "@/components/animate-ui/primitives/buttons/button";
import { cn } from "@/lib/utils";
import { useControlledState } from "@/hooks/use-controlled-state";

/**
 * Button variant styles for the CopyButton using class-variance-authority.
 * Defines visual variants (default, accent, destructive, outline, secondary,
 * ghost, link) and size variants (default, xs, sm, lg).
 *
 * @see {@link https://cva.style/docs class-variance-authority}
 */
const buttonVariants = cva(
  "flex items-center justify-center rounded-md transition-[box-shadow,_color,_background-color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground shadow-xs hover:bg-accent/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "size-9",
        xs: "size-7 [&_svg:not([class*='size-'])]:size-3.5 rounded-md",
        sm: "size-8 rounded-md",
        lg: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/**
 * Props for the CopyButton component. Extends the animated Button primitive
 * props with clipboard functionality.
 */
type CopyButtonProps = Omit<ButtonPrimitiveProps, "children"> &
  VariantProps<typeof buttonVariants> & {
    /** The content string to copy to clipboard when clicked */
    content: string;
    /** Controlled state for copied status */
    copied?: boolean;
    /** Callback fired when copied state changes */
    onCopiedChange?: (copied: boolean, content?: string) => void;
    /** Duration in ms to show the checkmark before reverting (default: 3000) */
    delay?: number;
  };

/**
 * Copy Button component with animated icon transition.
 *
 * A button that copies content to the clipboard when clicked, displaying an
 * animated transition from a copy icon to a checkmark icon to provide visual
 * feedback. Supports controlled and uncontrolled usage.
 *
 * @example
 *   ```tsx
 *   // Basic usage
 *   <CopyButton content="Text to copy" />
 *
 *   // With variant and size
 *   <CopyButton content={code} variant="ghost" size="sm" />
 *
 *   // Controlled usage with callback
 *   <CopyButton
 *     content={apiKey}
 *     copied={isCopied}
 *     onCopiedChange={(copied) => setIsCopied(copied)}
 *     delay={5000}
 *   />
 *   ```;
 *
 * @param props - CopyButton component props
 * @param props.className - Additional CSS classes to merge
 * @param props.content - The string content to copy to clipboard
 * @param props.copied - Controlled copied state
 * @param props.onCopiedChange - Callback when copied state changes
 * @param props.onClick - Additional click handler (runs before copy)
 * @param props.variant - Visual variant style (default, accent, destructive,
 *   etc.)
 * @param props.size - Size variant (default, xs, sm, lg)
 * @param props.delay - Duration to show checkmark before resetting (default:
 *   3000ms)
 * @param props... - All other animated button props
 * @returns Animated copy button component
 * @see {@link Button} For the underlying animated button primitive
 */
function CopyButton({
  className,
  content,
  copied,
  onCopiedChange,
  onClick,
  variant,
  size,
  delay = 3000,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useControlledState({
    value: copied,
    onChange: onCopiedChange,
  });

  const handleCopy = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (copied) return;
      if (content) {
        navigator.clipboard
          .writeText(content)
          .then(() => {
            setIsCopied(true);
            onCopiedChange?.(true, content);
            setTimeout(() => {
              setIsCopied(false);
              onCopiedChange?.(false);
            }, delay);
          })
          .catch((error) => {
            console.error("Error copying command", error);
          });
      }
    },
    [onClick, copied, content, setIsCopied, onCopiedChange, delay]
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <ButtonPrimitive
      data-slot="copy-button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleCopy}
      {...props}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={isCopied ? "check" : "copy"}
          data-slot="copy-button-icon"
          initial={{ scale: 0, opacity: 0.4, filter: "blur(4px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          exit={{ scale: 0, opacity: 0.4, filter: "blur(4px)" }}
          transition={{ duration: 0.25 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </ButtonPrimitive>
  );
}

export { CopyButton, buttonVariants, type CopyButtonProps };
