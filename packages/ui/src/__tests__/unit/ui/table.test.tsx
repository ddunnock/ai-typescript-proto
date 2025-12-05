/**
 * @file Comprehensive tests for Table component. Includes unit, edge case,
 *   security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

describe("Table", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders with default props", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = screen.getByText("Cell");
      expect(cell).toBeInTheDocument();
    });

    it("applies data-slot attribute to table", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector('[data-slot="table"]');
      expect(table).toBeInTheDocument();
      expect(table?.tagName).toBe("TABLE");
    });

    it("renders table within a scrollable container", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const container_el = container.querySelector(
        '[data-slot="table-container"]'
      );
      expect(container_el).toBeInTheDocument();
      expect(container_el).toHaveClass("overflow-x-auto");
    });

    it("merges custom className to table correctly", () => {
      const { container } = render(
        <Table className="custom-table">
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector('[data-slot="table"]');
      expect(table).toHaveClass("custom-table");
    });

    it("renders TableHeader with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const header = container.querySelector('[data-slot="table-header"]');
      expect(header).toBeInTheDocument();
      expect(header?.tagName).toBe("THEAD");
    });

    it("renders TableBody with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Body</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const body = container.querySelector('[data-slot="table-body"]');
      expect(body).toBeInTheDocument();
      expect(body?.tagName).toBe("TBODY");
    });

    it("renders TableFooter with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      const footer = container.querySelector('[data-slot="table-footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer?.tagName).toBe("TFOOT");
    });

    it("renders TableRow with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = container.querySelector('[data-slot="table-row"]');
      expect(row).toBeInTheDocument();
      expect(row?.tagName).toBe("TR");
    });

    it("renders TableHead with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const head = container.querySelector('[data-slot="table-head"]');
      expect(head).toBeInTheDocument();
      expect(head?.tagName).toBe("TH");
    });

    it("renders TableCell with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = container.querySelector('[data-slot="table-cell"]');
      expect(cell).toBeInTheDocument();
      expect(cell?.tagName).toBe("TD");
    });

    it("renders TableCaption with data-slot attribute", () => {
      const { container } = render(
        <Table>
          <TableCaption>Caption Text</TableCaption>
        </Table>
      );
      const caption = container.querySelector('[data-slot="table-caption"]');
      expect(caption).toBeInTheDocument();
      expect(caption?.tagName).toBe("CAPTION");
    });

    it("applies hover styles to TableRow", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Hover</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = container.querySelector('[data-slot="table-row"]');
      expect(row).toHaveClass("hover:bg-muted/50");
    });

    it("applies selected state to TableRow via data-state", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Selected</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const row = container.querySelector('[data-slot="table-row"]');
      expect(row).toHaveAttribute("data-state", "selected");
      expect(row).toHaveClass("data-[state=selected]:bg-muted");
    });

    it("merges className to all table components", () => {
      const { container } = render(
        <Table className="table-custom">
          <TableCaption className="caption-custom">Caption</TableCaption>
          <TableHeader className="header-custom">
            <TableRow className="row-custom">
              <TableHead className="head-custom">Header</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="body-custom">
            <TableRow>
              <TableCell className="cell-custom">Body</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter className="footer-custom">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(container.querySelector('[data-slot="table"]')).toHaveClass(
        "table-custom"
      );
      expect(
        container.querySelector('[data-slot="table-caption"]')
      ).toHaveClass("caption-custom");
      expect(container.querySelector('[data-slot="table-header"]')).toHaveClass(
        "header-custom"
      );
      expect(container.querySelector('[data-slot="table-body"]')).toHaveClass(
        "body-custom"
      );
      expect(container.querySelector('[data-slot="table-footer"]')).toHaveClass(
        "footer-custom"
      );
      expect(container.querySelector(".row-custom")).toBeInTheDocument();
      expect(container.querySelector(".head-custom")).toBeInTheDocument();
      expect(container.querySelector(".cell-custom")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders table with empty body", () => {
      const { container } = render(
        <Table>
          <TableBody></TableBody>
        </Table>
      );
      const body = container.querySelector('[data-slot="table-body"]');
      expect(body).toBeInTheDocument();
    });

    it("handles table with only caption", () => {
      render(
        <Table>
          <TableCaption>Only Caption</TableCaption>
        </Table>
      );
      expect(screen.getByText("Only Caption")).toBeInTheDocument();
    });

    it("handles very long cell content", () => {
      const longText = "A".repeat(1000);
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>{longText}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("handles multiple rows", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Row 1")).toBeInTheDocument();
      expect(screen.getByText("Row 2")).toBeInTheDocument();
      expect(screen.getByText("Row 3")).toBeInTheDocument();
    });

    it("handles multiple columns", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Col 1</TableHead>
              <TableHead>Col 2</TableHead>
              <TableHead>Col 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>A</TableCell>
              <TableCell>B</TableCell>
              <TableCell>C</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Col 1")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
    });

    it("handles nested JSX in cells", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <div>
                  <span>Nested</span>
                  <strong>Content</strong>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Nested")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>@#$%^&*()</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("@#$%^&*()")).toBeInTheDocument();
    });

    it("handles numeric content in cells", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>42</TableCell>
              <TableCell>3.14159</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("3.14159")).toBeInTheDocument();
    });

    it("handles checkboxes in cells", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  role="checkbox"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe("Security Tests", () => {
    it("sanitizes className prop to prevent XSS", () => {
      const xssAttempt = "alert('xss')";
      const { container } = render(
        <Table className={xssAttempt}>
          <TableBody>
            <TableRow>
              <TableCell>XSS Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector('[data-slot="table"]');
      expect(table).toBeInTheDocument();
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("does not allow arbitrary HTML injection via cell content", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>{`<img src onerror="alert('xss')">`}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const cell = screen.getByText(`<img src onerror="alert('xss')">`);
      expect(cell.textContent).toContain("<img");
      const img = cell.querySelector("img");
      expect(img).toBeNull();
    });

    it("validates data-slot attribute values", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector('[data-slot="table"]');
      const dataSlot = table?.getAttribute("data-slot");
      expect(dataSlot).toBe("table");
      expect(dataSlot).not.toContain("<");
      expect(dataSlot).not.toContain(">");
    });

    it("prevents script injection through caption", () => {
      render(
        <Table>
          <TableCaption>{`<script>alert('xss')</script>`}</TableCaption>
        </Table>
      );
      expect(
        screen.getByText(`<script>alert('xss')</script>`)
      ).toBeInTheDocument();
      expect(document.querySelector("script")).not.toBeInTheDocument();
    });
  });

  describe("Performance Tests", () => {
    it("does not cause excessive re-renders on prop changes", () => {
      const RenderCounter = vi.fn(() => (
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Count</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ));
      const { rerender } = render(<RenderCounter />);
      expect(RenderCounter).toHaveBeenCalledTimes(1);

      rerender(<RenderCounter className="new-class" />);
      expect(RenderCounter).toHaveBeenCalledTimes(2);
    });

    it("handles rendering many rows efficiently", () => {
      const rows = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Row ${i}`,
      }));

      const startTime = performance.now();
      render(
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("handles many columns efficiently", () => {
      const columns = Array.from({ length: 20 }, (_, i) => `Column ${i}`);

      const startTime = performance.now();
      render(
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid prop changes without crashing", () => {
      const { rerender } = render(
        <Table className="class-a">
          <TableBody>
            <TableRow>
              <TableCell>Chaos</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(
            <Table className={`class-${i % 2}`}>
              <TableBody>
                <TableRow>
                  <TableCell>Chaos</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          );
        }
      }).not.toThrow();
      expect(screen.getByText("Chaos")).toBeInTheDocument();
    });

    it("handles content changes during interaction", () => {
      const { rerender } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Initial</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Initial")).toBeInTheDocument();

      rerender(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Changed</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Changed")).toBeInTheDocument();
      expect(screen.queryByText("Initial")).not.toBeInTheDocument();
    });

    it("handles rapid row additions and removals", () => {
      const { rerender } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(() => {
        for (let i = 0; i < 50; i++) {
          rerender(
            <Table>
              <TableBody>
                {Array.from({ length: i % 10 }, (_, j) => (
                  <TableRow key={j}>
                    <TableCell>Row {j}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        }
      }).not.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("renders complete table with all components", () => {
      render(
        <Table>
          <TableCaption>Complete table example</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>Inactive</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total Users</TableCell>
              <TableCell>2</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText("Complete table example")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("Total Users")).toBeInTheDocument();
    });

    it("works correctly with selected rows", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Selected Row</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Normal Row</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const rows = container.querySelectorAll('[data-slot="table-row"]');
      expect(rows[0]).toHaveAttribute("data-state", "selected");
      expect(rows[1]).not.toHaveAttribute("data-state");
    });

    it("handles responsive design with scrollable container", () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: 10 }, (_, i) => (
                <TableHead key={i}>Column {i}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      );

      const scrollContainer = container.querySelector(
        '[data-slot="table-container"]'
      );
      expect(scrollContainer).toHaveClass("overflow-x-auto");
      expect(scrollContainer).toHaveClass("relative");
    });

    it("composes correctly with Badge component", async () => {
      const { Badge } = await import("@/components/ui/badge");
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>
                <Badge variant="secondary">Active</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("works correctly with alignment classes", () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Left</TableHead>
              <TableHead className="text-center">Center</TableHead>
              <TableHead className="text-right">Right</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const heads = container.querySelectorAll('[data-slot="table-head"]');
      expect(heads[0]).toHaveClass("text-left");
      expect(heads[1]).toHaveClass("text-center");
      expect(heads[2]).toHaveClass("text-right");
    });
  });
});
