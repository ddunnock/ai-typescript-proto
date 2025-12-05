/**
 * @file Comprehensive tests for Alert component. Includes unit, accessibility,
 *   edge case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { rapidFire, raceConditionTester } from "@convergence/test-utils";

describe("Alert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default variant", () => {
      render(<Alert>Test alert</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Test alert");
    });

    it("renders with destructive variant", () => {
      render(<Alert variant="destructive">Error message</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass("text-destructive");
    });

    it("applies custom className", () => {
      render(<Alert className="custom-class">Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("custom-class");
    });

    it("has correct role attribute", () => {
      render(<Alert>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("role", "alert");
    });

    it("has data-slot attribute", () => {
      render(<Alert>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("data-slot", "alert");
    });

    it("renders with icon (SVG child)", () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("spreads additional props", () => {
      render(
        <Alert data-testid="custom-alert" id="my-alert">
          Test
        </Alert>
      );

      const alert = screen.getByTestId("custom-alert");
      expect(alert).toHaveAttribute("id", "my-alert");
    });
  });

  describe("AlertTitle", () => {
    it("renders title text", () => {
      render(
        <Alert>
          <AlertTitle>Important Title</AlertTitle>
        </Alert>
      );

      expect(screen.getByText("Important Title")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title">Title</AlertTitle>
        </Alert>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveAttribute("data-slot", "alert-title");
    });

    it("applies custom className", () => {
      render(
        <Alert>
          <AlertTitle className="custom-title" data-testid="title">
            Title
          </AlertTitle>
        </Alert>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("custom-title");
    });

    it("has line-clamp styling", () => {
      render(
        <Alert>
          <AlertTitle data-testid="title">Title</AlertTitle>
        </Alert>
      );

      const title = screen.getByTestId("title");
      expect(title).toHaveClass("line-clamp-1");
    });
  });

  describe("AlertDescription", () => {
    it("renders description text", () => {
      render(
        <Alert>
          <AlertDescription>This is a description</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Alert>
          <AlertDescription data-testid="desc">Description</AlertDescription>
        </Alert>
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveAttribute("data-slot", "alert-description");
    });

    it("applies custom className", () => {
      render(
        <Alert>
          <AlertDescription className="custom-desc" data-testid="desc">
            Description
          </AlertDescription>
        </Alert>
      );

      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("custom-desc");
    });

    it("renders nested paragraphs", () => {
      render(
        <Alert>
          <AlertDescription>
            <p>Paragraph 1</p>
            <p>Paragraph 2</p>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Paragraph 1")).toBeInTheDocument();
      expect(screen.getByText("Paragraph 2")).toBeInTheDocument();
    });
  });

  describe("Full Component Integration", () => {
    it("renders complete alert with title and description", () => {
      render(
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the cli.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Heads up!")).toBeInTheDocument();
      expect(screen.getByText(/You can add components/)).toBeInTheDocument();
    });

    it("renders destructive alert with icon", () => {
      render(
        <Alert variant="destructive">
          <svg data-testid="error-icon" className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Your session has expired.</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("text-destructive");
      expect(screen.getByTestId("error-icon")).toBeInTheDocument();
    });
  });

  describe("Accessibility Tests", () => {
    it("has role=alert for screen readers", () => {
      render(<Alert>Accessible alert</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("alert content is accessible", () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description text</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent("Title");
      expect(alert).toHaveTextContent("Description text");
    });

    it("supports aria-labelledby", () => {
      render(
        <Alert aria-labelledby="alert-title">
          <AlertTitle id="alert-title">Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-labelledby", "alert-title");
    });

    it("supports aria-describedby", () => {
      render(
        <Alert aria-describedby="alert-desc">
          <AlertTitle>Title</AlertTitle>
          <AlertDescription id="alert-desc">Description</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-describedby", "alert-desc");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty children", () => {
      render(<Alert></Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles null children", () => {
      render(<Alert>{null}</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles very long content", () => {
      const longText = "A".repeat(10000);
      render(
        <Alert>
          <AlertTitle>{longText}</AlertTitle>
          <AlertDescription>{longText}</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      render(
        <Alert>
          <AlertTitle>{"<script>alert('xss')</script>"}</AlertTitle>
          <AlertDescription>&amp; &lt; &gt; &quot;</AlertDescription>
        </Alert>
      );

      expect(
        screen.getByText("<script>alert('xss')</script>")
      ).toBeInTheDocument();
    });

    it("handles multiple icons", () => {
      render(
        <Alert>
          <svg data-testid="icon-1" />
          <svg data-testid="icon-2" />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );

      expect(screen.getByTestId("icon-1")).toBeInTheDocument();
      expect(screen.getByTestId("icon-2")).toBeInTheDocument();
    });

    it("handles empty className", () => {
      render(<Alert className="">Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles undefined variant", () => {
      render(<Alert variant={undefined}>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles long custom className", () => {
      const longClassName = Array(50).fill("class").join("-");
      render(<Alert className={longClassName}>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass(longClassName);
    });
  });

  describe("Security Tests", () => {
    it("does not execute className as HTML or JS", () => {
      const xssAttempt = '<script>alert("xss")</script>';
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(<Alert className={xssAttempt}>Test</Alert>);

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it("safely renders XSS attempts in children", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <Alert>
          <AlertTitle>{"<img src=x onerror=alert('xss')>"}</AlertTitle>
        </Alert>
      );

      expect(alertSpy).not.toHaveBeenCalled();
      // Text should be escaped
      expect(
        screen.getByText("<img src=x onerror=alert('xss')>")
      ).toBeInTheDocument();
      alertSpy.mockRestore();
    });

    it("handles className with HTML entities safely", () => {
      render(<Alert className='class"name'>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles prototype pollution attempts in className", () => {
      render(<Alert className="__proto__">Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(Object.prototype.hasOwnProperty.call({}, "polluted")).toBe(false);
    });
  });

  describe("Performance Tests", () => {
    it("does not re-render excessively on parent re-render", () => {
      let renderCount = 0;

      /**
       * Tracks render count for Alert performance testing.
       *
       * @returns Alert component
       */
      function CountingAlert() {
        renderCount++;
        return <Alert>Test</Alert>;
      }

      const { rerender } = render(<CountingAlert />);
      const initialCount = renderCount;

      rerender(<CountingAlert />);

      expect(renderCount).toBeLessThan(initialCount + 3);
    });

    it("handles variant prop changes efficiently", () => {
      let renderCount = 0;

      /**
       * Tracks render count for variant change testing.
       *
       * @param props - Component props
       * @param props.variant - Alert variant
       * @returns Alert component with specified variant
       */
      function CountingAlert({
        variant,
      }: {
        variant?: "default" | "destructive";
      }) {
        renderCount++;
        return <Alert variant={variant}>Test</Alert>;
      }

      const { rerender } = render(<CountingAlert variant="default" />);
      const initialCount = renderCount;

      rerender(<CountingAlert variant="destructive" />);
      rerender(<CountingAlert variant="default" />);

      expect(renderCount).toBeLessThan(initialCount + 5);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid variant switching", async () => {
      const variants: Array<"default" | "destructive"> = [
        "default",
        "destructive",
      ];
      let currentVariant: "default" | "destructive" = "default";

      const { rerender } = render(<Alert variant={currentVariant}>Test</Alert>);

      await rapidFire(
        () => {
          const randomIndex = Math.floor(Math.random() * variants.length);
          currentVariant = variants[randomIndex] ?? "default";
          rerender(<Alert variant={currentVariant}>Test</Alert>);
        },
        100,
        0
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("handles rapid mount/unmount cycles", async () => {
      const errors: Error[] = [];

      for (let i = 0; i < 50; i++) {
        try {
          const { unmount } = render(
            <Alert>
              <AlertTitle>Title</AlertTitle>
              <AlertDescription>Description</AlertDescription>
            </Alert>
          );
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("handles rapid content changes", async () => {
      const contents = [
        "Content 1",
        "Content 2",
        "Content 3",
        "Content 4",
        "Content 5",
      ];
      let currentContent = contents[0];

      const { rerender } = render(
        <Alert>
          <AlertTitle>{currentContent}</AlertTitle>
        </Alert>
      );

      await rapidFire(
        () => {
          currentContent =
            contents[Math.floor(Math.random() * contents.length)];
          rerender(
            <Alert>
              <AlertTitle>{currentContent}</AlertTitle>
            </Alert>
          );
        },
        100,
        0
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("survives race condition testing", async () => {
      await raceConditionTester(
        () => {
          const { unmount } = render(
            <Alert variant="destructive">
              <AlertTitle>Test</AlertTitle>
              <AlertDescription>Description</AlertDescription>
            </Alert>
          );
          return unmount;
        },
        50,
        { maxConcurrent: 5 }
      );

      // If we get here without throwing, the test passes
      expect(true).toBe(true);
    });

    it("handles alternating props changes", () => {
      const { rerender } = render(<Alert variant="default">Test</Alert>);

      for (let i = 0; i < 20; i++) {
        rerender(
          <Alert
            variant={i % 2 === 0 ? "destructive" : "default"}
            className={i % 2 === 0 ? "class-a" : "class-b"}
          >
            Content {i}
          </Alert>
        );
      }

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });
  });
});
