/**
 * @file Tests for Glass Alert component. Covers glass-specific props: glow,
 *   hover, and re-exported sub-components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/glass/alert";
import {
  hasHoverEffect,
  GLOW_CLASSES,
  HOVER_EFFECT_CLASSES,
} from "./test-utils";

// Explicitly export to satisfy linter - these are used for test utilities
export { HOVER_EFFECT_CLASSES };

describe("GlassAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders alert with content", () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("renders with role alert", () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      render(
        <Alert>
          <div data-testid="custom">Custom Content</div>
        </Alert>
      );
      expect(screen.getByTestId("custom")).toBeInTheDocument();
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(<Alert>No Glow</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).not.toContain(GLOW_CLASSES.alert);
    });

    it("applies glow class when glow=true", () => {
      const { container } = render(<Alert glow>Glowing</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).toContain("shadow-lg");
      expect(alert?.className).toContain("shadow-purple-500/20");
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(<Alert glow={false}>No Glow</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).not.toContain("shadow-purple-500/20");
    });
  });

  describe("Hover Prop", () => {
    it("applies no hover effect by default", () => {
      const { container } = render(<Alert>Default Hover</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "none")).toBe(true);
    });

    it("applies glow hover effect", () => {
      const { container } = render(<Alert hover="glow">Glow Hover</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "glow")).toBe(true);
    });

    it("applies lift hover effect", () => {
      const { container } = render(<Alert hover="lift">Lift Hover</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "lift")).toBe(true);
    });

    it("applies scale hover effect", () => {
      const { container } = render(<Alert hover="scale">Scale Hover</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "scale")).toBe(true);
    });

    it("applies shimmer hover effect", () => {
      const { container } = render(<Alert hover="shimmer">Shimmer</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "shimmer")).toBe(true);
    });

    it("applies ripple hover effect", () => {
      const { container } = render(<Alert hover="ripple">Ripple</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(hasHoverEffect(alert as HTMLElement, "ripple")).toBe(true);
    });
  });

  describe("Combined Props", () => {
    it("applies both glow and hover effect", () => {
      const { container } = render(
        <Alert glow hover="lift">
          Combined
        </Alert>
      );
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).toContain("shadow-purple-500/20");
      expect(hasHoverEffect(alert as HTMLElement, "lift")).toBe(true);
    });
  });

  describe("Styling", () => {
    it("applies relative positioning", () => {
      const { container } = render(<Alert>Relative</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).toContain("relative");
    });

    it("applies overflow-hidden for effects", () => {
      const { container } = render(<Alert>Overflow</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).toContain("overflow-hidden");
    });

    it("applies transition classes", () => {
      const { container } = render(<Alert>Transition</Alert>);
      const alert = container.querySelector("[role='alert']");
      expect(alert?.className).toContain("transition-all");
      expect(alert?.className).toContain("duration-300");
    });

    it("merges custom className", () => {
      const { container } = render(
        <Alert className="custom-alert">Custom</Alert>
      );
      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveClass("custom-alert");
    });
  });

  describe("Re-exports", () => {
    it("exports Alert component", () => {
      expect(Alert).toBeDefined();
    });

    it("exports AlertTitle component", () => {
      expect(AlertTitle).toBeDefined();
    });

    it("exports AlertDescription component", () => {
      expect(AlertDescription).toBeDefined();
    });

    it("renders full alert composition", () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            This is an important message for you.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Important Notice")).toBeInTheDocument();
      expect(
        screen.getByText("This is an important message for you.")
      ).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("handles variant prop from base", () => {
      const { container } = render(
        <Alert variant="destructive">Destructive</Alert>
      );
      const alert = container.querySelector("[role='alert']");
      expect(alert).toBeInTheDocument();
    });

    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(<Alert ref={ref}>With Ref</Alert>);
      expect(ref).toHaveBeenCalled();
    });

    it("handles data attributes", () => {
      const { container } = render(
        <Alert data-testid="test-alert" data-custom="value">
          Data Attrs
        </Alert>
      );
      const alert = container.querySelector("[role='alert']");
      expect(alert).toHaveAttribute("data-testid", "test-alert");
      expect(alert).toHaveAttribute("data-custom", "value");
    });
  });
});
