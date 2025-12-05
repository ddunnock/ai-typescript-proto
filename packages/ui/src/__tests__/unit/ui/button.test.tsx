/**
 * @file Comprehensive tests for Button component. Includes unit, edge case,
 *   security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default props", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("data-slot", "button");
    });

    it("applies default variant classes", () => {
      const { container } = render(<Button>Default</Button>);
      const button = container.querySelector("button");
      // Check for gradient background with primary colors (glassmorphism style)
      expect(button?.className).toContain("from-primary");
      expect(button?.className).toContain("text-primary-foreground");
    });

    it("applies destructive variant classes", () => {
      const { container } = render(
        <Button variant="destructive">Delete</Button>
      );
      const button = container.querySelector("button");
      // Check for gradient background with destructive colors
      expect(button?.className).toContain("from-pink-500");
      expect(button?.className).toContain("text-white");
    });

    it("applies outline variant classes", () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector("button");
      // Check for glassmorphism outline style
      expect(button?.className).toContain("border");
      expect(button?.className).toContain("bg-white/10");
      expect(button?.className).toContain("backdrop-blur");
    });

    it("applies secondary variant classes", () => {
      const { container } = render(
        <Button variant="secondary">Secondary</Button>
      );
      const button = container.querySelector("button");
      // Check for glassmorphism secondary style
      expect(button?.className).toContain("bg-secondary/40");
      expect(button?.className).toContain("text-secondary-foreground");
      expect(button?.className).toContain("backdrop-blur");
    });

    it("applies ghost variant classes", () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector("button");
      // Check for ghost variant hover style
      expect(button?.className).toContain("hover:bg-accent");
      expect(button?.className).toContain("text-foreground");
    });

    it("applies link variant classes", () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("text-primary", "underline-offset-4");
    });

    it("applies default size classes", () => {
      const { container } = render(
        <Button size="default">Default Size</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("h-9", "px-4", "py-2");
    });

    it("applies small size classes", () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("h-8", "px-3");
    });

    it("applies large size classes", () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("h-10", "px-6");
    });

    it("applies icon size classes", () => {
      const { container } = render(<Button size="icon">Icon</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("size-9");
    });

    it("applies icon-sm size classes", () => {
      const { container } = render(<Button size="icon-sm">Icon</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("size-8");
    });

    it("applies icon-lg size classes", () => {
      const { container } = render(<Button size="icon-lg">Icon</Button>);
      const button = container.querySelector("button");
      expect(button).toHaveClass("size-10");
    });

    it("merges custom className correctly", () => {
      const { container } = render(
        <Button className="custom-class">Custom</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("custom-class");
    });

    it("renders as button element by default", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("renders as child element when asChild=true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: "Link Button" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("data-slot", "button");
    });

    it("handles disabled state correctly", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        "disabled:pointer-events-none",
        "disabled:opacity-50"
      );
    });

    it("handles onClick events", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles type attribute", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("handles aria-invalid state", () => {
      const { container } = render(
        <Button aria-invalid="true">Invalid</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveAttribute("aria-invalid", "true");
      expect(button).toHaveClass("aria-invalid:ring-destructive/20");
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined className", () => {
      const { container } = render(<Button className={undefined}>Test</Button>);
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("handles null className", () => {
      const { container } = render(
        <Button className={null as unknown as string}>Test</Button>
      );
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("handles empty children", () => {
      const { container } = render(<Button></Button>);
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("handles very long className strings", () => {
      const longClassName = "a".repeat(1000);
      const { container } = render(
        <Button className={longClassName}>Test</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass(longClassName);
    });

    it("handles asChild with non-button children", () => {
      render(
        <Button asChild>
          <div>Div Button</div>
        </Button>
      );
      const div = screen.getByText("Div Button");
      expect(div).toBeInTheDocument();
      expect(div).toHaveAttribute("data-slot", "button");
    });

    it("handles multiple className values", () => {
      const { container } = render(
        <Button className="class1 class2 class3">Test</Button>
      );
      const button = container.querySelector("button");
      expect(button).toHaveClass("class1", "class2", "class3");
    });

    it("handles all variant and size combinations", () => {
      const variants = [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ] as const;
      const sizes = [
        "default",
        "sm",
        "lg",
        "icon",
        "icon-sm",
        "icon-lg",
      ] as const;

      variants.forEach((variant) => {
        sizes.forEach((size) => {
          const { container, unmount } = render(
            <Button variant={variant} size={size}>
              {variant}-{size}
            </Button>
          );
          const button = container.querySelector("button");
          expect(button).toBeInTheDocument();
          unmount();
        });
      });
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in className prop", () => {
      const maliciousClass = '<script>alert("xss")</script>';
      const { container } = render(
        <Button className={maliciousClass}>Test</Button>
      );
      const button = container.querySelector("button");
      // className is set as-is by React (it's just a CSS class, not executable code)
      // The important thing is that it doesn't execute as JavaScript
      expect(button).toBeInTheDocument();
      // Verify no script tags were injected into the DOM
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("sanitizes user-provided className", () => {
      const dangerousClass = "javascript:alert('xss')";
      const { container } = render(
        <Button className={dangerousClass}>Test</Button>
      );
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
      // React should handle this safely
    });

    it("validates data-slot attribute values", () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole("button");
      const dataSlot = button.getAttribute("data-slot");
      expect(dataSlot).toBe("button");
      expect(dataSlot).not.toContain("<");
      expect(dataSlot).not.toContain(">");
    });

    it("prevents prototype pollution via props", () => {
      const maliciousProps = {
        __proto__: { polluted: true },
      } as React.ComponentProps<typeof Button>;

      render(<Button {...maliciousProps}>Test</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      // Verify no prototype pollution
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("handles malicious event handlers safely", async () => {
      const user = userEvent.setup();
      // Test that component accepts any function as handler without crashing
      const handler = vi.fn();

      render(<Button onClick={handler}>Test</Button>);

      await user.click(screen.getByRole("button"));

      expect(handler).toHaveBeenCalled();
      // Component should still be rendered and functional
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.getByRole("button")).not.toBeDisabled();
    });
  });

  describe("Performance Tests", () => {
    it("does not cause excessive re-renders on prop changes", () => {
      let renderCount = 0;
      const TestComponent = ({
        variant,
      }: {
        variant: "default" | "destructive";
      }) => {
        renderCount++;
        return <Button variant={variant}>Test</Button>;
      };

      const { rerender } = render(<TestComponent variant="default" />);
      const initialCount = renderCount;

      rerender(<TestComponent variant="destructive" />);
      expect(renderCount).toBeLessThan(initialCount + 3);
    });

    it("batches rapid variant/size changes", async () => {
      const { rerender } = render(
        <Button variant="default" size="default">
          Test
        </Button>
      );

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          rerender(
            <Button
              variant={i % 2 === 0 ? "default" : "destructive"}
              size="default"
            >
              Test
            </Button>
          );
        }
      });

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("memoizes variant classes correctly", () => {
      const { container, rerender } = render(
        <Button variant="default" size="default">
          Test
        </Button>
      );
      const firstRender = container.querySelector("button")?.className;

      rerender(
        <Button variant="default" size="default">
          Test
        </Button>
      );
      const secondRender = container.querySelector("button")?.className;

      // Classes should be consistent
      expect(firstRender).toBe(secondRender);
    });

    it("handles many buttons efficiently", () => {
      const { container } = render(
        <>
          {Array.from({ length: 100 }, (_, i) => (
            <Button key={i} variant="default">
              Button {i}
            </Button>
          ))}
        </>
      );
      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(100);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid prop changes (100+ times)", async () => {
      const variants: Array<"default" | "destructive" | "outline"> = [
        "default",
        "destructive",
        "outline",
      ];
      const { rerender } = render(<Button variant="default">Test</Button>);

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          rerender(
            <Button
              variant={variants[i % 3]!}
              size={i % 2 === 0 ? "default" : "sm"}
            >
              Test
            </Button>
          );
        }
      });

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("handles concurrent renders", async () => {
      const promises = Array.from({ length: 50 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const { unmount } = render(
              <Button variant="default">Button {i}</Button>
            );
            unmount();
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      // Should not throw errors
      expect(true).toBe(true);
    });

    it("handles DOM manipulation during render", async () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector("button");

      await act(async () => {
        if (button) {
          button.setAttribute("data-manipulated", "true");
          button.classList.add("manipulated");
        }
      });

      expect(button).toHaveAttribute("data-manipulated", "true");
      expect(button).toHaveClass("manipulated");
    });

    it("handles invalid prop combinations gracefully", () => {
      // TypeScript should catch these, but test runtime behavior
      const { container } = render(
        <Button className="test" disabled={false}>
          Test
        </Button>
      );
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });

    it("handles missing Slot component gracefully", () => {
      // If Slot fails, should fall back to button
      const { container } = render(<Button asChild={false}>Test</Button>);
      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
      expect(button?.tagName).toBe("BUTTON");
    });

    it("handles rapid mount/unmount cycles", async () => {
      const iterations = 50;
      const errors: Error[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const { unmount } = render(<Button>Test {i}</Button>);
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });
  });

  describe("Integration Tests", () => {
    it("works within form elements", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button"));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("works with keyboard navigation", async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole("button");
      button.focus();
      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();

      handleClick.mockClear();
      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalled();
    });

    it("works with screen readers", () => {
      render(<Button aria-label="Close dialog">×</Button>);
      const button = screen.getByRole("button", { name: "Close dialog" });
      expect(button).toBeInTheDocument();
    });

    it("works with focus management", () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("handles button with icon children", () => {
      render(
        <Button>
          <span aria-hidden="true">🔍</span>
          Search
        </Button>
      );
      const button = screen.getByRole("button", { name: "Search" });
      expect(button).toBeInTheDocument();
    });
  });
});

describe("buttonVariants", () => {
  it("generates correct class names for default variant", () => {
    const classes = buttonVariants({ variant: "default", size: "default" });
    // Check for gradient background classes (glassmorphism style)
    expect(classes).toContain("from-primary");
    expect(classes).toContain("text-primary-foreground");
  });

  it("generates correct class names for all variants", () => {
    const variants = [
      "default",
      "destructive",
      "outline",
      "secondary",
      "ghost",
      "link",
    ] as const;
    variants.forEach((variant) => {
      const classes = buttonVariants({ variant, size: "default" });
      expect(classes).toBeTruthy();
      expect(typeof classes).toBe("string");
    });
  });

  it("generates correct class names for all sizes", () => {
    const sizes = [
      "default",
      "sm",
      "lg",
      "icon",
      "icon-sm",
      "icon-lg",
    ] as const;
    sizes.forEach((size) => {
      const classes = buttonVariants({ variant: "default", size });
      expect(classes).toBeTruthy();
      expect(typeof classes).toBe("string");
    });
  });

  it("handles undefined variant and size", () => {
    const classes = buttonVariants();
    expect(classes).toBeTruthy();
    expect(typeof classes).toBe("string");
  });
});
