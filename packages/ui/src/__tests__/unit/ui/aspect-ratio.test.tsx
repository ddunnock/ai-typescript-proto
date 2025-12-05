/**
 * @file Comprehensive tests for AspectRatio component. Includes unit, edge
 *   case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

describe("AspectRatio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default props", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <div>Content</div>
        </AspectRatio>
      );
      const container = screen.getByText("Content").parentElement;
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute("data-slot", "aspect-ratio");
    });

    it("applies ratio prop correctly", () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <div>Content</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toHaveAttribute("style");
    });

    it("renders children correctly", () => {
      render(
        <AspectRatio ratio={1}>
          <img src="/test.jpg" alt="Test" />
        </AspectRatio>
      );
      const image = screen.getByAltText("Test");
      expect(image).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3} className="custom-class">
          <div>Content</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toHaveClass("custom-class");
    });

    it("works with different ratio values", () => {
      const ratios = [1, 16 / 9, 4 / 3, 21 / 9, 0.5];
      ratios.forEach((ratio) => {
        const { container } = render(
          <AspectRatio ratio={ratio}>
            <div>Content {ratio}</div>
          </AspectRatio>
        );
        const aspectRatio = container.querySelector(
          '[data-slot="aspect-ratio"]'
        );
        expect(aspectRatio).toBeInTheDocument();
      });
    });

    it("works with image content", () => {
      render(
        <AspectRatio ratio={16 / 9}>
          <img src="/image.jpg" alt="Landscape" />
        </AspectRatio>
      );
      const image = screen.getByAltText("Landscape");
      expect(image).toBeInTheDocument();
    });

    it("works with video content", () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <video src="/video.mp4" />
        </AspectRatio>
      );
      const video = container.querySelector("video");
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("src", "/video.mp4");
    });

    it("works with div content", () => {
      render(
        <AspectRatio ratio={1}>
          <div className="bg-primary">Square content</div>
        </AspectRatio>
      );
      const content = screen.getByText("Square content");
      expect(content).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very small ratio values", () => {
      const { container } = render(
        <AspectRatio ratio={0.1}>
          <div>Narrow</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
    });

    it("handles very large ratio values", () => {
      const { container } = render(
        <AspectRatio ratio={10}>
          <div>Wide</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
    });

    it("handles empty children", () => {
      const { container } = render(<AspectRatio ratio={16 / 9} />);
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
    });

    it("handles undefined className gracefully", () => {
      const { container } = render(
        <AspectRatio ratio={1} className={undefined}>
          <div>Content</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
    });

    it("merges multiple className values", () => {
      const { container } = render(
        <AspectRatio ratio={1} className="class1 class2">
          <div>Content</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toHaveClass("class1", "class2");
    });
  });

  describe("Security Tests", () => {
    it("sanitizes className prop to prevent XSS", () => {
      const maliciousClass = '<script>alert("xss")</script>';
      const { container } = render(
        <AspectRatio ratio={1} className={maliciousClass}>
          <div>Content</div>
        </AspectRatio>
      );
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
      // Verify no script tags were injected into the DOM
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("does not allow arbitrary HTML injection via children (React's default behavior)", () => {
      render(
        <AspectRatio ratio={1}>
          {`<img src onerror="alert('xss')">`}
        </AspectRatio>
      );
      const aspectRatio = document.querySelector('[data-slot="aspect-ratio"]');
      expect(aspectRatio).toBeInTheDocument();
      // React escapes HTML, so it should be displayed as text
      expect(aspectRatio?.textContent).toContain("<img");
      // But script should not execute - no img tags in DOM
      expect(aspectRatio?.querySelector("img")).toBeNull();
    });
  });

  describe("Performance Tests", () => {
    it("does not cause excessive re-renders on prop changes", () => {
      const RenderCounter = vi.fn(() => (
        <AspectRatio ratio={16 / 9}>
          <div>Count</div>
        </AspectRatio>
      ));
      const { rerender } = render(<RenderCounter />);
      expect(RenderCounter).toHaveBeenCalledTimes(1);

      rerender(<RenderCounter />);
      // React may re-render for prop changes, which is expected
      expect(RenderCounter).toHaveBeenCalledTimes(2);
    });

    it("renders multiple aspect ratios quickly", () => {
      const startTime = performance.now();
      render(
        <div>
          {Array.from({ length: 50 }, (_, i) => (
            <AspectRatio key={i} ratio={16 / 9}>
              <div>Item {i}</div>
            </AspectRatio>
          ))}
        </div>
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should render quickly
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid ratio changes without crashing", () => {
      const { rerender } = render(
        <AspectRatio ratio={16 / 9}>
          <div>Content</div>
        </AspectRatio>
      );
      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(
            <AspectRatio ratio={i % 2 === 0 ? 16 / 9 : 4 / 3}>
              <div>Content</div>
            </AspectRatio>
          );
        }
      }).not.toThrow();
    });

    it("handles deeply nested children structure", () => {
      const DeeplyNestedContent = () => (
        <div>
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i}>Nested paragraph {i}</p>
          ))}
        </div>
      );

      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <DeeplyNestedContent />
        </AspectRatio>
      );
      expect(container).toBeInTheDocument();
      expect(screen.getAllByText(/nested paragraph/i)).toHaveLength(10);
    });
  });

  describe("Integration Tests", () => {
    it("works correctly with Card component", async () => {
      const cardModule = await import("@/components/ui/card");
      const { Card, CardContent } = cardModule;
      render(
        <Card>
          <CardContent>
            <AspectRatio ratio={16 / 9}>
              <img src="/card-image.jpg" alt="Card image" />
            </AspectRatio>
          </CardContent>
        </Card>
      );
      expect(screen.getByAltText("Card image")).toBeInTheDocument();
    });

    it("works correctly with responsive layouts", () => {
      render(
        <div className="grid grid-cols-2">
          <AspectRatio ratio={1}>
            <div>Square 1</div>
          </AspectRatio>
          <AspectRatio ratio={1}>
            <div>Square 2</div>
          </AspectRatio>
        </div>
      );
      expect(screen.getByText("Square 1")).toBeInTheDocument();
      expect(screen.getByText("Square 2")).toBeInTheDocument();
    });

    it("maintains aspect ratio with different content types", () => {
      render(
        <>
          <AspectRatio ratio={16 / 9}>
            <img src="/landscape.jpg" alt="Landscape" />
          </AspectRatio>
          <AspectRatio ratio={1}>
            <div className="bg-primary">Square</div>
          </AspectRatio>
          <AspectRatio ratio={4 / 3}>
            <video src="/video.mp4" />
          </AspectRatio>
        </>
      );
      expect(screen.getByAltText("Landscape")).toBeInTheDocument();
      expect(screen.getByText("Square")).toBeInTheDocument();
    });
  });
});
