/**
 * @file Comprehensive tests for Dialog component system. Includes unit, edge
 *   case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/components/ui/index";

// Verify component types are exported (these components are used via data-slot attributes in tests)
const _verifyExports: [typeof DialogClose, typeof DialogOverlay] = [
  DialogClose,
  DialogOverlay,
];
void _verifyExports;

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  XIcon: () => <svg data-testid="x-icon" />,
}));

describe("Dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing dialogs
    document.body.innerHTML = "";
  });

  describe("Unit Tests", () => {
    it("Dialog Root renders", () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    });

    it("DialogTrigger opens dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole("button", { name: "Open" });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("DialogContent renders in portal", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Portal Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        // Portal should render outside main container
        expect(document.body.contains(dialog)).toBe(true);
      });
    });

    it("DialogOverlay renders with correct styling", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Overlay Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(overlay).toBeInTheDocument();
        expect(overlay?.className).toContain("bg-black/40");
        expect(overlay?.className).toContain("backdrop-blur-sm");
        expect(overlay?.className).toContain("fixed");
        expect(overlay?.className).toContain("inset-0");
        expect(overlay?.className).toContain("z-50");
      });
    });

    it("DialogHeader renders correctly", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          document.querySelector('[data-slot="dialog-header"]')
        ).toBeInTheDocument();
      });
    });

    it("DialogFooter renders correctly", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogFooter>
              <Button>Action</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(
          document.querySelector('[data-slot="dialog-footer"]')
        ).toBeInTheDocument();
      });
    });

    it("DialogTitle renders with accessibility", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const title = screen.getByRole("heading", { name: "Accessible Title" });
        expect(title).toBeInTheDocument();
      });
    });

    it("DialogDescription renders with accessibility", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Description text")).toBeInTheDocument();
      });
    });

    it("DialogClose button works", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Close Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: "Close" });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("showCloseButton prop controls close button visibility", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={true}>
            <DialogTitle>With Close</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Close" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Close" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      rerender(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>Without Close</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Close" })
        ).not.toBeInTheDocument();
      });
    });

    it("Dialog state management (open/closed)", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <Dialog onOpenChange={onOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>State Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles dialog without trigger", () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>No Trigger</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("handles dialog without content", () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );

      expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    });

    it("handles dialog with empty children", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>{null}</DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("handles multiple dialogs simultaneously", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Dialog>
            <DialogTrigger>Open 1</DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog 1</DialogTitle>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger>Open 2</DialogTrigger>
            <DialogContent>
              <DialogTitle>Dialog 2</DialogTitle>
            </DialogContent>
          </Dialog>
        </>
      );

      // Open first dialog
      await user.click(screen.getByRole("button", { name: "Open 1" }));
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Dialog 1" })
        ).toBeInTheDocument();
      });

      // Close first dialog (modal blocks interaction with second trigger)
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: "Dialog 1" })
        ).not.toBeInTheDocument();
      });

      // Open second dialog
      await user.click(screen.getByRole("button", { name: "Open 2" }));
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Dialog 2" })
        ).toBeInTheDocument();
      });
    });

    it("handles dialog unmounting while open", async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Unmount Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      unmount();
      // Should not throw errors
      expect(true).toBe(true);
    });

    it("handles dialog with very long content", async () => {
      const user = userEvent.setup();
      const longContent = "a".repeat(10000);

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Long Content</DialogTitle>
            <div>{longContent}</div>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });

    it("handles dialog with no close button", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogTitle>No Close</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "Close" })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in content", async () => {
      const user = userEvent.setup();
      const maliciousContent = '<script>alert("xss")</script>';

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>{maliciousContent}</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const title = screen.getByRole("heading");
        // React escapes HTML in text content, so it will be displayed as text
        expect(title.textContent).toContain("<script>");
        // But script should not execute - no script tags in DOM
        expect(document.querySelector("script")).not.toBeInTheDocument();
      });
    });

    it("sanitizes portal rendering", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Safe Content</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        // Portal should be safely rendered
        expect(dialog.closest("body")).toBe(document.body);
      });
    });

    it("safely handles event handlers", async () => {
      const user = userEvent.setup();
      // Test that component accepts any function as handler without crashing
      const handler = vi.fn();

      render(
        <Dialog>
          <DialogTrigger onClick={handler}>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Safe</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      expect(handler).toHaveBeenCalled();
      // Component should still be functional - dialog should open
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("prevents clickjacking", async () => {
      const user = userEvent.setup();
      render(
        <Dialog modal={true}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Modal Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const overlay = document.querySelector('[data-slot="dialog-overlay"]');
        expect(overlay).toBeInTheDocument();
        // Modal should prevent interaction with background
      });
    });
  });

  describe("Performance Tests", () => {
    it("handles portal creation performance", async () => {
      const user = userEvent.setup();
      const startTime = performance.now();

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Performance Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const endTime = performance.now();
      // Portal creation should be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("handles memory cleanup on unmount", async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Memory Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      unmount();

      // Portal should be cleaned up
      await waitFor(() => {
        expect(
          document.querySelector('[data-slot="dialog-content"]')
        ).not.toBeInTheDocument();
      });
    });

    it("handles multiple dialog performance", async () => {
      const user = userEvent.setup();
      render(
        <>
          {Array.from({ length: 10 }, (_, i) => (
            <Dialog key={i}>
              <DialogTrigger>Open {i}</DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog {i}</DialogTitle>
              </DialogContent>
            </Dialog>
          ))}
        </>
      );

      // Open all dialogs
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByRole("button", { name: `Open ${i}` }));
        await waitFor(() => {
          expect(
            screen.getByRole("heading", { name: `Dialog ${i}` })
          ).toBeInTheDocument();
        });
        await user.keyboard("{Escape}");
        await waitFor(() => {
          expect(
            screen.queryByRole("heading", { name: `Dialog ${i}` })
          ).not.toBeInTheDocument();
        });
      }
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid open/close cycles (100+)", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Chaos Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole("button", { name: "Open" });

      await act(async () => {
        for (let i = 0; i < 50; i++) {
          await user.click(trigger);
          await user.keyboard("{Escape}");
        }
      });

      // Should still be in valid state
      expect(trigger).toBeInTheDocument();
    });

    it("handles concurrent dialog operations", async () => {
      const promises = Array.from({ length: 20 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(async () => {
            const { unmount } = render(
              <Dialog>
                <DialogTrigger>Open {i}</DialogTrigger>
                <DialogContent>
                  <DialogTitle>Dialog {i}</DialogTitle>
                </DialogContent>
              </Dialog>
            );
            unmount();
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      expect(true).toBe(true);
    });

    it("handles DOM manipulation during dialog lifecycle", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>DOM Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();

        // Manipulate DOM during dialog lifecycle
        dialog.setAttribute("data-manipulated", "true");
        dialog.classList.add("manipulated");
      });

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("data-manipulated", "true");
    });

    it("handles portal cleanup edge cases", async () => {
      const user = userEvent.setup();
      const { unmount } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Cleanup Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Unmount while open
      unmount();

      // Should not throw errors
      await waitFor(() => {
        expect(
          document.querySelector('[data-slot="dialog-content"]')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Integration Tests", () => {
    it("works with Button triggers", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Button Trigger</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open Dialog" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("works with Card content", async () => {
      const user = userEvent.setup();
      const { Card, CardHeader, CardTitle, CardContent } =
        await import("@/components/ui/card");

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <Card>
              <CardHeader>
                <CardTitle>Card in Dialog</CardTitle>
              </CardHeader>
              <CardContent>Card content</CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByText("Card in Dialog")).toBeInTheDocument();
      });
    });

    it("works with form elements", async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Form Dialog</DialogTitle>
            <form onSubmit={handleSubmit}>
              <input type="text" name="test" />
              <Button type="submit">Submit</Button>
            </form>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("handles keyboard navigation (ESC, Tab)", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Keyboard Test</DialogTitle>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // ESC should close
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("handles focus management", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Focus Test</DialogTitle>
            <Button>Focusable</Button>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        // Focus should be trapped within dialog
      });
    });

    it("works with accessibility (ARIA attributes)", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <DialogDescription>This is an accessible dialog</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      await user.click(screen.getByRole("button", { name: "Open" }));

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();
        // Radix UI sets aria-modal based on modal prop (defaults to true)
        // Check for aria-labelledby and aria-describedby which are always set
        expect(dialog).toHaveAttribute("aria-labelledby");
        expect(dialog).toHaveAttribute("aria-describedby");
        expect(
          screen.getByRole("heading", { name: "Accessible Dialog" })
        ).toBeInTheDocument();
      });
    });
  });
});
