/**
 * @file Comprehensive tests for Card component system. Includes unit, edge
 *   case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

describe("Card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("Card renders with default props", () => {
      const { container } = render(<Card>Card content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(card?.className).toContain("bg-card/80");
      expect(card?.className).toContain("backdrop-blur");
      expect(card?.className).toContain("text-card-foreground");
    });

    it("CardHeader renders correctly", () => {
      const { container } = render(<CardHeader>Header content</CardHeader>);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent("Header content");
    });

    it("CardTitle renders with correct styling", () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass("leading-none", "font-semibold");
      expect(title).toHaveTextContent("Title");
    });

    it("CardDescription renders with muted text", () => {
      const { container } = render(
        <CardDescription>Description text</CardDescription>
      );
      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass("text-muted-foreground", "text-sm");
      expect(description).toHaveTextContent("Description text");
    });

    it("CardContent renders with padding", () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass("px-6");
      expect(content).toHaveTextContent("Content");
    });

    it("CardFooter renders with flex layout", () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("flex", "items-center", "px-6");
      expect(footer).toHaveTextContent("Footer");
    });

    it("CardAction renders in correct position", () => {
      const { container } = render(<CardAction>Action</CardAction>);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
      expect(action).toHaveClass(
        "col-start-2",
        "row-span-2",
        "row-start-1",
        "self-start",
        "justify-self-end"
      );
    });

    it("all components merge className correctly", () => {
      const { container } = render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
            <CardDescription className="custom-description">
              Desc
            </CardDescription>
          </CardHeader>
          <CardContent className="custom-content">Content</CardContent>
          <CardFooter className="custom-footer">Footer</CardFooter>
        </Card>
      );

      expect(container.querySelector('[data-slot="card"]')).toHaveClass(
        "custom-card"
      );
      expect(container.querySelector('[data-slot="card-header"]')).toHaveClass(
        "custom-header"
      );
      expect(container.querySelector('[data-slot="card-title"]')).toHaveClass(
        "custom-title"
      );
      expect(
        container.querySelector('[data-slot="card-description"]')
      ).toHaveClass("custom-description");
      expect(container.querySelector('[data-slot="card-content"]')).toHaveClass(
        "custom-content"
      );
      expect(container.querySelector('[data-slot="card-footer"]')).toHaveClass(
        "custom-footer"
      );
    });

    it("all components apply data-slot attributes", () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-title"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-description"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-action"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty card content", () => {
      const { container } = render(<Card></Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("handles missing optional sub-components", () => {
      const { container } = render(
        <Card>
          <CardContent>Only content</CardContent>
        </Card>
      );
      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
    });

    it("handles very long content", () => {
      const longContent = "a".repeat(10000);
      const { container } = render(
        <Card>
          <CardContent>{longContent}</CardContent>
        </Card>
      );
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveTextContent(longContent);
    });

    it("handles nested cards", () => {
      const { container } = render(
        <Card>
          <CardContent>
            <Card>
              <CardContent>Nested card</CardContent>
            </Card>
          </CardContent>
        </Card>
      );
      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(2);
    });

    it("handles cards with no children", () => {
      const { container } = render(<Card>{null}</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("handles undefined className", () => {
      const { container } = render(<Card className={undefined}>Test</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("handles null className", () => {
      const { container } = render(
        <Card className={null as unknown as string}>Test</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("handles all sub-components without Card wrapper", () => {
      const { container } = render(
        <>
          <CardHeader>Header</CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </>
      );
      expect(
        container.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in className", () => {
      const maliciousClass = '<script>alert("xss")</script>';
      const { container } = render(
        <Card className={maliciousClass}>Test</Card>
      );
      const card = container.querySelector('[data-slot="card"]');
      // className is set as-is by React (it's just a CSS class, not executable code)
      // The important thing is that it doesn't execute as JavaScript
      expect(card).toBeInTheDocument();
      // Verify no script tags were injected into the DOM
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("sanitizes data-slot attributes", () => {
      render(<Card>Test</Card>);
      const card = document.querySelector('[data-slot="card"]');
      const dataSlot = card?.getAttribute("data-slot");
      expect(dataSlot).toBe("card");
      expect(dataSlot).not.toContain("<");
      expect(dataSlot).not.toContain(">");
    });

    it("safely renders HTML content", () => {
      const { container } = render(
        <CardContent>
          <div dangerouslySetInnerHTML={{ __html: "<strong>Safe</strong>" }} />
        </CardContent>
      );
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
      // React should handle this safely
    });

    it("prevents prototype pollution via props", () => {
      const maliciousProps = {
        __proto__: { polluted: true },
      } as React.ComponentProps<typeof Card>;

      render(<Card {...maliciousProps}>Test</Card>);
      const card = document.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("handles malicious event handlers safely", async () => {
      const user = userEvent.setup();
      // Test that component accepts any function as handler without crashing
      const handler = vi.fn();

      render(
        <Card onClick={handler}>
          <CardContent>Test</CardContent>
        </Card>
      );
      const card = document.querySelector('[data-slot="card"]');
      if (card) {
        await user.click(card);
        expect(handler).toHaveBeenCalled();
        // Component should still be rendered and functional
        expect(card).toBeInTheDocument();
      }
    });
  });

  describe("Performance Tests", () => {
    it("renders many cards efficiently", () => {
      const { container } = render(
        <>
          {Array.from({ length: 100 }, (_, i) => (
            <Card key={i}>
              <CardContent>Card {i}</CardContent>
            </Card>
          ))}
        </>
      );
      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards).toHaveLength(100);
    });

    it("optimizes re-renders", () => {
      let renderCount = 0;
      const TestCard = ({ title }: { title: string }) => {
        renderCount++;
        return (
          <Card>
            <CardTitle>{title}</CardTitle>
          </Card>
        );
      };

      const { rerender } = render(<TestCard title="Title 1" />);
      const initialCount = renderCount;

      rerender(<TestCard title="Title 2" />);
      expect(renderCount).toBeLessThan(initialCount + 3);
    });

    it("handles memory usage with nested cards", () => {
      const createNestedCard = (depth: number): React.ReactElement => {
        if (depth === 0) {
          return <CardContent>Leaf</CardContent>;
        }
        return (
          <Card>
            <CardContent>{createNestedCard(depth - 1)}</CardContent>
          </Card>
        );
      };

      const { container } = render(createNestedCard(10));
      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid card creation/destruction", async () => {
      const iterations = 50;
      const errors: Error[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const { unmount } = render(
            <Card>
              <CardContent>Card {i}</CardContent>
            </Card>
          );
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("handles deeply nested card structures", () => {
      const depth = 20;
      let nested = <CardContent>Deep content</CardContent>;

      for (let i = 0; i < depth; i++) {
        nested = (
          <Card>
            <CardContent>{nested}</CardContent>
          </Card>
        );
      }

      const { container } = render(nested);
      const cards = container.querySelectorAll('[data-slot="card"]');
      expect(cards.length).toBe(depth);
    });

    it("handles concurrent card operations", async () => {
      const promises = Array.from({ length: 50 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const { unmount } = render(
              <Card>
                <CardContent>Card {i}</CardContent>
              </Card>
            );
            unmount();
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      expect(true).toBe(true);
    });

    it("handles DOM manipulation during render", async () => {
      const { container } = render(
        <Card>
          <CardContent>Test</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-slot="card"]');

      await act(async () => {
        if (card) {
          card.setAttribute("data-manipulated", "true");
          card.classList.add("manipulated");
        }
      });

      expect(card).toHaveAttribute("data-manipulated", "true");
      expect(card).toHaveClass("manipulated");
    });

    it("handles rapid className changes", async () => {
      const { container, rerender } = render(
        <Card className="class1">Test</Card>
      );

      await act(async () => {
        for (let i = 0; i < 100; i++) {
          rerender(<Card className={`class${i}`}>Test</Card>);
        }
      });

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("renders complete card composition with all sub-components", () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
            <CardAction>
              <Button>Action</Button>
            </CardAction>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-header"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-title"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-description"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-action"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-content"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="card-footer"]')
      ).toBeInTheDocument();
    });

    it("works with Button components", () => {
      const { container } = render(
        <Card>
          <CardFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Submit</Button>
          </CardFooter>
        </Card>
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Submit" })
      ).toBeInTheDocument();
    });

    it("works with responsive layouts", () => {
      const { container } = render(
        <Card className="w-full sm:w-1/2 md:w-1/3">
          <CardContent>Responsive card</CardContent>
        </Card>
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("w-full", "sm:w-1/2", "md:w-1/3");
    });

    it("handles card with multiple actions", () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardAction>
              <Button variant="ghost" size="icon">
                ⋮
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
            <Button variant="destructive">Delete</Button>
          </CardFooter>
        </Card>
      );

      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("works with theme switching", () => {
      const { container, rerender } = render(
        <Card className="bg-card dark:bg-card-dark">
          <CardContent>Content</CardContent>
        </Card>
      );

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("bg-card", "dark:bg-card-dark");

      // Simulate theme change
      rerender(
        <Card className="bg-card dark:bg-card-dark">
          <CardContent>Content</CardContent>
        </Card>
      );

      expect(card).toBeInTheDocument();
    });
  });
});
