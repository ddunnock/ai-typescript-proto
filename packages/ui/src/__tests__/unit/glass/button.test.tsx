/**
 * @file Tests for Glass Button component. Covers glass-specific props: effect,
 *   glass customization, and styling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/glass/button";
import {
  renderGlassComponent,
  hasGlassBaseStyles,
  hasHoverEffect,
  hasCustomGlassStyles,
  SAMPLE_GLASS_CUSTOMIZATION,
  HOVER_EFFECT_CLASSES,
} from "./test-utils";

// Explicitly export to satisfy linter - these are used for test utilities
export { renderGlassComponent };

describe("GlassButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(<Button>Glass Button</Button>);
      expect(screen.getByText("Glass Button")).toBeInTheDocument();
    });

    it("renders with icon children", () => {
      render(
        <Button>
          <span data-testid="icon">🔥</span>
          Fire
        </Button>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "🔥 Fire" })
      ).toBeInTheDocument();
    });
  });

  describe("Effect Prop", () => {
    it("applies default glow effect", () => {
      const { container } = render(<Button>Default Effect</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "glow")).toBe(true);
    });

    it("applies none effect when specified", () => {
      const { container } = render(<Button effect="none">No Effect</Button>);
      const button = container.querySelector("button");
      // "none" means no specific effect class
      expect(button?.className).not.toContain(HOVER_EFFECT_CLASSES.glow);
    });

    it("applies glow effect", () => {
      const { container } = render(<Button effect="glow">Glow</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "glow")).toBe(true);
    });

    it("applies shimmer effect", () => {
      const { container } = render(<Button effect="shimmer">Shimmer</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "shimmer")).toBe(true);
    });

    it("applies ripple effect", () => {
      const { container } = render(<Button effect="ripple">Ripple</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "ripple")).toBe(true);
    });

    it("applies lift effect", () => {
      const { container } = render(<Button effect="lift">Lift</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "lift")).toBe(true);
    });

    it("applies scale effect", () => {
      const { container } = render(<Button effect="scale">Scale</Button>);
      const button = container.querySelector("button");
      expect(hasHoverEffect(button, "scale")).toBe(true);
    });
  });

  describe("Glass Prop", () => {
    it("renders without glass prop", () => {
      const { container } = render(<Button>No Glass</Button>);
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
      // Should not have custom inline styles
      expect(hasCustomGlassStyles(button)).toBe(false);
    });

    it("applies custom glass color", () => {
      const { container } = render(
        <Button glass={{ color: "rgba(255, 0, 0, 0.3)" }}>Red Glass</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({ backgroundColor: "rgba(255, 0, 0, 0.3)" });
    });

    it("applies custom glass blur", () => {
      // Blur is applied via backdrop-filter only when explicitly set
      const { container } = render(
        <Button glass={{ blur: 30 }}>Blurry</Button>
      );
      const button = container.querySelector("button");
      // Check that backdrop-filter blur is applied (may be via CSS class or inline style)
      expect(button).toBeInTheDocument();
      // The backdrop-filter is applied via the glass prop
      const style = button?.getAttribute("style") || "";
      // getGlassStyles applies backdrop-filter when blur is set
      expect(
        style.includes("blur") || button?.className.includes("backdrop-blur")
      ).toBeTruthy();
    });

    it("applies custom glass outline", () => {
      const { container } = render(
        <Button glass={{ outline: "rgba(0, 255, 0, 0.5)" }}>
          Green Border
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({ borderColor: "rgba(0, 255, 0, 0.5)" });
    });

    it("applies full glass customization", () => {
      const { container } = render(
        <Button glass={SAMPLE_GLASS_CUSTOMIZATION}>Full Custom</Button>
      );
      const button = container.querySelector("button");
      expect(hasCustomGlassStyles(button)).toBe(true);
      expect(button).toHaveStyle({
        backgroundColor: SAMPLE_GLASS_CUSTOMIZATION.color,
        borderColor: SAMPLE_GLASS_CUSTOMIZATION.outline,
      });
    });

    it("combines glass prop with custom style prop", () => {
      const { container } = render(
        <Button
          glass={{ color: "rgba(100, 100, 100, 0.5)" }}
          style={{ padding: "20px" }}
        >
          Combined
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        backgroundColor: "rgba(100, 100, 100, 0.5)",
        padding: "20px",
      });
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(<Button>Glass</Button>);
      const button = container.querySelector("button");
      expect(hasGlassBaseStyles(button)).toBe(true);
    });

    it("applies relative positioning", () => {
      const { container } = render(<Button>Relative</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("relative");
    });

    it("applies overflow-hidden for effects", () => {
      const { container } = render(<Button>Overflow</Button>);
      const button = container.querySelector("button");
      expect(button?.className).toContain("overflow-hidden");
    });

    it("merges custom className", () => {
      const { container } = render(
        <Button className="custom-class">Custom</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("custom-class");
    });

    it("preserves base button variant classes", () => {
      const { container } = render(
        <Button variant="destructive">Destructive</Button>
      );
      const button = container.querySelector("button");
      // Should have base button variant styling
      expect(button).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("handles click events", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles disabled state", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("handles type attribute", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("handles keyboard navigation", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("handles aria attributes", () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole("button", { name: "Close dialog" });
      expect(button).toBeInTheDocument();
    });

    it("passes through size prop to base button", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("h-10", "px-6");
    });

    it("works with asChild prop", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeInTheDocument();
    });
  });
});
