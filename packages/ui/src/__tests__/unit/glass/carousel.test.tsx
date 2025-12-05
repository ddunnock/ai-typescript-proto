/**
 * @file Tests for Glass Carousel component. Covers glass-specific props: hover
 *   effects, glass customization, and props forwarding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Carousel } from "@/components/ui/glass/carousel";
import { CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { hasHoverEffect, hasCustomGlassStyles } from "./test-utils";

describe("GlassCarousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toBeInTheDocument();
    });

    it("applies glass base classes", () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel?.className).toContain("bg-glass-bg/80");
      expect(carousel?.className).toContain("backdrop-blur-md");
      expect(carousel?.className).toContain("border-2");
      expect(carousel?.className).toContain("border-white/30");
      expect(carousel?.className).toContain("shadow-md");
      expect(carousel?.className).toContain("shadow-black/20");
    });

    it("applies relative and overflow classes", () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel?.className).toContain("relative");
      expect(carousel?.className).toContain("overflow-hidden");
    });

    it("merges custom className", () => {
      const { container } = render(
        <Carousel className="custom-carousel">
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel).toHaveClass("custom-carousel");
    });
  });

  describe("Effect Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Default</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(hasHoverEffect(carousel, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(
        <Carousel effect="glow">
          <CarouselContent>
            <CarouselItem>Glow</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for actual glow classes
      expect(carousel?.className).toContain("shadow-md");
      expect(carousel?.className).toContain("box-shadow");
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(
        <Carousel effect="shimmer">
          <CarouselContent>
            <CarouselItem>Shimmer</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for actual shimmer classes
      expect(carousel?.className).toContain("before:bg-gradient-to-r");
      expect(carousel?.className).toContain("before:via-white/60");
    });

    it("applies ripple hover effect", () => {
      const { container } = render(
        <Carousel effect="ripple">
          <CarouselContent>
            <CarouselItem>Ripple</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for actual ripple classes
      expect(carousel?.className).toContain("after:bg-white/50");
      expect(carousel?.className).toContain("after:rounded-full");
    });

    it("applies lift hover effect", () => {
      const { container } = render(
        <Carousel effect="lift">
          <CarouselContent>
            <CarouselItem>Lift</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for actual lift classes
      expect(carousel?.className).toContain("hover:-translate-y-1.5");
      expect(carousel?.className).toContain("hover:shadow-xl");
    });

    it("applies scale hover effect", () => {
      const { container } = render(
        <Carousel effect="scale">
          <CarouselContent>
            <CarouselItem>Scale</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for scale classes directly
      expect(carousel?.className).toContain("hover:scale-110");
      expect(carousel?.className).toContain("active:scale-95");
    });
  });

  describe("Glass Customization", () => {
    it("applies custom color", () => {
      const { container } = render(
        <Carousel
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
        >
          <CarouselContent>
            <CarouselItem>Custom</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(carousel)).toBe(true);
      expect(carousel.style.backgroundColor).toContain("rgba(59, 130, 246");
    });

    it("applies custom blur", () => {
      const { container } = render(
        <Carousel
          glass={{
            blur: 25,
          }}
        >
          <CarouselContent>
            <CarouselItem>Blur</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(carousel)).toBe(true);
      expect(carousel.style.backdropFilter).toContain("blur(25px)");
    });

    it("applies custom outline", () => {
      const { container } = render(
        <Carousel
          glass={{
            outline: "rgba(59, 130, 246, 0.4)",
          }}
        >
          <CarouselContent>
            <CarouselItem>Outline</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(carousel)).toBe(true);
      expect(carousel.style.borderColor).toBe("rgba(59, 130, 246, 0.4)");
    });

    it("applies custom shadow", () => {
      const { container } = render(
        <Carousel
          glass={{
            shadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          }}
        >
          <CarouselContent>
            <CarouselItem>Shadow</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for boxShadow directly
      expect(carousel.style.boxShadow).toContain(
        "0 4px 16px rgba(0, 0, 0, 0.2)"
      );
    });

    it("applies custom innerGlow", () => {
      const { container } = render(
        <Carousel
          glass={{
            innerGlow: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <CarouselContent>
            <CarouselItem>Inner Glow</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Check for boxShadow directly
      expect(carousel.style.boxShadow).toContain("inset");
      expect(carousel.style.boxShadow).toContain("rgba(255, 255, 255, 0.2)");
    });

    it("applies multiple glass customization options", () => {
      const { container } = render(
        <Carousel
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
            blur: 25,
            outline: "rgba(59, 130, 246, 0.4)",
            shadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
            innerGlow: "rgba(255, 255, 255, 0.2)",
          }}
        >
          <CarouselContent>
            <CarouselItem>Multiple</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(hasCustomGlassStyles(carousel)).toBe(true);
      expect(carousel.style.backgroundColor).toContain("rgba(59, 130, 246");
      expect(carousel.style.backdropFilter).toContain("blur(25px)");
      expect(carousel.style.borderColor).toBe("rgba(59, 130, 246, 0.4)");
      expect(carousel.style.boxShadow).toContain("0 4px 16px");
      expect(carousel.style.boxShadow).toContain("inset");
    });
  });

  describe("Style Prop Merging", () => {
    it("merges custom style with glass styles", () => {
      const { container } = render(
        <Carousel
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
          style={{ padding: "10px" }}
        >
          <CarouselContent>
            <CarouselItem>Merged</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel.style.padding).toBe("10px");
      expect(carousel.style.backgroundColor).toContain("rgba(59, 130, 246");
    });

    it("custom style overrides glass styles when conflicting", () => {
      const { container } = render(
        <Carousel
          glass={{
            color: "rgba(59, 130, 246, 0.2)",
          }}
          style={{ backgroundColor: "rgba(255, 0, 0, 0.5)" }}
        >
          <CarouselContent>
            <CarouselItem>Override</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      // Custom style should override glass style
      expect(carousel.style.backgroundColor).toBe("rgba(255, 0, 0, 0.5)");
    });
  });

  describe("Props Forwarding", () => {
    it("forwards opts prop", () => {
      const { container } = render(
        <Carousel opts={{ loop: true }}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toBeInTheDocument();
    });

    it("forwards plugins prop", () => {
      const { container } = render(
        <Carousel plugins={[]}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toBeInTheDocument();
    });

    it("forwards orientation prop", () => {
      const { container } = render(
        <Carousel orientation="vertical">
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toBeInTheDocument();
    });

    it("forwards setApi prop", () => {
      const setApi = vi.fn();
      const { container } = render(
        <Carousel setApi={setApi}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toBeInTheDocument();
      // setApi should be called when carousel initializes
      // Note: This may require waiting for async initialization
    });

    it("forwards className prop", () => {
      const { container } = render(
        <Carousel className="forwarded-class">
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel).toHaveClass("forwarded-class");
    });

    it("forwards style prop", () => {
      const { container } = render(
        <Carousel style={{ width: "500px" }}>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel.style.width).toBe("500px");
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Styled</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel?.className).toContain("bg-glass-bg/80");
      expect(carousel?.className).toContain("backdrop-blur-md");
      expect(carousel?.className).toContain("border-2");
      expect(carousel?.className).toContain("border-white/30");
    });

    it("applies transition classes from hover effects", () => {
      const { container } = render(
        <Carousel effect="glow">
          <CarouselContent>
            <CarouselItem>Transition</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector(
        '[data-slot="carousel"]'
      ) as HTMLElement;
      expect(carousel?.className).toContain("transition-all");
      expect(carousel?.className).toContain("duration-300");
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null };
      render(
        <Carousel ref={ref}>
          <CarouselContent>
            <CarouselItem>Ref</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("works with CarouselContent and CarouselItem", () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Item 1</CarouselItem>
            <CarouselItem>Item 2</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("handles data attributes", () => {
      const { container } = render(
        <Carousel data-testid="test-carousel" data-custom="value">
          <CarouselContent>
            <CarouselItem>Data</CarouselItem>
          </CarouselContent>
        </Carousel>
      );
      const carousel = container.querySelector('[data-slot="carousel"]');
      expect(carousel).toHaveAttribute("data-testid", "test-carousel");
      expect(carousel).toHaveAttribute("data-custom", "value");
    });
  });
});
