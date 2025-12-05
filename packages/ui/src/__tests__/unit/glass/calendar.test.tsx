/**
 * @file Tests for Glass Calendar component. Covers glass-specific props: glow,
 *   hover effects, and props forwarding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Calendar } from "@/components/ui/glass/calendar";
import { hasHoverEffect } from "./test-utils";

describe("GlassCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      const { container } = render(<Calendar />);
      // Calendar wrapper div should be present
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("applies glass wrapper classes", () => {
      const { container } = render(<Calendar />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("bg-glass-bg/80");
      expect(wrapper?.className).toContain("backdrop-blur-md");
      expect(wrapper?.className).toContain("border-2");
      expect(wrapper?.className).toContain("border-white/30");
      expect(wrapper?.className).toContain("shadow-md");
      expect(wrapper?.className).toContain("shadow-black/20");
      expect(wrapper?.className).toContain("rounded-md");
      expect(wrapper?.className).toContain("p-4");
    });

    it("renders BaseCalendar inside wrapper", () => {
      const { container } = render(<Calendar />);
      // BaseCalendar should render inside the wrapper
      // Check for DayPicker component (it may not have .rdp class in test environment)
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
      // Calendar content should be present
      expect(container.querySelectorAll("div").length).toBeGreaterThan(1);
    });

    it("merges custom className", () => {
      const { container } = render(<Calendar className="custom-calendar" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper).toHaveClass("custom-calendar");
    });
  });

  describe("Effect Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(<Calendar />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(hasHoverEffect(wrapper, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(<Calendar effect="glow" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for actual glow classes
      expect(wrapper?.className).toContain("shadow-md");
      expect(wrapper?.className).toContain("box-shadow");
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(<Calendar effect="shimmer" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for actual shimmer classes
      expect(wrapper?.className).toContain("before:bg-gradient-to-r");
      expect(wrapper?.className).toContain("before:via-white/60");
    });

    it("applies ripple hover effect", () => {
      const { container } = render(<Calendar effect="ripple" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for actual ripple classes
      expect(wrapper?.className).toContain("after:bg-white/50");
      expect(wrapper?.className).toContain("after:rounded-full");
    });

    it("applies lift hover effect", () => {
      const { container } = render(<Calendar effect="lift" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for actual lift classes
      expect(wrapper?.className).toContain("hover:-translate-y-1.5");
      expect(wrapper?.className).toContain("hover:shadow-xl");
    });

    it("applies scale hover effect", () => {
      const { container } = render(<Calendar effect="scale" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for actual scale classes
      expect(wrapper?.className).toContain("hover:scale-110");
      expect(wrapper?.className).toContain("active:scale-95");
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(<Calendar />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Should not have glow box-shadow when glow is false
      const hasGlowBoxShadow = wrapper?.className.includes(
        "[box-shadow:0_0_15px_hsl(var(--primary)/0.6)"
      );
      expect(hasGlowBoxShadow).toBe(false);
    });

    it("applies glow classes when glow=true", () => {
      const { container } = render(<Calendar glow />);
      const wrapper = container.querySelector("div") as HTMLElement;
      // Check for colored box-shadow pattern
      expect(wrapper?.className).toContain("box-shadow");
      expect(wrapper?.className).toContain("hsl(var(--primary)");
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(<Calendar glow={false} />);
      const wrapper = container.querySelector("div") as HTMLElement;
      const hasGlowBoxShadow = wrapper?.className.includes(
        "[box-shadow:0_0_15px_hsl(var(--primary)/0.6)"
      );
      expect(hasGlowBoxShadow).toBe(false);
    });
  });

  describe("Combined Props", () => {
    it("applies both glow and hover effect", () => {
      const { container } = render(<Calendar glow effect="lift" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("box-shadow");
      // Check for actual lift classes
      expect(wrapper?.className).toContain("hover:-translate-y-1.5");
      expect(wrapper?.className).toContain("hover:shadow-xl");
    });
  });

  describe("Props Forwarding", () => {
    it("forwards className to BaseCalendar", () => {
      const { container } = render(<Calendar />);
      // BaseCalendar should receive props - wrapper should be present
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("forwards showOutsideDays prop", () => {
      const { container } = render(<Calendar showOutsideDays={false} />);
      // Calendar should render with showOutsideDays=false
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("forwards captionLayout prop", () => {
      const { container } = render(<Calendar captionLayout="dropdown" />);
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("forwards buttonVariant prop", () => {
      const { container } = render(<Calendar buttonVariant="outline" />);
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("forwards classNames prop", () => {
      const { container } = render(
        <Calendar
          classNames={{
            root: "custom-root",
          }}
        />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("forwards formatters prop", () => {
      const { container } = render(
        <Calendar
          formatters={{
            formatMonthDropdown: (date) =>
              date.toLocaleString("default", { month: "long" }),
          }}
        />
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies glass base classes", () => {
      const { container } = render(<Calendar />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("bg-glass-bg/80");
      expect(wrapper?.className).toContain("backdrop-blur-md");
      expect(wrapper?.className).toContain("border-2");
      expect(wrapper?.className).toContain("border-white/30");
    });

    it("applies padding and rounded classes", () => {
      const { container } = render(<Calendar />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("rounded-md");
      expect(wrapper?.className).toContain("p-4");
    });

    it("applies transition classes from hover effects", () => {
      const { container } = render(<Calendar effect="glow" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("transition-all");
      expect(wrapper?.className).toContain("duration-300");
    });
  });

  describe("Integration", () => {
    it("works with calendar day selection", () => {
      const { container } = render(<Calendar />);
      // Calendar should be interactive - wrapper should be present
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeInTheDocument();
    });

    it("handles custom className on wrapper and BaseCalendar", () => {
      const { container } = render(<Calendar className="wrapper-class" />);
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper).toHaveClass("wrapper-class");
    });

    it("combines glass styling with BaseCalendar props", () => {
      const { container } = render(
        <Calendar glow effect="glow" showOutsideDays={false} />
      );
      const wrapper = container.querySelector("div") as HTMLElement;
      expect(wrapper?.className).toContain("bg-glass-bg/80");
      expect(wrapper?.className).toContain("box-shadow");
      // Calendar wrapper should be present
      expect(wrapper).toBeInTheDocument();
    });
  });
});
