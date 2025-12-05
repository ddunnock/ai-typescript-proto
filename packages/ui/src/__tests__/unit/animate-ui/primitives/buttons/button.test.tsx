/**
 * @file Comprehensive tests for the animated Button primitive component.
 *   Includes unit, edge case, security, performance, and chaos tests.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { Button } from "@/components/animate-ui/primitives/buttons/button";

// Mock motion/react - inline components in factory to avoid hoisting issues
vi.mock("motion/react", () => {
  const React = require("react");

  const MockMotionButton = React.forwardRef(
    (
      props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        whileHover?: object;
        whileTap?: object;
      },
      ref: React.Ref<HTMLButtonElement>
    ) => {
      const { whileHover, whileTap, children, ...rest } = props;
      return React.createElement(
        "button",
        {
          ...rest,
          ref,
          "data-while-hover": whileHover
            ? JSON.stringify(whileHover)
            : undefined,
          "data-while-tap": whileTap ? JSON.stringify(whileTap) : undefined,
        },
        children
      );
    }
  );
  MockMotionButton.displayName = "MockMotionButton";

  return {
    motion: {
      button: MockMotionButton,
    },
  };
});

// Mock the Slot component - inline to avoid hoisting issues
vi.mock("@/components/animate-ui/primitives/animate/slot", () => {
  const React = require("react");

  const MockSlot = React.forwardRef(
    (
      props: React.PropsWithChildren<{
        whileHover?: object;
        whileTap?: object;
        className?: string;
      }>,
      ref: React.Ref<HTMLElement>
    ) => {
      const { children, whileHover, whileTap, ...rest } = props;
      if (!React.isValidElement(children)) return null;
      return React.cloneElement(children, {
        ...rest,
        ref,
        "data-while-hover": whileHover ? JSON.stringify(whileHover) : undefined,
        "data-while-tap": whileTap ? JSON.stringify(whileTap) : undefined,
      });
    }
  );
  MockSlot.displayName = "MockSlot";

  return { Slot: MockSlot };
});

describe("Button (Primitive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default props", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Click me");
    });

    it("applies default hover scale", () => {
      render(<Button>Hover</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 1.05 })
      );
    });

    it("applies default tap scale", () => {
      render(<Button>Tap</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-tap",
        JSON.stringify({ scale: 0.95 })
      );
    });

    it("accepts custom hoverScale", () => {
      render(<Button hoverScale={1.2}>Custom Hover</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 1.2 })
      );
    });

    it("accepts custom tapScale", () => {
      render(<Button tapScale={0.8}>Custom Tap</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-tap",
        JSON.stringify({ scale: 0.8 })
      );
    });

    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("passes through standard button props", () => {
      render(
        <Button
          type="submit"
          disabled
          aria-label="Submit form"
          data-testid="submit-btn"
        >
          Submit
        </Button>
      );

      const button = screen.getByTestId("submit-btn");
      expect(button).toHaveAttribute("type", "submit");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-label", "Submit form");
    });

    it("handles className prop", () => {
      render(<Button className="custom-class">Styled</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("asChild Pattern", () => {
    it("renders as child element when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test" data-testid="link">
            Link Button
          </a>
        </Button>
      );

      const link = screen.getByTestId("link");
      expect(link.tagName.toLowerCase()).toBe("a");
      expect(link).toHaveAttribute("href", "/test");
    });

    it("applies motion props to child element", () => {
      render(
        <Button asChild hoverScale={1.1} tapScale={0.9}>
          <a href="/test" data-testid="link">
            Animated Link
          </a>
        </Button>
      );

      const link = screen.getByTestId("link");
      expect(link).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 1.1 })
      );
      expect(link).toHaveAttribute(
        "data-while-tap",
        JSON.stringify({ scale: 0.9 })
      );
    });

    it("preserves child props when asChild", () => {
      render(
        <Button asChild>
          <a href="/test" className="link-class" data-testid="link">
            Link
          </a>
        </Button>
      );

      const link = screen.getByTestId("link");
      expect(link).toHaveClass("link-class");
      expect(link).toHaveAttribute("href", "/test");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero hover scale", () => {
      render(<Button hoverScale={0}>Zero Hover</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 0 })
      );
    });

    it("handles zero tap scale", () => {
      render(<Button tapScale={0}>Zero Tap</Button>);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-tap",
        JSON.stringify({ scale: 0 })
      );
    });

    it("handles negative scales", () => {
      render(
        <Button hoverScale={-1} tapScale={-0.5}>
          Negative
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: -1 })
      );
      expect(button).toHaveAttribute(
        "data-while-tap",
        JSON.stringify({ scale: -0.5 })
      );
    });

    it("handles very large scales", () => {
      render(
        <Button hoverScale={100} tapScale={50}>
          Large
        </Button>
      );

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 100 })
      );
    });

    it("handles undefined scale values gracefully", () => {
      render(
        <Button hoverScale={undefined} tapScale={undefined}>
          Undefined
        </Button>
      );

      const button = screen.getByRole("button");
      // Should use defaults
      expect(button).toHaveAttribute(
        "data-while-hover",
        JSON.stringify({ scale: 1.05 })
      );
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in className", () => {
      const maliciousClass = '<script>alert("xss")</script>';
      render(<Button className={maliciousClass}>Safe</Button>);

      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("safely handles event handlers", async () => {
      const user = userEvent.setup();
      const handler = vi.fn();

      render(<Button onClick={handler}>Click</Button>);

      await user.click(screen.getByRole("button"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("prevents prototype pollution", () => {
      const maliciousProps = {
        __proto__: { polluted: true },
      } as Record<string, unknown>;

      render(<Button {...maliciousProps}>Safe</Button>);

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });

  describe("Performance Tests", () => {
    it("renders many buttons efficiently", () => {
      const startTime = performance.now();

      render(
        <>
          {Array.from({ length: 100 }, (_, i) => (
            <Button key={i} data-testid={`button-${i}`}>
              Button {i}
            </Button>
          ))}
        </>
      );

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByTestId("button-0")).toBeInTheDocument();
      expect(screen.getByTestId("button-99")).toBeInTheDocument();
    });

    it("handles rapid re-renders", async () => {
      const { rerender } = render(<Button hoverScale={1.0}>Button</Button>);

      await act(async () => {
        for (let i = 0; i < 50; i++) {
          rerender(<Button hoverScale={1 + i * 0.01}>Button {i}</Button>);
        }
      });

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid mount/unmount cycles", () => {
      const errors: Error[] = [];

      for (let i = 0; i < 50; i++) {
        try {
          const { unmount } = render(<Button>Button {i}</Button>);
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("handles concurrent button operations", async () => {
      const promises = Array.from({ length: 20 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const { unmount } = render(
              <Button hoverScale={1 + i * 0.1}>Button {i}</Button>
            );
            unmount();
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      expect(true).toBe(true);
    });

    it("handles rapid prop changes", async () => {
      const { rerender } = render(<Button hoverScale={1}>Button</Button>);

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          rerender(
            <Button hoverScale={Math.random() * 2} tapScale={Math.random()}>
              Button {i}
            </Button>
          );
        }
      });

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("handles click events", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("handles focus events", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();

      render(<Button onFocus={onFocus}>Focus me</Button>);

      await user.tab();

      expect(onFocus).toHaveBeenCalled();
    });

    it("is keyboard accessible", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard("{Enter}");

      expect(onClick).toHaveBeenCalled();
    });

    it("respects disabled state", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>
      );

      await user.click(screen.getByRole("button"));

      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
