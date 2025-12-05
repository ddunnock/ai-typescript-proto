/**
 * @file Tests for Glass Table component. Covers glass-specific props: glow, and
 *   full table composition with all sub-components.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/glass/table";

describe("GlassTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders table with content", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Data")).toBeInTheDocument();
    });

    it("renders table with TableHeader", () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
      expect(screen.getByText("Header")).toBeInTheDocument();
    });

    it("renders table with TableBody", () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Cell")).toBeInTheDocument();
    });

    it("renders table with TableFooter", () => {
      render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("renders table with TableCaption", () => {
      render(
        <Table>
          <TableCaption>Table Caption</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByText("Table Caption")).toBeInTheDocument();
    });

    it("renders full table composition", () => {
      render(
        <Table>
          <TableCaption>Full Table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Item 1</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2}>Total: 1</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );
      expect(screen.getByText("Full Table")).toBeInTheDocument();
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Total: 1")).toBeInTheDocument();
    });
  });

  describe("Glow Prop", () => {
    it("applies default styles without glow", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector("table");
      expect(table).toHaveClass(
        "border-glass-border",
        "rounded-lg",
        "border",
        "bg-glass-bg/50",
        "backdrop-blur-sm"
      );
      expect(table).not.toHaveClass("shadow-lg", "shadow-purple-500/20");
    });

    it("applies glow effect when glow is true", () => {
      const { container } = render(
        <Table glow>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector("table");
      expect(table).toHaveClass("shadow-lg", "shadow-purple-500/20");
    });

    it("does not apply glow effect when glow is false", () => {
      const { container } = render(
        <Table glow={false}>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector("table");
      expect(table).not.toHaveClass("shadow-lg", "shadow-purple-500/20");
    });
  });

  describe("Styling", () => {
    it("merges custom className with glass styles", () => {
      const { container } = render(
        <Table className="custom-class">
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector("table");
      expect(table).toHaveClass("custom-class");
      expect(table).toHaveClass(
        "border-glass-border",
        "rounded-lg",
        "border",
        "bg-glass-bg/50",
        "backdrop-blur-sm"
      );
    });

    it("applies glass base classes", () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector("table");
      expect(table).toHaveClass(
        "border-glass-border",
        "rounded-lg",
        "border",
        "bg-glass-bg/50",
        "backdrop-blur-sm"
      );
    });
  });

  describe("Re-exports", () => {
    it("exports TableHeader", () => {
      expect(TableHeader).toBeDefined();
    });

    it("exports TableBody", () => {
      expect(TableBody).toBeDefined();
    });

    it("exports TableFooter", () => {
      expect(TableFooter).toBeDefined();
    });

    it("exports TableRow", () => {
      expect(TableRow).toBeDefined();
    });

    it("exports TableHead", () => {
      expect(TableHead).toBeDefined();
    });

    it("exports TableCell", () => {
      expect(TableCell).toBeDefined();
    });

    it("exports TableCaption", () => {
      expect(TableCaption).toBeDefined();
    });
  });

  describe("Integration", () => {
    it("forwards ref correctly", () => {
      const ref = React.createRef<HTMLTableElement>();
      render(
        <Table ref={ref}>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(ref.current).toBeInstanceOf(HTMLTableElement);
    });

    it("works with base Table props", () => {
      const { container } = render(
        <Table data-testid="table">
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      const table = container.querySelector('[data-testid="table"]');
      expect(table).toBeInTheDocument();
    });
  });
});
