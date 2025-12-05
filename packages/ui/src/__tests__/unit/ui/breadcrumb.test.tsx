/**
 * @file Comprehensive tests for Breadcrumb component system. Includes unit,
 *   accessibility, edge case, and integration tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";

describe("Breadcrumb", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    describe("Breadcrumb (Root)", () => {
      it("renders with default props", () => {
        render(
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        );
        const nav = screen.getByRole("navigation", { name: "breadcrumb" });
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveAttribute("data-slot", "breadcrumb");
      });

      it("applies aria-label attribute", () => {
        render(
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        );
        const nav = screen.getByRole("navigation", { name: "breadcrumb" });
        expect(nav).toHaveAttribute("aria-label", "breadcrumb");
      });

      it("merges custom className", () => {
        const { container } = render(
          <Breadcrumb className="custom-nav">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        );
        const nav = container.querySelector('[data-slot="breadcrumb"]');
        expect(nav).toHaveClass("custom-nav");
      });

      it("spreads additional props", () => {
        render(
          <Breadcrumb data-testid="breadcrumb-nav">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        );
        const nav = screen.getByTestId("breadcrumb-nav");
        expect(nav).toBeInTheDocument();
      });
    });

    describe("BreadcrumbList", () => {
      it("renders with default props", () => {
        const { container } = render(
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        );
        const list = container.querySelector('[data-slot="breadcrumb-list"]');
        expect(list).toBeInTheDocument();
        expect(list?.tagName).toBe("OL");
      });

      it("applies flex layout classes", () => {
        const { container } = render(
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        );
        const list = container.querySelector('[data-slot="breadcrumb-list"]');
        expect(list).toHaveClass("flex", "flex-wrap", "items-center");
      });

      it("applies responsive gap classes", () => {
        const { container } = render(
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        );
        const list = container.querySelector('[data-slot="breadcrumb-list"]');
        expect(list).toHaveClass("gap-1.5", "sm:gap-2.5");
      });

      it("applies text styling classes", () => {
        const { container } = render(
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        );
        const list = container.querySelector('[data-slot="breadcrumb-list"]');
        expect(list).toHaveClass(
          "text-muted-foreground",
          "text-sm",
          "break-words"
        );
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbList className="custom-list">
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        );
        const list = container.querySelector('[data-slot="breadcrumb-list"]');
        expect(list).toHaveClass("custom-list");
      });
    });

    describe("BreadcrumbItem", () => {
      it("renders with default props", () => {
        const { container } = render(
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        );
        const item = container.querySelector('[data-slot="breadcrumb-item"]');
        expect(item).toBeInTheDocument();
        expect(item?.tagName).toBe("LI");
      });

      it("applies inline-flex classes", () => {
        const { container } = render(
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        );
        const item = container.querySelector('[data-slot="breadcrumb-item"]');
        expect(item).toHaveClass("inline-flex", "items-center", "gap-1.5");
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbItem className="custom-item">
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        );
        const item = container.querySelector('[data-slot="breadcrumb-item"]');
        expect(item).toHaveClass("custom-item");
      });
    });

    describe("BreadcrumbLink", () => {
      it("renders as anchor by default", () => {
        const { container } = render(
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        );
        const link = container.querySelector('[data-slot="breadcrumb-link"]');
        expect(link).toBeInTheDocument();
        expect(link?.tagName).toBe("A");
        expect(link).toHaveAttribute("href", "/");
      });

      it("applies hover classes", () => {
        const { container } = render(
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        );
        const link = container.querySelector('[data-slot="breadcrumb-link"]');
        expect(link).toHaveClass("hover:text-foreground", "transition-colors");
      });

      it("renders as child component when asChild=true", () => {
        render(
          <BreadcrumbLink asChild>
            <button>Button Link</button>
          </BreadcrumbLink>
        );
        const button = screen.getByRole("button", { name: "Button Link" });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("data-slot", "breadcrumb-link");
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbLink href="/" className="custom-link">
            Home
          </BreadcrumbLink>
        );
        const link = container.querySelector('[data-slot="breadcrumb-link"]');
        expect(link).toHaveClass("custom-link");
      });

      it("handles href attribute", () => {
        const { container } = render(
          <BreadcrumbLink href="/about">About</BreadcrumbLink>
        );
        const link = container.querySelector('[data-slot="breadcrumb-link"]');
        expect(link).toHaveAttribute("href", "/about");
      });

      it("handles click events", async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();
        const { container } = render(
          <BreadcrumbLink href="/" onClick={handleClick}>
            Home
          </BreadcrumbLink>
        );
        const link = container.querySelector(
          '[data-slot="breadcrumb-link"]'
        ) as HTMLElement;
        await user.click(link);
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });

    describe("BreadcrumbPage", () => {
      it("renders with default props", () => {
        const { container } = render(<BreadcrumbPage>Settings</BreadcrumbPage>);
        const page = container.querySelector('[data-slot="breadcrumb-page"]');
        expect(page).toBeInTheDocument();
        expect(page?.tagName).toBe("SPAN");
        expect(page).toHaveTextContent("Settings");
      });

      it("applies ARIA attributes", () => {
        const { container } = render(<BreadcrumbPage>Settings</BreadcrumbPage>);
        const page = container.querySelector('[data-slot="breadcrumb-page"]');
        expect(page).toHaveAttribute("role", "link");
        expect(page).toHaveAttribute("aria-disabled", "true");
        expect(page).toHaveAttribute("aria-current", "page");
      });

      it("applies text styling classes", () => {
        const { container } = render(<BreadcrumbPage>Settings</BreadcrumbPage>);
        const page = container.querySelector('[data-slot="breadcrumb-page"]');
        expect(page).toHaveClass("text-foreground", "font-normal");
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbPage className="custom-page">Settings</BreadcrumbPage>
        );
        const page = container.querySelector('[data-slot="breadcrumb-page"]');
        expect(page).toHaveClass("custom-page");
      });
    });

    describe("BreadcrumbSeparator", () => {
      it("renders with default ChevronRightIcon", () => {
        const { container } = render(<BreadcrumbSeparator />);
        const separator = container.querySelector(
          '[data-slot="breadcrumb-separator"]'
        );
        expect(separator).toBeInTheDocument();
        expect(separator?.tagName).toBe("LI");
        // Check for SVG icon (ChevronRightIcon renders as SVG)
        const svg = separator?.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });

      it("applies ARIA attributes", () => {
        const { container } = render(<BreadcrumbSeparator />);
        const separator = container.querySelector(
          '[data-slot="breadcrumb-separator"]'
        );
        expect(separator).toHaveAttribute("role", "presentation");
        expect(separator).toHaveAttribute("aria-hidden", "true");
      });

      it("applies SVG size classes", () => {
        const { container } = render(<BreadcrumbSeparator />);
        const separator = container.querySelector(
          '[data-slot="breadcrumb-separator"]'
        );
        expect(separator).toHaveClass("[&>svg]:size-3.5");
      });

      it("renders custom children", () => {
        const { container } = render(
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
        );
        const separator = container.querySelector(
          '[data-slot="breadcrumb-separator"]'
        );
        expect(separator).toHaveTextContent("/");
        // Should not have default icon when children provided
        const svg = separator?.querySelector("svg");
        expect(svg).not.toBeInTheDocument();
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbSeparator className="custom-separator" />
        );
        const separator = container.querySelector(
          '[data-slot="breadcrumb-separator"]'
        );
        expect(separator).toHaveClass("custom-separator");
      });
    });

    describe("BreadcrumbEllipsis", () => {
      it("renders with default props", () => {
        const { container } = render(<BreadcrumbEllipsis />);
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        expect(ellipsis).toBeInTheDocument();
        expect(ellipsis?.tagName).toBe("SPAN");
      });

      it("applies ARIA attributes", () => {
        const { container } = render(<BreadcrumbEllipsis />);
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        expect(ellipsis).toHaveAttribute("role", "presentation");
        expect(ellipsis).toHaveAttribute("aria-hidden", "true");
      });

      it("renders DotsHorizontalIcon", () => {
        const { container } = render(<BreadcrumbEllipsis />);
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        const svg = ellipsis?.querySelector("svg");
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass("size-4");
      });

      it("renders screen reader text", () => {
        const { container } = render(<BreadcrumbEllipsis />);
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        const srText = ellipsis?.querySelector(".sr-only");
        expect(srText).toBeInTheDocument();
        expect(srText).toHaveTextContent("More");
      });

      it("applies size classes", () => {
        const { container } = render(<BreadcrumbEllipsis />);
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        expect(ellipsis).toHaveClass(
          "size-9",
          "flex",
          "items-center",
          "justify-center"
        );
      });

      it("merges custom className", () => {
        const { container } = render(
          <BreadcrumbEllipsis className="custom-ellipsis" />
        );
        const ellipsis = container.querySelector(
          '[data-slot="breadcrumb-ellipsis"]'
        );
        expect(ellipsis).toHaveClass("custom-ellipsis");
      });
    });
  });

  describe("Integration Tests", () => {
    it("renders full breadcrumb composition", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/about">About</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(
        container.querySelector('[data-slot="breadcrumb"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="breadcrumb-list"]')
      ).toBeInTheDocument();
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders breadcrumb with ellipsis", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      expect(
        container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      ).toBeInTheDocument();
      expect(screen.getByText("Current")).toBeInTheDocument();
    });

    it("handles multiple separators", () => {
      const { container } = render(
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/level1">Level 1</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/level2">Level 2</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Level 3</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      );

      const separators = container.querySelectorAll(
        '[data-slot="breadcrumb-separator"]'
      );
      expect(separators).toHaveLength(3);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty children in BreadcrumbList", () => {
      const { container } = render(<BreadcrumbList />);
      const list = container.querySelector('[data-slot="breadcrumb-list"]');
      expect(list).toBeInTheDocument();
    });

    it("handles undefined className", () => {
      const { container } = render(
        <BreadcrumbList className={undefined}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector('[data-slot="breadcrumb-list"]');
      expect(list).toBeInTheDocument();
    });

    it("handles null className", () => {
      const { container } = render(
        <BreadcrumbList className={null as unknown as string}>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      );
      const list = container.querySelector('[data-slot="breadcrumb-list"]');
      expect(list).toBeInTheDocument();
    });

    it("handles BreadcrumbLink without href", () => {
      const { container } = render(<BreadcrumbLink>No Href</BreadcrumbLink>);
      const link = container.querySelector('[data-slot="breadcrumb-link"]');
      expect(link).toBeInTheDocument();
    });

    it("handles BreadcrumbSeparator with null children", () => {
      const { container } = render(
        <BreadcrumbSeparator>{null}</BreadcrumbSeparator>
      );
      const separator = container.querySelector(
        '[data-slot="breadcrumb-separator"]'
      );
      expect(separator).toBeInTheDocument();
      // Should fallback to default icon when children is null
      const svg = separator?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Accessibility Tests", () => {
    it("Breadcrumb has proper ARIA label", () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
      const nav = screen.getByRole("navigation", { name: "breadcrumb" });
      expect(nav).toBeInTheDocument();
    });

    it("BreadcrumbPage has proper ARIA attributes", () => {
      const { container } = render(<BreadcrumbPage>Current</BreadcrumbPage>);
      const page = container.querySelector('[data-slot="breadcrumb-page"]');
      expect(page).toHaveAttribute("role", "link");
      expect(page).toHaveAttribute("aria-disabled", "true");
      expect(page).toHaveAttribute("aria-current", "page");
    });

    it("BreadcrumbSeparator has presentation role", () => {
      const { container } = render(<BreadcrumbSeparator />);
      const separator = container.querySelector(
        '[data-slot="breadcrumb-separator"]'
      );
      expect(separator).toHaveAttribute("role", "presentation");
      expect(separator).toHaveAttribute("aria-hidden", "true");
    });

    it("BreadcrumbEllipsis has screen reader text", () => {
      const { container } = render(<BreadcrumbEllipsis />);
      const ellipsis = container.querySelector(
        '[data-slot="breadcrumb-ellipsis"]'
      );
      const srText = ellipsis?.querySelector(".sr-only");
      expect(srText).toHaveTextContent("More");
    });

    it("maintains semantic HTML structure", () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );

      const nav = container.querySelector("nav");
      const ol = container.querySelector("ol");
      const items = container.querySelectorAll("li");
      expect(nav).toBeInTheDocument();
      expect(ol).toBeInTheDocument();
      expect(items.length).toBeGreaterThan(0);
    });
  });
});
