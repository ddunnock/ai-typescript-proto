import { cva } from "class-variance-authority";

/**
 * Shared hover effect variants for all Glass UI components
 *
 * Effects:
 *
 * - None: No hover effect
 * - Glow: Purple glow shadow that intensifies on hover
 * - Shimmer: Moving shimmer effect across the component
 * - Ripple: Ripple effect that scales outward on hover
 * - Lift: Subtle lift effect with shadow increase
 * - Scale: Scale up slightly on hover
 */
export const hoverEffects = cva("transition-all duration-300", {
  variants: {
    hover: {
      none: "",
      glow: "shadow-md shadow-black/20 [box-shadow:0_0_15px_hsl(var(--primary)/0.6),0_0_30px_hsl(var(--primary)/0.4),0_4px_16px_rgba(0,0,0,0.1)] hover:[box-shadow:0_0_20px_hsl(var(--primary)/0.8),0_0_40px_hsl(var(--primary)/0.6),0_8px_32px_rgba(0,0,0,0.15)] hover:ring-2 hover:ring-primary/40 hover:brightness-110",
      shimmer:
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:z-10 before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:blur-[2px] hover:before:translate-x-full before:transition-transform before:duration-1000 before:ease-in-out",
      ripple:
        "relative overflow-hidden after:absolute after:inset-0 after:z-10 after:scale-0 after:rounded-full after:bg-white/50 after:blur-lg after:transition-all after:duration-700 after:ease-out hover:after:scale-[250%] hover:after:opacity-0",
      lift: "hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/20",
      scale: "hover:scale-110 active:scale-95",
    },
  },
  defaultVariants: {
    hover: "none",
  },
});

export type HoverEffect =
  | "none"
  | "glow"
  | "shimmer"
  | "ripple"
  | "lift"
  | "scale";
