/**
 * @file Comprehensive tests for Accordion component. Includes unit,
 *   accessibility, edge case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { raceConditionTester } from "@convergence/test-utils";

/**
 * Test helper component for accordion with configurable type.
 *
 * @param props - Component props
 * @param props.type - Accordion type (single or multiple)
 * @param props.collapsible - Whether accordion is collapsible
 * @param props.defaultValue - Default expanded value(s)
 * @returns Configured accordion with test items
 */
function TestAccordion({
  type = "single",
  collapsible = true,
  defaultValue,
}: {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
}) {
  if (type === "multiple") {
    return (
      <Accordion
        type="multiple"
        defaultValue={defaultValue as string[] | undefined}
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Section 3</AccordionTrigger>
          <AccordionContent>Content for section 3</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible={collapsible}
      defaultValue={defaultValue as string | undefined}
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content for section 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content for section 2</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section 3</AccordionTrigger>
        <AccordionContent>Content for section 3</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders all accordion items", () => {
      render(<TestAccordion />);

      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
      expect(screen.getByText("Section 3")).toBeInTheDocument();
    });

    it("renders collapsed by default", () => {
      render(<TestAccordion />);

      // Content should not be visible
      expect(
        screen.queryByText("Content for section 1")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Content for section 2")
      ).not.toBeInTheDocument();
    });

    it("expands on trigger click", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      await user.click(screen.getByText("Section 1"));

      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });
    });

    it("collapses on second click (collapsible mode)", async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      await user.click(screen.getByText("Section 1"));
      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Section 1"));
      await waitFor(() => {
        expect(
          screen.queryByText("Content for section 1")
        ).not.toBeInTheDocument();
      });
    });

    it("only one item expands in single mode", async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="single" />);

      await user.click(screen.getByText("Section 1"));
      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Section 2"));
      await waitFor(() => {
        expect(
          screen.queryByText("Content for section 1")
        ).not.toBeInTheDocument();
        expect(screen.getByText("Content for section 2")).toBeInTheDocument();
      });
    });

    it("multiple items can expand in multiple mode", async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="multiple" />);

      await user.click(screen.getByText("Section 1"));
      await user.click(screen.getByText("Section 2"));

      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
        expect(screen.getByText("Content for section 2")).toBeInTheDocument();
      });
    });

    it("renders chevron icon", () => {
      render(<TestAccordion />);

      const triggers = screen.getAllByRole("button");
      triggers.forEach((trigger) => {
        const svg = trigger.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });

    it("has correct data-slot attributes", () => {
      render(<TestAccordion />);

      expect(
        document.querySelector('[data-slot="accordion"]')
      ).toBeInTheDocument();
      expect(
        document.querySelectorAll('[data-slot="accordion-item"]')
      ).toHaveLength(3);
      expect(
        document.querySelectorAll('[data-slot="accordion-trigger"]')
      ).toHaveLength(3);
    });

    it("renders with default expanded item", async () => {
      render(<TestAccordion type="single" defaultValue="item-2" />);

      await waitFor(() => {
        expect(screen.getByText("Content for section 2")).toBeInTheDocument();
      });
    });

    it("renders with multiple default expanded items", async () => {
      render(
        <TestAccordion type="multiple" defaultValue={["item-1", "item-3"]} />
      );

      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
        expect(screen.getByText("Content for section 3")).toBeInTheDocument();
        expect(
          screen.queryByText("Content for section 2")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Icon Animation Tests", () => {
    it("chevron rotates when expanded", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toBeInTheDocument();

      await user.click(trigger!);

      await waitFor(() => {
        // The trigger should have data-state="open"
        expect(trigger).toHaveAttribute("data-state", "open");
      });
    });

    it("chevron returns to original position when collapsed", async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      const trigger = screen.getByText("Section 1").closest("button");

      await user.click(trigger!);
      await waitFor(() => {
        expect(trigger).toHaveAttribute("data-state", "open");
      });

      await user.click(trigger!);
      await waitFor(() => {
        expect(trigger).toHaveAttribute("data-state", "closed");
      });
    });
  });

  describe("Accessibility Tests", () => {
    it("triggers have button role", () => {
      render(<TestAccordion />);

      const triggers = screen.getAllByRole("button");
      expect(triggers).toHaveLength(3);
    });

    it("supports keyboard navigation - Tab", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      const triggers = screen.getAllByRole("button");

      await user.tab();
      expect(triggers[0]).toHaveFocus();

      await user.tab();
      expect(triggers[1]).toHaveFocus();

      await user.tab();
      expect(triggers[2]).toHaveFocus();
    });

    it("supports keyboard navigation - Enter to expand", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      await user.tab();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });
    });

    it("supports keyboard navigation - Space to expand", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      await user.tab();
      await user.keyboard(" ");

      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });
    });

    it("has aria-expanded state", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger!);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("has aria-controls linking trigger to content", () => {
      render(<TestAccordion />);

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toHaveAttribute("aria-controls");
    });

    it("has focus visible styling class", () => {
      render(<TestAccordion />);

      const trigger = screen.getByText("Section 1").closest("button");
      expect(trigger).toHaveClass("focus-visible:ring-[3px]");
    });
  });

  describe("Disabled State Tests", () => {
    it("disabled item cannot be expanded", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" disabled>
            <AccordionTrigger>Disabled Section</AccordionTrigger>
            <AccordionContent>This should not appear</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText("Disabled Section").closest("button");
      expect(trigger).toHaveAttribute("disabled");

      await user.click(trigger!);

      await waitFor(() => {
        expect(
          screen.queryByText("This should not appear")
        ).not.toBeInTheDocument();
      });
    });

    it("disabled trigger has reduced opacity", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" disabled>
            <AccordionTrigger>Disabled Section</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText("Disabled Section").closest("button");
      expect(trigger).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Custom Styling Tests", () => {
    it("applies custom className to AccordionItem", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-item">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(document.querySelector(".custom-item")).toBeInTheDocument();
    });

    it("applies custom className to AccordionTrigger", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-trigger">
              Section
            </AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText("Section").closest("button");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("applies custom className to AccordionContent inner div", async () => {
      render(
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent className="custom-content">
              Content
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await waitFor(() => {
        expect(screen.getByText("Content")).toBeInTheDocument();
      });

      expect(screen.getByText("Content").closest("div")).toHaveClass(
        "custom-content"
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles empty content", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Empty Section</AccordionTrigger>
            <AccordionContent></AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await user.click(screen.getByText("Empty Section"));

      // Should not crash
      expect(
        document.querySelector('[data-slot="accordion-content"]')
      ).toBeInTheDocument();
    });

    it("handles very long trigger text", () => {
      const longText = "A".repeat(1000);
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>{longText}</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("handles very long content", async () => {
      const user = userEvent.setup();
      const longContent = "B".repeat(10000);
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>{longContent}</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await user.click(screen.getByText("Section"));

      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });

    it("handles single accordion item", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Only Section</AccordionTrigger>
            <AccordionContent>Only Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("Only Section")).toBeInTheDocument();
    });

    it("handles many accordion items", () => {
      const items = Array.from({ length: 50 }, (_, i) => i);
      render(
        <Accordion type="single" collapsible>
          {items.map((i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>Section {i}</AccordionTrigger>
              <AccordionContent>Content {i}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      );

      expect(screen.getByText("Section 0")).toBeInTheDocument();
      expect(screen.getByText("Section 49")).toBeInTheDocument();
    });

    it("handles special characters in content", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              {"<script>alert('xss')</script>"}
            </AccordionTrigger>
            <AccordionContent>&amp; &lt; &gt; &quot;</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await user.click(screen.getByText("<script>alert('xss')</script>"));

      expect(screen.getByText('& < > "')).toBeInTheDocument();
    });
  });

  describe("Security Tests", () => {
    it("does not execute XSS in trigger", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              {"<img src=x onerror=alert('xss')>"}
            </AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(alertSpy).not.toHaveBeenCalled();
      expect(
        screen.getByText("<img src=x onerror=alert('xss')>")
      ).toBeInTheDocument();
      alertSpy.mockRestore();
    });

    it("does not execute XSS in content", async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>
              {"<script>alert('xss')</script>"}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      await user.click(screen.getByText("Section"));

      await waitFor(() => {
        expect(
          screen.getByText("<script>alert('xss')</script>")
        ).toBeInTheDocument();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it("handles className XSS attempts safely", () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="onmouseover=alert('xss')">
            <AccordionTrigger>Section</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe("Performance Tests", () => {
    it("does not re-render excessively", async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      /**
       * Tracks render count for accordion performance testing.
       *
       * @returns TestAccordion component
       */
      function CountingAccordion() {
        renderCount++;
        return <TestAccordion />;
      }

      render(<CountingAccordion />);
      const initialCount = renderCount;

      // Expand and collapse
      await user.click(screen.getByText("Section 1"));
      await waitFor(() => {
        expect(screen.getByText("Content for section 1")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Section 1"));
      await waitFor(() => {
        expect(
          screen.queryByText("Content for section 1")
        ).not.toBeInTheDocument();
      });

      expect(renderCount).toBeLessThan(initialCount + 10);
    });

    it("handles rapid item expansions efficiently", async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="single" />);

      const startTime = performance.now();

      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText("Section 1"));
        await user.click(screen.getByText("Section 2"));
        await user.click(screen.getByText("Section 3"));
      }

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid expand/collapse cycles", async () => {
      const user = userEvent.setup();
      render(<TestAccordion collapsible />);

      const trigger = screen.getByText("Section 1");

      for (let i = 0; i < 20; i++) {
        await user.click(trigger);
      }

      // Should end in a valid state
      const triggerButton = trigger.closest("button");
      expect(triggerButton?.getAttribute("data-state")).toMatch(
        /^(open|closed)$/
      );
    });

    it("handles rapid tab switching", async () => {
      const user = userEvent.setup();
      render(<TestAccordion type="single" />);

      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText("Section 1"));
        await user.click(screen.getByText("Section 2"));
        await user.click(screen.getByText("Section 3"));
      }

      // Should be in valid state
      expect(
        document.querySelector('[data-slot="accordion"]')
      ).toBeInTheDocument();
    });

    it("handles mount/unmount cycles", async () => {
      const errors: Error[] = [];

      for (let i = 0; i < 30; i++) {
        try {
          const { unmount } = render(<TestAccordion defaultValue="item-1" />);
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("survives race condition testing", async () => {
      await raceConditionTester(
        () => {
          const { unmount } = render(<TestAccordion defaultValue="item-1" />);
          return unmount;
        },
        30,
        { maxConcurrent: 5 }
      );

      expect(true).toBe(true);
    });

    it("handles alternating type changes", () => {
      const { rerender } = render(<TestAccordion type="single" />);

      for (let i = 0; i < 10; i++) {
        rerender(<TestAccordion type={i % 2 === 0 ? "multiple" : "single"} />);
      }

      expect(
        document.querySelector('[data-slot="accordion"]')
      ).toBeInTheDocument();
    });

    it("handles rapid keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<TestAccordion />);

      // Rapid tab and enter
      for (let i = 0; i < 10; i++) {
        await user.tab();
        await user.keyboard("{Enter}");
      }

      expect(
        document.querySelector('[data-slot="accordion"]')
      ).toBeInTheDocument();
    });

    it("handles controlled value changes", async () => {
      /**
       * Controlled accordion for testing external state management.
       *
       * @returns Accordion with external value controls
       */
      function ControlledAccordion() {
        const [value, setValue] = React.useState<string>("");

        return (
          <>
            <button onClick={() => setValue("item-1")}>Open 1</button>
            <button onClick={() => setValue("item-2")}>Open 2</button>
            <button onClick={() => setValue("")}>Close all</button>
            <Accordion
              type="single"
              collapsible
              value={value}
              onValueChange={setValue}
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>Content 1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>Content 2</AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        );
      }

      const user = userEvent.setup();
      render(<ControlledAccordion />);

      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText("Open 1"));
        await user.click(screen.getByText("Open 2"));
        await user.click(screen.getByText("Close all"));
      }

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    });
  });
});

// Need to import React for the controlled component test
import React from "react";
