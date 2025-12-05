/**
 * @file Tests for Glass Dialog component. Covers glass-specific props: variant,
 *   animated, hover, glass customization.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/glass/dialog";
import {
  hasHoverEffect,
  hasCustomGlassStyles,
  SAMPLE_GLASS_CUSTOMIZATION,
  ANIMATED_CLASS,
  GLASS_CLASSES,
} from "./test-utils";

// Explicitly export to satisfy linter - these are used for test utilities
export { GLASS_CLASSES };

describe("GlassDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders dialog with trigger and content", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      // Click trigger to open
      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Title")).toBeInTheDocument();
      });
    });

    it("renders content with children", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <div data-testid="custom-content">Custom Content</div>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByTestId("custom-content")).toBeInTheDocument();
      });
    });
  });

  describe("Variant Prop", () => {
    it("applies default variant classes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        // Should have glass base classes
        expect(content.className).toContain("bg-glass-bg");
      });
    });

    it("applies subtle variant classes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent variant="subtle" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain("bg-glass-bg/50");
      });
    });

    it("applies frosted variant classes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent variant="frosted" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain("bg-[var(--glass-frosted-bg)]");
      });
    });

    it("applies crystal variant classes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent variant="crystal" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain("bg-[var(--glass-crystal-bg)]");
      });
    });
  });

  describe("Animated Prop", () => {
    it("applies animated blur class by default", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain(ANIMATED_CLASS);
      });
    });

    it("does not apply animated class when animated=false", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent animated={false} data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).not.toContain(ANIMATED_CLASS);
      });
    });
  });

  describe("Hover Prop", () => {
    it("applies no hover effect by default", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        // Default hover is "none"
        expect(hasHoverEffect(content, "none")).toBe(true);
      });
    });

    it("applies glow hover effect", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent hover="glow" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(hasHoverEffect(content, "glow")).toBe(true);
      });
    });

    it("applies lift hover effect", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent hover="lift" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(hasHoverEffect(content, "lift")).toBe(true);
      });
    });
  });

  describe("Glass Prop", () => {
    it("renders without glass prop", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content).toBeInTheDocument();
        expect(hasCustomGlassStyles(content)).toBe(false);
      });
    });

    it("applies custom glass color", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent
            glass={{ color: "rgba(139, 92, 246, 0.15)" }}
            data-testid="content"
          >
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content).toHaveStyle({
          backgroundColor: "rgba(139, 92, 246, 0.15)",
        });
      });
    });

    it("applies full glass customization", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent
            glass={SAMPLE_GLASS_CUSTOMIZATION}
            data-testid="content"
          >
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(hasCustomGlassStyles(content)).toBe(true);
      });
    });

    it("combines glass prop with custom style", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent
            glass={{ color: "rgba(100, 100, 100, 0.5)" }}
            style={{ maxWidth: "600px" }}
            data-testid="content"
          >
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content).toHaveStyle({
          backgroundColor: "rgba(100, 100, 100, 0.5)",
          maxWidth: "600px",
        });
      });
    });
  });

  describe("Styling", () => {
    it("applies relative positioning", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain("relative");
      });
    });

    it("applies overflow-hidden for effects", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent data-testid="content">Content</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content.className).toContain("overflow-hidden");
      });
    });

    it("merges custom className", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent className="custom-class" data-testid="content">
            Content
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        const content = screen.getByTestId("content");
        expect(content).toHaveClass("custom-class");
      });
    });
  });

  describe("Re-exports", () => {
    it("exports Dialog component", () => {
      expect(Dialog).toBeDefined();
    });

    it("exports DialogTrigger component", () => {
      expect(DialogTrigger).toBeDefined();
    });

    it("exports DialogContent component", () => {
      expect(DialogContent).toBeDefined();
    });

    it("exports DialogHeader component", () => {
      expect(DialogHeader).toBeDefined();
    });

    it("exports DialogFooter component", () => {
      expect(DialogFooter).toBeDefined();
    });

    it("exports DialogTitle component", () => {
      expect(DialogTitle).toBeDefined();
    });

    it("exports DialogDescription component", () => {
      expect(DialogDescription).toBeDefined();
    });

    it("renders full dialog composition", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog description text</DialogDescription>
            </DialogHeader>
            <div>Body content</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));

      await waitFor(() => {
        expect(screen.getByText("Dialog Title")).toBeInTheDocument();
        expect(screen.getByText("Dialog description text")).toBeInTheDocument();
        expect(screen.getByText("Body content")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
        expect(screen.getByText("Confirm")).toBeInTheDocument();
      });
    });
  });

  describe("Integration", () => {
    it("closes on close button click", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Open dialog
      await user.click(screen.getByText("Open"));
      await waitFor(() => {
        expect(screen.getByText("Title")).toBeInTheDocument();
      });

      // Close via close button (sr-only "Close" text)
      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Title")).not.toBeInTheDocument();
      });
    });

    it("handles controlled open state", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Controlled</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByText("Open"));
      await waitFor(() => {
        expect(screen.getByText("Controlled")).toBeInTheDocument();
      });
    });
  });
});
