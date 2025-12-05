/**
 * @file Tests for Glass Accordion component. Covers glass-specific props: glow,
 *   and re-exported sub-components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/glass/accordion";
import { GLOW_CLASSES } from "./test-utils";

describe("GlassAccordion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders accordion with items", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("Trigger 1")).toBeInTheDocument();
    });

    it("renders multiple items", () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>First Content</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Second Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("Glow Prop", () => {
    it("does not apply glow by default", () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>No Glow</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = container.querySelector("button");
      expect(trigger?.className).not.toContain(GLOW_CLASSES.accordion);
    });

    it("applies glow class when glow=true", () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger glow>Glowing</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = container.querySelector("button");
      expect(trigger?.className).toContain("data-[state=open]:shadow-md");
      expect(trigger?.className).toContain(
        "data-[state=open]:shadow-purple-500/20"
      );
    });

    it("does not apply glow when glow=false", () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger glow={false}>No Glow</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = container.querySelector("button");
      expect(trigger?.className).not.toContain(
        "data-[state=open]:shadow-purple-500/20"
      );
    });
  });

  describe("Styling", () => {
    it("merges custom className on trigger", () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="custom-trigger">
              Styled
            </AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = container.querySelector("button");
      expect(trigger).toHaveClass("custom-trigger");
    });

    it("merges custom className on item", () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-item">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const item = container.querySelector("[data-state]");
      expect(item).toHaveClass("custom-item");
    });
  });

  describe("Re-exports", () => {
    it("exports Accordion component", () => {
      expect(Accordion).toBeDefined();
    });

    it("exports AccordionItem component", () => {
      expect(AccordionItem).toBeDefined();
    });

    it("exports AccordionTrigger component", () => {
      expect(AccordionTrigger).toBeDefined();
    });

    it("exports AccordionContent component", () => {
      expect(AccordionContent).toBeDefined();
    });
  });

  describe("Integration", () => {
    it("expands on trigger click", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Click Me</AccordionTrigger>
            <AccordionContent>Hidden Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      // Content is initially not rendered or hidden
      const initialContent = screen.queryByText("Hidden Content");
      expect(
        initialContent === null || !initialContent.checkVisibility()
      ).toBeTruthy();

      // Click to expand
      await user.click(screen.getByText("Click Me"));

      // Content should now be visible
      expect(screen.getByText("Hidden Content")).toBeVisible();
    });

    it("collapses on second click when collapsible", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Toggle</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText("Toggle");

      // Expand
      await user.click(trigger);
      expect(screen.getByText("Content")).toBeVisible();

      // Collapse
      await user.click(trigger);
      const collapsedContent = screen.queryByText("Content");
      expect(
        collapsedContent === null || !collapsedContent.checkVisibility()
      ).toBeTruthy();
    });

    it("handles keyboard navigation", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Keyboard</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      const trigger = screen.getByText("Keyboard");
      trigger.focus();

      // Press Enter to expand
      await user.keyboard("{Enter}");
      expect(screen.getByText("Content")).toBeVisible();
    });

    it("supports multiple type accordion", async () => {
      const user = userEvent.setup();
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>First</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Second</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      );

      // Expand both
      await user.click(screen.getByText("First"));
      await user.click(screen.getByText("Second"));

      // Both should be visible
      expect(screen.getByText("Content 1")).toBeVisible();
      expect(screen.getByText("Content 2")).toBeVisible();
    });
  });
});
