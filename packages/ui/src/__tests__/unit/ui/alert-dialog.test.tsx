/**
 * @file Comprehensive tests for AlertDialog component. Includes unit,
 *   accessibility, edge case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { raceConditionTester } from "@convergence/test-utils";

/**
 * Test helper component for AlertDialog with configurable handlers.
 *
 * @param props - Component props
 * @param props.onAction - Handler for action button click
 * @param props.onCancel - Handler for cancel button click
 * @param props.defaultOpen - Whether dialog starts open
 * @returns AlertDialog with trigger and content
 */
function TestAlertDialog({
  onAction,
  onCancel,
  defaultOpen = false,
}: {
  onAction?: () => void;
  onCancel?: () => void;
  defaultOpen?: boolean;
}) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger data-testid="trigger">Open Dialog</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Unit Tests", () => {
    it("renders trigger button", () => {
      render(<TestAlertDialog />);

      expect(screen.getByTestId("trigger")).toBeInTheDocument();
      expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    });

    it("opens dialog when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);

      await user.click(screen.getByTestId("trigger"));

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("closes dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("closes dialog when action is clicked", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Continue"));

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("calls action handler when action is clicked", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(<TestAlertDialog defaultOpen onAction={onAction} />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Continue"));

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("calls cancel handler when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<TestAlertDialog defaultOpen onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("renders title and description", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByText("Are you sure?")).toBeInTheDocument();
        expect(
          screen.getByText("This action cannot be undone.")
        ).toBeInTheDocument();
      });
    });

    it("renders header and footer", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const dialog = screen.getByRole("alertdialog");
      expect(
        dialog.querySelector('[data-slot="alert-dialog-header"]')
      ).toBeInTheDocument();
      expect(
        dialog.querySelector('[data-slot="alert-dialog-footer"]')
      ).toBeInTheDocument();
    });

    it("has data-slot attributes", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      expect(screen.getByRole("alertdialog")).toHaveAttribute(
        "data-slot",
        "alert-dialog-content"
      );
    });
  });

  describe("Overlay Tests", () => {
    it("renders overlay when open", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        const overlay = document.querySelector(
          '[data-slot="alert-dialog-overlay"]'
        );
        expect(overlay).toBeInTheDocument();
      });
    });

    it("overlay has correct styling", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        const overlay = document.querySelector(
          '[data-slot="alert-dialog-overlay"]'
        );
        expect(overlay?.className).toContain("bg-black/40");
        expect(overlay?.className).toContain("backdrop-blur-sm");
        expect(overlay?.className).toContain("fixed");
        expect(overlay?.className).toContain("inset-0");
      });
    });
  });

  describe("Accessibility Tests", () => {
    it("has role=alertdialog", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("closes dialog with Escape key", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("traps focus within dialog", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      const actionButton = screen.getByText("Continue");

      // Tab through buttons - order depends on Radix implementation
      await user.tab();
      // Check that focus is on one of the buttons
      const focusedElement = document.activeElement;
      expect(
        focusedElement === cancelButton || focusedElement === actionButton
      ).toBe(true);

      await user.tab();
      // Check again that focus is on one of the buttons
      const focusedElement2 = document.activeElement;
      expect(
        focusedElement2 === cancelButton || focusedElement2 === actionButton
      ).toBe(true);

      // Tab should cycle back (focus trap)
      await user.tab();
      // Focus should stay within dialog
      expect(document.activeElement).not.toBe(document.body);
    });

    it("returns focus to trigger on close", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);

      const trigger = screen.getByTestId("trigger");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });

      expect(trigger).toHaveFocus();
    });

    it("action button is focusable", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const actionButton = screen.getByText("Continue");
      actionButton.focus();
      expect(actionButton).toHaveFocus();
    });

    it("cancel button is focusable", async () => {
      render(<TestAlertDialog defaultOpen />);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();
    });
  });

  describe("Custom Styling Tests", () => {
    it("applies custom className to content", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent className="custom-content">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        const content = screen.getByRole("alertdialog");
        expect(content).toHaveClass("custom-content");
      });
    });

    it("applies custom className to header", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header" data-testid="header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByTestId("header")).toHaveClass("custom-header");
      });
    });

    it("applies custom className to footer", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogFooter className="custom-footer" data-testid="footer">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByTestId("footer")).toHaveClass("custom-footer");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles dialog without title", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogDescription>Just a description</AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("handles dialog without description", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title only</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        expect(screen.getByText("Title only")).toBeInTheDocument();
      });
    });

    it("handles very long content", async () => {
      const longText = "A".repeat(5000);
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{longText}</AlertDialogTitle>
              <AlertDialogDescription>{longText}</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("handles nested content", async () => {
      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription>
                <div>
                  <p>Paragraph 1</p>
                  <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
      });
    });

    it("handles controlled open state", async () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

      rerender(
        <AlertDialog open={true}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("handles onOpenChange callback", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <AlertDialog onOpenChange={onOpenChange}>
          <AlertDialogTrigger data-testid="trigger">Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      );

      await user.click(screen.getByTestId("trigger"));
      expect(onOpenChange).toHaveBeenCalledWith(true);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Security Tests", () => {
    it("does not execute XSS in title", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogTitle>
              {"<script>alert('xss')</script>"}
            </AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      expect(
        screen.getByText("<script>alert('xss')</script>")
      ).toBeInTheDocument();
      alertSpy.mockRestore();
    });

    it("does not execute XSS in description", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent>
            <AlertDialogDescription>
              {"<img src=x onerror=alert('xss')>"}
            </AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it("handles className XSS attempts safely", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(
        <AlertDialog defaultOpen>
          <AlertDialogContent className="onmouseover=alert('xss')">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe("Performance Tests", () => {
    it("does not re-render excessively during open/close", async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      /**
       * Tracks render count for AlertDialog performance testing.
       *
       * @returns TestAlertDialog component
       */
      function CountingDialog() {
        renderCount++;
        return <TestAlertDialog />;
      }

      render(<CountingDialog />);
      const initialCount = renderCount;

      await user.click(screen.getByTestId("trigger"));
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Cancel"));
      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });

      // Should not have excessive re-renders
      expect(renderCount).toBeLessThan(initialCount + 10);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid open/close cycles", async () => {
      const user = userEvent.setup();
      render(<TestAlertDialog />);

      const trigger = screen.getByTestId("trigger");

      for (let i = 0; i < 10; i++) {
        await user.click(trigger);
        await waitFor(() => {
          expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        });

        await user.keyboard("{Escape}");
        await waitFor(() => {
          expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        });
      }

      expect(trigger).toBeInTheDocument();
    });

    it("handles rapid action/cancel clicks", async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      const onCancel = vi.fn();

      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <TestAlertDialog
            defaultOpen
            onAction={onAction}
            onCancel={onCancel}
          />
        );

        await waitFor(() => {
          expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        });

        if (i % 2 === 0) {
          await user.click(screen.getByText("Continue"));
        } else {
          await user.click(screen.getByText("Cancel"));
        }

        await waitFor(() => {
          expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        });

        unmount();
      }

      expect(onAction).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it("handles mount/unmount with dialog open", async () => {
      const errors: Error[] = [];

      for (let i = 0; i < 20; i++) {
        try {
          const { unmount } = render(<TestAlertDialog defaultOpen />);

          await waitFor(() => {
            expect(screen.getByRole("alertdialog")).toBeInTheDocument();
          });

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
          const { unmount } = render(<TestAlertDialog defaultOpen />);
          return unmount;
        },
        30,
        { maxConcurrent: 3, randomDelay: true }
      );

      expect(true).toBe(true);
    });

    it("handles alternating controlled state changes", async () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <AlertDialog open={i % 2 === 0}>
            <AlertDialogContent>
              <AlertDialogTitle>Title {i}</AlertDialogTitle>
            </AlertDialogContent>
          </AlertDialog>
        );
      }

      // Final state should be closed (i=9, 9%2=1, so open=false)
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
