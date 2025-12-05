/**
 * @file Tests for Glass Card component. Covers glass-specific props: gradient,
 *   animated, hover, and full composition with sub-components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/glass/card";
import { hasHoverEffect } from "./test-utils";

describe("GlassCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders card with content", () => {
      render(<Card>Content</Card>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("renders card with CardHeader", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("renders card with CardContent", () => {
      render(
        <Card>
          <CardContent>Body Content</CardContent>
        </Card>
      );
      expect(screen.getByText("Body Content")).toBeInTheDocument();
    });

    it("renders card with CardFooter", () => {
      render(
        <Card>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      );
      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("renders full card composition", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Body</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );
      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Card Body")).toBeInTheDocument();
      expect(screen.getByText("Card Footer")).toBeInTheDocument();
    });
  });

  describe("Gradient Prop", () => {
    it("does not apply gradient by default", () => {
      const { container } = render(<Card>No Gradient</Card>);
      const card = container.querySelector("div");
      expect(card?.className).not.toContain("bg-gradient-to-br");
      expect(card?.className).not.toContain("from-purple-500/10");
    });

    it("applies gradient classes when gradient=true", () => {
      const { container } = render(<Card gradient>With Gradient</Card>);
      const card = container.querySelector("div");
      expect(card?.className).toContain("bg-gradient-to-br");
      expect(card?.className).toContain("from-purple-500/10");
      expect(card?.className).toContain("via-blue-500/10");
      expect(card?.className).toContain("to-pink-500/10");
    });

    it("does not apply gradient when gradient=false", () => {
      const { container } = render(<Card gradient={false}>No Gradient</Card>);
      const card = container.querySelector("div");
      expect(card?.className).not.toContain("bg-gradient-to-br");
    });
  });

  describe("Animated Prop", () => {
    it("does not apply animation by default", () => {
      const { container } = render(<Card>No Animation</Card>);
      const card = container.querySelector("div");
      expect(card?.className).not.toContain("hover:scale-[1.02]");
      expect(card?.className).not.toContain(
        "hover:shadow-[var(--glass-shadow-lg)]"
      );
    });

    it("applies animation classes when animated=true", () => {
      const { container } = render(<Card animated>Animated</Card>);
      const card = container.querySelector("div");
      expect(card?.className).toContain("transition-all");
      expect(card?.className).toContain("duration-300");
      expect(card?.className).toContain("hover:scale-[1.02]");
      expect(card?.className).toContain(
        "hover:shadow-[var(--glass-shadow-lg)]"
      );
    });

    it("does not apply animation when animated=false", () => {
      const { container } = render(<Card animated={false}>No Animation</Card>);
      const card = container.querySelector("div");
      expect(card?.className).not.toContain("hover:scale-[1.02]");
    });
  });

  describe("Hover Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(<Card>Default Hover</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(<Card hover="glow">Glow Hover</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "glow")).toBe(true);
    });

    it("applies lift hover effect", () => {
      const { container } = render(<Card hover="lift">Lift Hover</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "lift")).toBe(true);
    });

    it("applies scale hover effect", () => {
      const { container } = render(<Card hover="scale">Scale Hover</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "scale")).toBe(true);
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(<Card hover="shimmer">Shimmer</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "shimmer")).toBe(true);
    });

    it("applies ripple hover effect", () => {
      const { container } = render(<Card hover="ripple">Ripple</Card>);
      const card = container.querySelector("div");
      expect(hasHoverEffect(card as HTMLElement, "ripple")).toBe(true);
    });
  });

  describe("Combined Props", () => {
    it("applies gradient and animated together", () => {
      const { container } = render(
        <Card gradient animated>
          Combined
        </Card>
      );
      const card = container.querySelector("div");
      expect(card?.className).toContain("bg-gradient-to-br");
      expect(card?.className).toContain("hover:scale-[1.02]");
    });

    it("applies gradient, animated, and hover together", () => {
      const { container } = render(
        <Card gradient animated hover="lift">
          All Props
        </Card>
      );
      const card = container.querySelector("div");
      expect(card?.className).toContain("bg-gradient-to-br");
      expect(card?.className).toContain("hover:scale-[1.02]");
      expect(hasHoverEffect(card as HTMLElement, "lift")).toBe(true);
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(<Card>Styled</Card>);
      const card = container.querySelector("div");
      expect(card?.className).toContain("border-glass-border");
      expect(card?.className).toContain("bg-glass-bg");
      expect(card?.className).toContain("backdrop-blur-md");
      expect(card?.className).toContain("shadow-[var(--glass-shadow)]");
    });

    it("applies relative positioning", () => {
      const { container } = render(<Card>Relative</Card>);
      const card = container.querySelector("div");
      expect(card?.className).toContain("relative");
    });

    it("applies overflow-hidden for effects", () => {
      const { container } = render(<Card>Overflow</Card>);
      const card = container.querySelector("div");
      expect(card?.className).toContain("overflow-hidden");
    });

    it("merges custom className", () => {
      const { container } = render(<Card className="custom-card">Custom</Card>);
      const card = container.querySelector("div");
      expect(card).toHaveClass("custom-card");
    });
  });

  describe("Re-exports", () => {
    it("exports Card component", () => {
      expect(Card).toBeDefined();
    });

    it("exports CardHeader component", () => {
      expect(CardHeader).toBeDefined();
    });

    it("exports CardTitle component", () => {
      expect(CardTitle).toBeDefined();
    });

    it("exports CardDescription component", () => {
      expect(CardDescription).toBeDefined();
    });

    it("exports CardContent component", () => {
      expect(CardContent).toBeDefined();
    });

    it("exports CardFooter component", () => {
      expect(CardFooter).toBeDefined();
    });

    it("renders full card composition with all sub-components", () => {
      render(
        <Card gradient animated hover="glow">
          <CardHeader>
            <CardTitle>Full Card</CardTitle>
            <CardDescription>Complete composition</CardDescription>
          </CardHeader>
          <CardContent>Main content area</CardContent>
          <CardFooter>Action area</CardFooter>
        </Card>
      );
      expect(screen.getByText("Full Card")).toBeInTheDocument();
      expect(screen.getByText("Complete composition")).toBeInTheDocument();
      expect(screen.getByText("Main content area")).toBeInTheDocument();
      expect(screen.getByText("Action area")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(<Card ref={ref}>With Ref</Card>);
      expect(ref.current).toBeInstanceOf(HTMLElement);
    });

    it("works with base Card props", () => {
      const { container } = render(<Card data-testid="card">Props</Card>);
      const card = container.querySelector("div");
      expect(card).toHaveAttribute("data-testid", "card");
    });

    it("handles data attributes", () => {
      const { container } = render(
        <Card data-testid="test-card" data-custom="value">
          Data Attrs
        </Card>
      );
      const card = container.querySelector("div");
      expect(card).toHaveAttribute("data-testid", "test-card");
      expect(card).toHaveAttribute("data-custom", "value");
    });
  });
});
