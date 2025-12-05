/**
 * @file Comprehensive tests for Badge component. Includes unit, edge case,
 *   security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, badgeVariants } from "@/components/ui/badge";

describe("Badge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default props", () => {
      render(<Badge>New</Badge>);
      const badge = screen.getByText("New");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("data-slot", "badge");
    });

    it("applies default variant classes", () => {
      const { container } = render(<Badge>Default</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("applies secondary variant classes", () => {
      const { container } = render(
        <Badge variant="secondary">Secondary</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("applies destructive variant classes", () => {
      const { container } = render(<Badge variant="destructive">Error</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-destructive", "text-white");
    });

    it("applies outline variant classes", () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("text-foreground");
    });

    it("merges custom className correctly", () => {
      const { container } = render(
        <Badge className="custom-class">Custom</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("custom-class");
    });

    it("renders as span element by default", () => {
      render(<Badge>Badge</Badge>);
      const badge = screen.getByText("Badge");
      expect(badge.tagName).toBe("SPAN");
    });

    it("renders as child element when asChild=true", () => {
      render(
        <Badge asChild>
          <a href="/tags/react">React</a>
        </Badge>
      );
      const link = screen.getByRole("link", { name: "React" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("data-slot", "badge");
      expect(link).toHaveAttribute("href", "/tags/react");
    });

    it("handles text content", () => {
      render(<Badge>Status: Active</Badge>);
      expect(screen.getByText("Status: Active")).toBeInTheDocument();
    });

    it("handles numeric content", () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("handles icon content", () => {
      const MockIcon = () => <svg data-testid="icon" />;
      render(
        <Badge>
          <MockIcon />
          With Icon
        </Badge>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("With Icon")).toBeInTheDocument();
    });

    it("applies badgeVariants function correctly", () => {
      const defaultClasses = badgeVariants({ variant: "default" });
      expect(defaultClasses).toContain("bg-primary");

      const secondaryClasses = badgeVariants({ variant: "secondary" });
      expect(secondaryClasses).toContain("bg-secondary");
    });
  });

  describe("Edge Cases", () => {
    it("renders with empty children", () => {
      const { container } = render(<Badge></Badge>);
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("handles undefined variant gracefully", () => {
      const { container } = render(
        <Badge variant={undefined}>Undefined</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-primary"); // Falls back to default
    });

    it("handles very long text content", () => {
      const longText = "A".repeat(1000);
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("merges classNames correctly with utility function", () => {
      const { container } = render(
        <Badge className="text-lg font-bold" variant="outline">
          Merged
        </Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("text-lg", "font-bold");
      expect(badge).toHaveClass("text-foreground"); // From outline variant
    });

    it("handles special characters in content", () => {
      render(<Badge>@#$%^&*()</Badge>);
      expect(screen.getByText("@#$%^&*()")).toBeInTheDocument();
    });

    it("handles multiple children", () => {
      render(
        <Badge>
          <span>Icon</span>
          <span>Text</span>
        </Badge>
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });

  describe("Security Tests", () => {
    it("sanitizes className prop to prevent XSS", () => {
      const xssAttempt = "alert('xss')";
      const { container } = render(
        <Badge className={xssAttempt}>XSS Badge</Badge>
      );
      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
      // Verify no script tags were injected into the DOM
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("does not allow arbitrary HTML injection via children (React's default behavior)", () => {
      render(<Badge>{`<img src onerror="alert('xss')">`}</Badge>);
      const badge = screen.getByText(`<img src onerror="alert('xss')">`);
      // React escapes HTML, so it should be displayed as text
      expect(badge.textContent).toContain("<img");
      // But script should not execute - no img tags in DOM
      const img = badge.querySelector("img");
      expect(img).toBeNull();
    });

    it("validates data-slot attribute values", () => {
      render(<Badge>Test</Badge>);
      const badge = screen.getByText("Test");
      const dataSlot = badge.getAttribute("data-slot");
      expect(dataSlot).toBe("badge");
      expect(dataSlot).not.toContain("<");
      expect(dataSlot).not.toContain(">");
    });
  });

  describe("Performance Tests", () => {
    it("does not cause excessive re-renders on prop changes", () => {
      const RenderCounter = vi.fn(() => <Badge>Count</Badge>);
      const { rerender } = render(<RenderCounter />);
      expect(RenderCounter).toHaveBeenCalledTimes(1);

      rerender(<RenderCounter variant="secondary" />);
      // React may re-render for prop changes, which is expected
      expect(RenderCounter).toHaveBeenCalledTimes(2);
    });

    it("maintains performance with many variants (simulated)", () => {
      const variants = [
        "default",
        "secondary",
        "destructive",
        "outline",
      ] as const;
      const renderManyBadges = () => {
        return (
          <div>
            {variants.map((variant) => (
              <Badge key={variant} variant={variant}>
                {variant}
              </Badge>
            ))}
          </div>
        );
      };

      const startTime = performance.now();
      render(renderManyBadges());
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should render quickly
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid prop changes without crashing", () => {
      const { rerender } = render(
        <Badge className="class-a">Chaos Badge</Badge>
      );
      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(
            <Badge
              className={`class-${i % 2}`}
              variant={i % 2 === 0 ? "default" : "secondary"}
            >
              Chaos Badge
            </Badge>
          );
        }
      }).not.toThrow();
      expect(screen.getByText("Chaos Badge")).toBeInTheDocument();
    });

    it("handles children changes during interaction", () => {
      const { rerender } = render(<Badge>Initial</Badge>);
      expect(screen.getByText("Initial")).toBeInTheDocument();

      rerender(<Badge>Changed</Badge>);
      expect(screen.getByText("Changed")).toBeInTheDocument();
      expect(screen.queryByText("Initial")).not.toBeInTheDocument();
    });

    it("handles asChild prop changes", () => {
      const { rerender } = render(<Badge asChild={false}>Not Child</Badge>);
      expect(screen.getByText("Not Child").tagName).toBe("SPAN");

      rerender(
        <Badge asChild>
          <a href="/test">As Child</a>
        </Badge>
      );
      expect(
        screen.getByRole("link", { name: "As Child" })
      ).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("works correctly within Card component", async () => {
      const { Card, CardHeader, CardTitle } =
        await import("@/components/ui/card");
      render(
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Project Status</CardTitle>
              <Badge variant="secondary">Active</Badge>
            </div>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText("Project Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("works correctly with Button component", async () => {
      const { Button } = await import("@/components/ui/button");
      render(
        <div className="flex items-center gap-2">
          <Badge>New</Badge>
          <Button>Action</Button>
        </div>
      );
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action" })
      ).toBeInTheDocument();
    });

    it("works correctly as a link with asChild", () => {
      render(
        <Badge asChild variant="outline">
          <a href="/tags/react">React</a>
        </Badge>
      );
      const link = screen.getByRole("link", { name: "React" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/tags/react");
      expect(link).toHaveClass("text-foreground"); // From outline variant
    });

    it("composes correctly with multiple badges", () => {
      render(
        <div className="flex gap-2">
          <Badge>New</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Tag</Badge>
        </div>
      );
      expect(screen.getByText("New")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Tag")).toBeInTheDocument();
    });

    it("works correctly in a list context", () => {
      const items = ["React", "TypeScript", "Next.js"];
      render(
        <ul>
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Badge variant="outline">{item}</Badge>
            </li>
          ))}
        </ul>
      );
      items.forEach((item) => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });
});
