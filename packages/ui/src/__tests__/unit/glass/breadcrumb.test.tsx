/**
 * @file Tests for Glass Breadcrumb component. Covers glass-specific props:
 *   glow, hover effects, and re-exported components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  BreadcrumbList,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/glass/breadcrumb";
import { hasHoverEffect } from "./test-utils";

describe("GlassBreadcrumbList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector('[data-slot="breadcrumb-list"]');
      expect(list).toBeInTheDocument();
    });

    it("applies glass base classes", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("bg-glass-bg/80");
      expect(list?.className).toContain("backdrop-blur-md");
      expect(list?.className).toContain("border-2");
      expect(list?.className).toContain("border-white/30");
      expect(list?.className).toContain("shadow-md");
      expect(list?.className).toContain("shadow-black/20");
    });

    it("merges custom className", () => {
      const { container } = render(
        <BreadcrumbList className="custom-breadcrumb">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list).toHaveClass("custom-breadcrumb");
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">No Glow</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).not.toContain("box-shadow");
    });

    it("applies glow classes when glow=true", () => {
      const { container } = render(
        <BreadcrumbList glow>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Glowing</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for colored box-shadow pattern
      expect(list?.className).toContain("box-shadow");
      expect(list?.className).toContain("hsl(var(--primary)");
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(
        <BreadcrumbList glow={false}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">No Glow</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Should not have glow box-shadow when glow is false
      const hasGlowBoxShadow = list?.className.includes(
        "[box-shadow:0_0_15px_hsl(var(--primary)/0.6)"
      );
      expect(hasGlowBoxShadow).toBe(false);
    });
  });

  describe("Hover Effects", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Default</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(hasHoverEffect(list, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(
        <BreadcrumbList effect="glow">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Glow</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for actual glow classes
      expect(list?.className).toContain("shadow-md");
      expect(list?.className).toContain("box-shadow");
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(
        <BreadcrumbList effect="shimmer">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Shimmer</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for actual shimmer classes
      expect(list?.className).toContain("before:bg-gradient-to-r");
      expect(list?.className).toContain("before:via-white/60");
    });

    it("applies ripple hover effect", () => {
      const { container } = render(
        <BreadcrumbList effect="ripple">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Ripple</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for actual ripple classes
      expect(list?.className).toContain("after:bg-white/50");
      expect(list?.className).toContain("after:rounded-full");
    });

    it("applies lift hover effect", () => {
      const { container } = render(
        <BreadcrumbList effect="lift">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Lift</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for actual lift classes
      expect(list?.className).toContain("hover:-translate-y-1.5");
      expect(list?.className).toContain("hover:shadow-xl");
    });

    it("applies scale hover effect", () => {
      const { container } = render(
        <BreadcrumbList effect="scale">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Scale</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      // Check for actual scale classes
      expect(list?.className).toContain("hover:scale-110");
      expect(list?.className).toContain("active:scale-95");
    });
  });

  describe("Combined Props", () => {
    it("applies both glow and hover effect", () => {
      const { container } = render(
        <BreadcrumbList glow effect="lift">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Combined</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("box-shadow");
      // Check for actual lift classes
      expect(list?.className).toContain("hover:-translate-y-1.5");
      expect(list?.className).toContain("hover:shadow-xl");
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Styled</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("bg-glass-bg/80");
      expect(list?.className).toContain("backdrop-blur-md");
      expect(list?.className).toContain("border-2");
      expect(list?.className).toContain("border-white/30");
    });

    it("applies shadow classes", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Shadow</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("shadow-md");
      expect(list?.className).toContain("shadow-black/20");
    });

    it("applies transition classes from hover effects", () => {
      const { container } = render(
        <BreadcrumbList effect="glow">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Transition</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("transition-all");
      expect(list?.className).toContain("duration-300");
    });
  });

  describe("Re-exports", () => {
    it("exports Breadcrumb component", () => {
      expect(Breadcrumb).toBeDefined();
    });

    it("exports BreadcrumbItem component", () => {
      expect(BreadcrumbItem).toBeDefined();
    });

    it("exports BreadcrumbLink component", () => {
      expect(BreadcrumbLink).toBeDefined();
    });

    it("exports BreadcrumbPage component", () => {
      expect(BreadcrumbPage).toBeDefined();
    });

    it("exports BreadcrumbSeparator component", () => {
      expect(BreadcrumbSeparator).toBeDefined();
    });

    it("exports BreadcrumbEllipsis component", () => {
      expect(BreadcrumbEllipsis).toBeDefined();
    });

    it("renders full breadcrumb composition with re-exports", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(
        container.querySelector('[data-slot="breadcrumb"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="breadcrumb-list"]')
      ).toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Current")).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(
        <BreadcrumbList ref={ref}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Ref</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      expect(ref.current).toBeInstanceOf(HTMLOListElement);
    });

    it("works with base breadcrumb components", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList glow effect="glow">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const list = container.querySelector(
        '[data-slot="breadcrumb-list"]'
      ) as HTMLElement;
      expect(list?.className).toContain("bg-glass-bg/80");
      // Check for actual glow classes
      expect(list?.className).toContain("box-shadow");
    });

    it("handles data attributes", () => {
      const { container } = render(
        <BreadcrumbList data-testid="test-breadcrumb" data-custom="value">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Data</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector('[data-slot="breadcrumb-list"]');
      expect(list).toHaveAttribute("data-testid", "test-breadcrumb");
      expect(list).toHaveAttribute("data-custom", "value");
    });
  });
});
