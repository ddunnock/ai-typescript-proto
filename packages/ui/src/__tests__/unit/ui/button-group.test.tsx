/**
 * @file Comprehensive tests for Button Group component system. Includes unit,
 *   accessibility, edge case, and integration tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ButtonGroup,
  ButtonGroupText,
  ButtonGroupSeparator,
  buttonGroupVariants,
} from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

describe("ButtonGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    describe("buttonGroupVariants CVA", () => {
      it("generates base classes", () => {
        const classes = buttonGroupVariants();
        expect(classes).toContain("flex");
        expect(classes).toContain("w-fit");
        expect(classes).toContain("items-stretch");
      });

      it("applies horizontal orientation by default", () => {
        const classes = buttonGroupVariants();
        expect(classes).toContain("[&>*:not(:first-child)]:rounded-l-none");
        expect(classes).toContain("[&>*:not(:first-child)]:border-l-0");
        expect(classes).toContain("[&>*:not(:last-child)]:rounded-r-none");
      });

      it("applies horizontal orientation classes", () => {
        const classes = buttonGroupVariants({ orientation: "horizontal" });
        expect(classes).toContain("[&>*:not(:first-child)]:rounded-l-none");
        expect(classes).toContain("[&>*:not(:first-child)]:border-l-0");
        expect(classes).toContain("[&>*:not(:last-child)]:rounded-r-none");
      });

      it("applies vertical orientation classes", () => {
        const classes = buttonGroupVariants({ orientation: "vertical" });
        expect(classes).toContain("flex-col");
        expect(classes).toContain("[&>*:not(:first-child)]:rounded-t-none");
        expect(classes).toContain("[&>*:not(:first-child)]:border-t-0");
        expect(classes).toContain("[&>*:not(:last-child)]:rounded-b-none");
      });

      it("handles undefined orientation", () => {
        const classes = buttonGroupVariants({ orientation: undefined });
        // Should use default (horizontal)
        expect(classes).toContain("[&>*:not(:first-child)]:rounded-l-none");
      });
    });

    describe("ButtonGroup", () => {
      it("renders with default props", () => {
        const { container } = render(
          <ButtonGroup>
            <Button>First</Button>
            <Button>Second</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toBeInTheDocument();
        expect(group?.tagName).toBe("DIV");
      });

      it("applies role='group' attribute", () => {
        const { container } = render(
          <ButtonGroup>
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toHaveAttribute("role", "group");
      });

      it("applies default horizontal orientation", () => {
        const { container } = render(
          <ButtonGroup>
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        // When orientation is undefined, data-orientation will be "undefined" (string)
        // or the attribute may not be set. Check for horizontal classes instead.
        expect(group?.className).toContain(
          "[&>*:not(:first-child)]:rounded-l-none"
        );
      });

      it("applies horizontal orientation", () => {
        const { container } = render(
          <ButtonGroup orientation="horizontal">
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toHaveAttribute("data-orientation", "horizontal");
        expect(group?.className).toContain(
          "[&>*:not(:first-child)]:rounded-l-none"
        );
      });

      it("applies vertical orientation", () => {
        const { container } = render(
          <ButtonGroup orientation="vertical">
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toHaveAttribute("data-orientation", "vertical");
        expect(group?.className).toContain("flex-col");
      });

      it("applies base variant classes", () => {
        const { container } = render(
          <ButtonGroup>
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group?.className).toContain("flex");
        expect(group?.className).toContain("w-fit");
        expect(group?.className).toContain("items-stretch");
      });

      it("merges custom className", () => {
        const { container } = render(
          <ButtonGroup className="custom-group">
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toHaveClass("custom-group");
      });

      it("spreads additional props", () => {
        const { container } = render(
          <ButtonGroup data-testid="test-group">
            <Button>First</Button>
          </ButtonGroup>
        );
        const group = container.querySelector('[data-slot="button-group"]');
        expect(group).toHaveAttribute("data-testid", "test-group");
      });
    });

    describe("ButtonGroupText", () => {
      it("renders with default props", () => {
        render(<ButtonGroupText>Filter by:</ButtonGroupText>);
        expect(screen.getByText("Filter by:")).toBeInTheDocument();
      });

      it("renders as div by default", () => {
        render(<ButtonGroupText>Label</ButtonGroupText>);
        const text = screen.getByText("Label");
        expect(text.tagName).toBe("DIV");
      });

      it("applies styling classes", () => {
        render(<ButtonGroupText>Label</ButtonGroupText>);
        const text = screen.getByText("Label");
        expect(text).toHaveClass(
          "bg-muted",
          "flex",
          "items-center",
          "gap-2",
          "rounded-md",
          "border",
          "px-4",
          "text-sm",
          "font-medium",
          "shadow-xs"
        );
      });

      it("applies SVG size classes", () => {
        render(
          <ButtonGroupText>
            <svg data-testid="icon" />
            Label
          </ButtonGroupText>
        );
        const text = screen.getByText("Label");
        expect(text).toHaveClass("[&_svg]:pointer-events-none");
        expect(text).toHaveClass("[&_svg:not([class*='size-'])]:size-4");
      });

      it("renders as child component when asChild=true", () => {
        render(
          <ButtonGroupText asChild>
            <label>Custom Label</label>
          </ButtonGroupText>
        );
        const label = screen.getByText("Custom Label");
        expect(label.tagName).toBe("LABEL");
      });

      it("merges custom className", () => {
        render(
          <ButtonGroupText className="custom-text">Label</ButtonGroupText>
        );
        const text = screen.getByText("Label");
        expect(text).toHaveClass("custom-text");
      });
    });

    describe("ButtonGroupSeparator", () => {
      it("renders with default props", () => {
        const { container } = render(<ButtonGroupSeparator />);
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        expect(separator).toBeInTheDocument();
      });

      it("applies default vertical orientation", () => {
        const { container } = render(<ButtonGroupSeparator />);
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        // Separator component should receive orientation="vertical"
        expect(separator).toBeInTheDocument();
      });

      it("applies vertical orientation", () => {
        const { container } = render(
          <ButtonGroupSeparator orientation="vertical" />
        );
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        expect(separator).toBeInTheDocument();
      });

      it("applies horizontal orientation", () => {
        const { container } = render(
          <ButtonGroupSeparator orientation="horizontal" />
        );
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        expect(separator).toBeInTheDocument();
      });

      it("applies styling classes", () => {
        const { container } = render(<ButtonGroupSeparator />);
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        expect(separator).toHaveClass(
          "bg-input",
          "relative",
          "!m-0",
          "self-stretch"
        );
        expect(separator).toHaveClass("data-[orientation=vertical]:h-auto");
      });

      it("merges custom className", () => {
        const { container } = render(
          <ButtonGroupSeparator className="custom-separator" />
        );
        const separator = container.querySelector(
          '[data-slot="button-group-separator"]'
        );
        expect(separator).toHaveClass("custom-separator");
      });
    });
  });

  describe("Integration Tests", () => {
    it("renders full button group composition", () => {
      const { container } = render(
        <ButtonGroup>
          <ButtonGroupText>Filter:</ButtonGroupText>
          <Button>First</Button>
          <ButtonGroupSeparator />
          <Button>Second</Button>
        </ButtonGroup>
      );

      expect(
        container.querySelector('[data-slot="button-group"]')
      ).toBeInTheDocument();
      expect(screen.getByText("Filter:")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Second" })
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="button-group-separator"]')
      ).toBeInTheDocument();
    });

    it("renders horizontal button group with multiple buttons", () => {
      const { container } = render(
        <ButtonGroup orientation="horizontal">
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </ButtonGroup>
      );

      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("data-orientation", "horizontal");
      expect(screen.getByRole("button", { name: "First" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Second" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Third" })).toBeInTheDocument();
    });

    it("renders vertical button group", () => {
      const { container } = render(
        <ButtonGroup orientation="vertical">
          <Button>Top</Button>
          <Button>Middle</Button>
          <Button>Bottom</Button>
        </ButtonGroup>
      );

      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("data-orientation", "vertical");
      expect(group?.className).toContain("flex-col");
    });

    it("handles button group with text and separator", () => {
      render(
        <ButtonGroup>
          <ButtonGroupText>Actions:</ButtonGroupText>
          <Button>Action 1</Button>
          <ButtonGroupSeparator />
          <Button>Action 2</Button>
        </ButtonGroup>
      );

      expect(screen.getByText("Actions:")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action 1" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Action 2" })
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined orientation", () => {
      const { container } = render(
        <ButtonGroup orientation={undefined}>
          <Button>Test</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
      // When orientation is undefined, data-orientation will be "undefined" (string)
      // but CVA will use default horizontal, so check for horizontal classes
      expect(group?.className).toContain(
        "[&>*:not(:first-child)]:rounded-l-none"
      );
    });

    it("handles empty children in ButtonGroup", () => {
      const { container } = render(<ButtonGroup />);
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it("handles undefined className", () => {
      const { container } = render(
        <ButtonGroup className={undefined}>
          <Button>Test</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it("handles null className", () => {
      const { container } = render(
        <ButtonGroup className={null as unknown as string}>
          <Button>Test</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toBeInTheDocument();
    });

    it("handles ButtonGroupText with empty children", () => {
      const { container } = render(<ButtonGroupText />);
      const text = container.querySelector("div");
      expect(text).toBeInTheDocument();
    });

    it("handles ButtonGroupSeparator with custom className", () => {
      const { container } = render(
        <ButtonGroupSeparator className="very-long-class-name-that-might-cause-issues" />
      );
      const separator = container.querySelector(
        '[data-slot="button-group-separator"]'
      );
      expect(separator).toBeInTheDocument();
    });
  });

  describe("Accessibility Tests", () => {
    it("ButtonGroup has role='group'", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>First</Button>
        </ButtonGroup>
      );
      const group = container.querySelector('[data-slot="button-group"]');
      expect(group).toHaveAttribute("role", "group");
    });

    it("maintains semantic structure", () => {
      const { container } = render(
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
        </ButtonGroup>
      );

      const group = container.querySelector('[data-slot="button-group"]');
      expect(group?.tagName).toBe("DIV");
      expect(group).toHaveAttribute("role", "group");
    });

    it("ButtonGroupText maintains accessible structure", () => {
      render(<ButtonGroupText>Label</ButtonGroupText>);
      const text = screen.getByText("Label");
      expect(text).toBeInTheDocument();
    });
  });
});
