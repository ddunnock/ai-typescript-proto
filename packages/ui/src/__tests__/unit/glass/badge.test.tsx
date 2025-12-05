/**
 * @file Tests for Glass Badge component. Covers glass-specific props: glow,
 *   hover, and styling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/glass/badge";
import { hasHoverEffect } from "./test-utils";

describe("GlassBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders badge with text", () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("renders badge with multiple children", () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Label</span>
        </Badge>
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Label")).toBeInTheDocument();
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(<Badge>No Glow</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).not.toContain("shadow-lg");
      expect(badge?.className).not.toContain("shadow-purple-500/30");
    });

    it("applies glow classes when glow=true", () => {
      const { container } = render(<Badge glow>Glowing</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain("shadow-lg");
      expect(badge?.className).toContain("shadow-purple-500/30");
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(<Badge glow={false}>No Glow</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).not.toContain("shadow-purple-500/30");
    });
  });

  describe("Hover Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(<Badge>Default Hover</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(<Badge hover="glow">Glow Hover</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "glow")).toBe(true);
    });

    it("applies lift hover effect", () => {
      const { container } = render(<Badge hover="lift">Lift Hover</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "lift")).toBe(true);
    });

    it("applies scale hover effect", () => {
      const { container } = render(<Badge hover="scale">Scale Hover</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "scale")).toBe(true);
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(<Badge hover="shimmer">Shimmer</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "shimmer")).toBe(true);
    });

    it("applies ripple hover effect", () => {
      const { container } = render(<Badge hover="ripple">Ripple</Badge>);
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(hasHoverEffect(badge, "ripple")).toBe(true);
    });
  });

  describe("Combined Props", () => {
    it("applies both glow and hover effect", () => {
      const { container } = render(
        <Badge glow hover="lift">
          Combined
        </Badge>
      );
      const badge = container.querySelector(
        '[data-slot="badge"]'
      ) as HTMLElement;
      expect(badge?.className).toContain("shadow-purple-500/30");
      expect(hasHoverEffect(badge, "lift")).toBe(true);
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(<Badge>Styled</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain("border-glass-border");
      expect(badge?.className).toContain("bg-glass-bg");
      expect(badge?.className).toContain("backdrop-blur-sm");
    });

    it("applies relative positioning", () => {
      const { container } = render(<Badge>Relative</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain("relative");
    });

    it("applies overflow-hidden for effects", () => {
      const { container } = render(<Badge>Overflow</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain("overflow-hidden");
    });

    it("applies transition classes", () => {
      const { container } = render(<Badge>Transition</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge?.className).toContain("transition-all");
      // Base badge variant may override duration, so just check for transition-all
      expect(badge?.className).toMatch(/duration-\d+/);
    });

    it("merges custom className", () => {
      const { container } = render(
        <Badge className="custom-badge">Custom</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("custom-badge");
    });
  });

  describe("Re-exports", () => {
    it("exports Badge component", () => {
      expect(Badge).toBeDefined();
    });
  });

  describe("Integration", () => {
    it("works with base Badge variant prop", () => {
      const { container } = render(
        <Badge variant="destructive">Destructive</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("works with base Badge asChild prop", () => {
      render(
        <Badge asChild>
          <a href="/test">Link Badge</a>
        </Badge>
      );
      const link = screen.getByText("Link Badge");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
    });

    it("handles data attributes", () => {
      const { container } = render(
        <Badge data-testid="test-badge" data-custom="value">
          Data Attrs
        </Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveAttribute("data-testid", "test-badge");
      expect(badge).toHaveAttribute("data-custom", "value");
    });
  });
});
