/**
 * @file Tests for Glass Button Group component. Covers glass-specific props:
 *   hover effects, glass customization, and styling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ButtonGroup } from "@/components/ui/glass/button-group";
import { Button } from "@/components/ui/button";
import { hasHoverEffect, hasCustomGlassStyles } from "./test-utils";

describe("GlassButtonGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it("applies glass base classes", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>First</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group?.className).toContain("bg-glass-bg/80");
      expect(group?.className).toContain("backdrop-blur-md");
      expect(group?.className).toContain("border-2");
      expect(group?.className).toContain("border-white/30");
      expect(group?.className).toContain("shadow-md");
      expect(group?.className).toContain("shadow-black/20");
    });

    it("applies relative and overflow classes", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>First</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group?.className).toContain("relative");
      expect(group?.className).toContain("overflow-hidden");
    });

    it("merges custom className", () => {
      const { container } = render(
        <ButtonGroup className="custom-group">
          <Button>First</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group).toHaveClass("custom-group");
    });
  });

  describe("Effect Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>Default</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasHoverEffect(group, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(
        <ButtonGroup effect="glow">
          <Button>Glow</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for actual glow classes
      expect(group?.className).toContain("shadow-md");
      expect(group?.className).toContain("box-shadow");
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(
        <ButtonGroup effect="shimmer">
          <Button>Shimmer</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for actual shimmer classes
      expect(group?.className).toContain("before:bg-gradient-to-r");
      expect(group?.className).toContain("before:via-white/60");
    });

    it("applies ripple hover effect", () => {
      const { container } = render(
        <ButtonGroup effect="ripple">
          <Button>Ripple</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for actual ripple classes
      expect(group?.className).toContain("after:bg-white/50");
      expect(group?.className).toContain("after:rounded-full");
    });

    it("applies lift hover effect", () => {
      const { container } = render(
        <ButtonGroup effect="lift">
          <Button>Lift</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for actual lift classes
      expect(group?.className).toContain("hover:-translate-y-1.5");
      expect(group?.className).toContain("hover:shadow-xl");
    });

    it("applies scale hover effect", () => {
      const { container } = render(
        <ButtonGroup effect="scale">
          <Button>Scale</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for actual scale classes
      expect(group?.className).toContain("hover:scale-110");
      expect(group?.className).toContain("active:scale-95");
    });
  });

  describe("Glass Customization", () => {
    it("applies custom color", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
        >
          <Button>Custom</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(group)).toBe(true);
      expect(group.style.backgroundColor).toContain("rgba(59, 130, 246");
    });

    it("applies custom blur", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            blur: 25,
          }}
        >
          <Button>Blur</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(group)).toBe(true);
      expect(group.style.backdropFilter).toContain("blur(25px)");
    });

    it("applies custom outline", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            outline: "rgba(59, 130, 246, 0.4)",
          }}
        >
          <Button>Outline</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(group)).toBe(true);
      expect(group.style.borderColor).toBe("rgba(59, 130, 246, 0.4)");
    });

    it("applies custom shadow", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            shadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Button>Shadow</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for boxShadow directly
      expect(group.style.boxShadow).toContain("0 4px 16px rgba(0, 0, 0, 0.2)");
    });

    it("applies custom innerGlow", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            innerGlow: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <Button>Inner Glow</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Check for boxShadow directly
      expect(group.style.boxShadow).toContain("inset");
      expect(group.style.boxShadow).toContain("rgba(255, 255, 255, 0.2)");
    });

    it("applies transparency", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            color: "rgba(59, 130, 246, 0.5)",
            transparency: 0.3,
          }}
        >
          <Button>Transparency</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(group)).toBe(true);
      expect(group.style.backgroundColor).toContain("rgba(59, 130, 246, 0.3)");
    });

    it("applies multiple glass customization options", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
            blur: 25,
            outline: "rgba(59, 130, 246, 0.4)",
            shadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            innerGlow: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <Button>Multiple</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(group)).toBe(true);
      expect(group.style.backgroundColor).toContain("rgba(59, 130, 246");
      expect(group.style.backdropFilter).toContain("blur(25px)");
      expect(group.style.borderColor).toBe("rgba(59, 130, 246, 0.4)");
      expect(group.style.boxShadow).toContain("0 4px 16px");
      expect(group.style.boxShadow).toContain("inset");
    });
  });

  describe("Style Prop Merging", () => {
    it("merges custom style with glass styles", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
          style={{ padding: "10px" }}
        >
          <Button>Merged</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group.style.padding).toBe("10px");
      expect(group.style.backgroundColor).toContain("rgba(59, 130, 246");
    });

    it("custom style overrides glass styles when conflicting", () => {
      const { container } = render(
        <ButtonGroup
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
          style={{ backgroundColor: "rgba(255, 0, 0, 0.5)" }}
        >
          <Button>Override</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      // Custom style should override glass style
      expect(group.style.backgroundColor).toBe("rgba(255, 0, 0, 0.5)");
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>Styled</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group?.className).toContain("bg-glass-bg/80");
      expect(group?.className).toContain("backdrop-blur-md");
      expect(group?.className).toContain("border-2");
      expect(group?.className).toContain("border-white/30");
    });

    it("applies transition classes from hover effects", () => {
      const { container } = render(
        <ButtonGroup effect="glow">
          <Button>Transition</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group?.className).toContain("transition-all");
      expect(group?.className).toContain("duration-300");
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(
        <ButtonGroup ref={ref}>
          <Button>Ref</Button>
        </ButtonGroup>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("works with base ButtonGroup props", () => {
      const { container } = render(
        <ButtonGroup orientation="vertical" effect="glow">
          <Button>First</Button>
          <Button>Second</Button>
        </ButtonGroup>
      );
      const group = container.querySelector(
        '[data-slot="button-group"]'
      ) as HTMLElement;
      expect(group).toHaveAttribute("data-orientation", "vertical");
      // Check for actual glow classes
      expect(group?.className).toContain("box-shadow");
    });

    it("works with Button components", () => {
      render(
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
        </ButtonGroup>
      );
      expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Second" })
      ).toBeInTheDocument();
    });

    it("handles data attributes", () => {
      const { container } = render(
        <ButtonGroup data-testid="test-group" data-custom="value">
          <Button>Data</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("data-testid", "test-group");
      expect(group).toHaveAttribute("data-custom", "value");
    });
  });
});
