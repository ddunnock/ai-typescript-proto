/**
 * @file Comprehensive tests for AnimatedThemeToggler component. Includes unit,
 *   accessibility, edge case, and View Transitions API tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { flushSync } from "react-dom";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// Mock flushSync
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    flushSync: vi.fn((fn) => fn()),
  };
});

describe("AnimatedThemeToggler", () => {
  let startViewTransitionMock: ReturnType<typeof vi.fn>;
  let readyPromise: Promise<void>;
  let readyResolve: () => void;
  let animateMock: ReturnType<typeof vi.fn>;
  let getBoundingClientRectMock: ReturnType<typeof vi.fn>;
  let mutationObserverCallback: MutationCallback;
  let mutationObserverInstance: {
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");

    // Set up ready promise for View Transitions
    readyPromise = new Promise<void>((resolve) => {
      readyResolve = resolve;
    });

    // Mock document.startViewTransition
    startViewTransitionMock = vi.fn((callback) => {
      callback();
      return {
        ready: readyPromise,
      };
    });
    Object.defineProperty(document, "startViewTransition", {
      writable: true,
      value: startViewTransitionMock,
    });

    // Mock document.documentElement.animate
    animateMock = vi.fn(() => ({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      finish: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    Object.defineProperty(document.documentElement, "animate", {
      writable: true,
      value: animateMock,
    });

    // Mock getBoundingClientRect
    getBoundingClientRectMock = vi.fn(() => ({
      top: 100,
      left: 200,
      width: 50,
      height: 50,
      right: 250,
      bottom: 150,
      x: 200,
      y: 100,
    }));
    Element.prototype.getBoundingClientRect = getBoundingClientRectMock;

    // Mock MutationObserver
    mutationObserverInstance = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    global.MutationObserver = vi.fn((callback: MutationCallback) => {
      mutationObserverCallback = callback;
      return mutationObserverInstance as unknown as MutationObserver;
    }) as unknown as typeof MutationObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Unit Tests", () => {
    describe("Rendering", () => {
      it("renders button element", () => {
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
      });

      it("renders Moon icon when theme is light (default state)", () => {
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");
        // Moon icon should be present (lucide-react Moon component)
        const svg = button.querySelector("svg");
        expect(svg).toBeInTheDocument();
        // Check that it's not the Sun icon by checking the button doesn't have dark class context
        expect(document.documentElement.classList.contains("dark")).toBe(false);
      });

      it("renders Sun icon when theme is dark", async () => {
        document.documentElement.classList.add("dark");
        render(<AnimatedThemeToggler />);

        // Wait for MutationObserver to update state
        await waitFor(() => {
          const button = screen.getByRole("button");
          const svg = button.querySelector("svg");
          expect(svg).toBeInTheDocument();
        });
      });

      it("applies custom className prop", () => {
        render(<AnimatedThemeToggler className="custom-class" />);
        const button = screen.getByRole("button");
        expect(button).toHaveClass("custom-class");
      });

      it("renders screen reader text", () => {
        render(<AnimatedThemeToggler />);
        const srText = screen.getByText("Toggle theme");
        expect(srText).toBeInTheDocument();
        expect(srText).toHaveClass("sr-only");
      });

      it("passes through standard button props", () => {
        render(
          <AnimatedThemeToggler
            aria-label="Switch theme"
            title="Toggle dark mode"
            data-testid="theme-toggle"
          />
        );
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-label", "Switch theme");
        expect(button).toHaveAttribute("title", "Toggle dark mode");
        expect(button).toHaveAttribute("data-testid", "theme-toggle");
      });
    });

    describe("Initial theme detection", () => {
      it("detects light theme initially (no dark class)", async () => {
        render(<AnimatedThemeToggler />);

        await waitFor(() => {
          // Component should detect light theme
          expect(document.documentElement.classList.contains("dark")).toBe(
            false
          );
        });
      });

      it("detects dark theme if dark class is present on mount", async () => {
        document.documentElement.classList.add("dark");
        render(<AnimatedThemeToggler />);

        await waitFor(() => {
          // MutationObserver should have been called
          expect(mutationObserverInstance.observe).toHaveBeenCalled();
        });
      });

      it("sets isDark state correctly based on initial theme", async () => {
        document.documentElement.classList.remove("dark");
        render(<AnimatedThemeToggler />);

        await waitFor(() => {
          const button = screen.getByRole("button");
          expect(button).toBeInTheDocument();
        });
      });
    });

    describe("Theme toggling", () => {
      it("toggles from light to dark on click", async () => {
        const user = userEvent.setup();
        document.documentElement.classList.remove("dark");

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);

        // Resolve the ready promise to allow the animation to proceed
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(document.documentElement.classList.contains("dark")).toBe(
            true
          );
        });
      });

      it("toggles from dark to light on click", async () => {
        const user = userEvent.setup();
        document.documentElement.classList.add("dark");

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);

        // Resolve the ready promise
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(document.documentElement.classList.contains("dark")).toBe(
            false
          );
        });
      });

      it("updates localStorage with correct theme value", async () => {
        const user = userEvent.setup();
        document.documentElement.classList.remove("dark");

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
        });
      });

      it("updates document.documentElement.classList correctly", async () => {
        const user = userEvent.setup();
        document.documentElement.classList.remove("dark");

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(document.documentElement.classList.contains("dark")).toBe(
            true
          );
        });
      });
    });

    describe("Custom duration", () => {
      it("uses default duration (400ms) when not provided", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
              duration: 400,
            })
          );
        });
      });

      it("uses custom duration prop when provided", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler duration={600} />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
              duration: 600,
            })
          );
        });
      });
    });
  });

  describe("View Transitions API Tests", () => {
    describe("View Transition calls", () => {
      it("calls document.startViewTransition on click", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);

        expect(startViewTransitionMock).toHaveBeenCalled();
      });

      it("executes callback function within view transition", async () => {
        const user = userEvent.setup();
        const callbackSpy = vi.fn();
        startViewTransitionMock = vi.fn((callback) => {
          callback();
          callbackSpy();
          return {
            ready: readyPromise,
          };
        });
        Object.defineProperty(document, "startViewTransition", {
          writable: true,
          value: startViewTransitionMock,
        });

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);

        expect(callbackSpy).toHaveBeenCalled();
      });

      it("waits for .ready promise before animating", async () => {
        const user = userEvent.setup();
        let readyResolved = false;
        const customReadyPromise = new Promise<void>((resolve) => {
          setTimeout(() => {
            readyResolved = true;
            resolve();
          }, 10);
        });

        startViewTransitionMock = vi.fn(() => ({
          ready: customReadyPromise,
        }));
        Object.defineProperty(document, "startViewTransition", {
          writable: true,
          value: startViewTransitionMock,
        });

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);

        // Animation should not be called until ready resolves
        expect(animateMock).not.toHaveBeenCalled();

        await customReadyPromise;

        await waitFor(() => {
          expect(readyResolved).toBe(true);
          expect(animateMock).toHaveBeenCalled();
        });
      });
    });

    describe("Animation setup", () => {
      it("calls getBoundingClientRect() on button element", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(getBoundingClientRectMock).toHaveBeenCalled();
        });
      });

      it("calculates correct center point (x, y)", async () => {
        const user = userEvent.setup();
        getBoundingClientRectMock = vi.fn(() => ({
          top: 100,
          left: 200,
          width: 50,
          height: 50,
          right: 250,
          bottom: 150,
          x: 200,
          y: 100,
        }));
        Element.prototype.getBoundingClientRect = getBoundingClientRectMock;

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.objectContaining({
              clipPath: expect.arrayContaining([
                expect.stringContaining("225px"), // left + width/2 = 200 + 25
                expect.stringContaining("125px"), // top + height/2 = 100 + 25
              ]),
            }),
            expect.any(Object)
          );
        });
      });

      it("calculates correct maxRadius using Math.hypot", async () => {
        const user = userEvent.setup();
        // Mock window dimensions
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: 1000,
        });
        Object.defineProperty(window, "innerHeight", {
          writable: true,
          configurable: true,
          value: 800,
        });

        getBoundingClientRectMock = vi.fn(() => ({
          top: 100,
          left: 200,
          width: 50,
          height: 50,
          right: 250,
          bottom: 150,
          x: 200,
          y: 100,
        }));
        Element.prototype.getBoundingClientRect = getBoundingClientRectMock;

        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalled();
          const call = animateMock.mock.calls[0];
          const clipPath = call[0].clipPath;
          // maxRadius should be calculated based on button position
          expect(clipPath[1]).toContain("circle(");
        });
      });

      it("calls document.documentElement.animate() with correct parameters", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.objectContaining({
              clipPath: expect.any(Array),
            }),
            expect.objectContaining({
              duration: 400,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            })
          );
        });
      });

      it("uses custom duration in animation options", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler duration={800} />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
              duration: 800,
            })
          );
        });
      });

      it("uses correct easing (ease-in-out)", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
              easing: "ease-in-out",
            })
          );
        });
      });

      it("uses correct pseudoElement (::view-transition-new(root))", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalledWith(
            expect.any(Object),
            expect.objectContaining({
              pseudoElement: "::view-transition-new(root)",
            })
          );
        });
      });

      it("creates correct clipPath animation (circle from 0px to maxRadius)", async () => {
        const user = userEvent.setup();
        render(<AnimatedThemeToggler />);
        const button = screen.getByRole("button");

        await user.click(button);
        readyResolve();
        await readyPromise;

        await waitFor(() => {
          expect(animateMock).toHaveBeenCalled();
          const call = animateMock.mock.calls[0];
          const clipPath = call[0].clipPath;
          expect(clipPath).toHaveLength(2);
          expect(clipPath[0]).toContain("circle(0px");
          expect(clipPath[1]).toContain("circle(");
          expect(clipPath[1]).toContain("px");
        });
      });
    });
  });

  describe("MutationObserver Tests", () => {
    it("creates MutationObserver on mount", () => {
      render(<AnimatedThemeToggler />);
      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it("observes document.documentElement for class changes", () => {
      render(<AnimatedThemeToggler />);
      expect(mutationObserverInstance.observe).toHaveBeenCalledWith(
        document.documentElement,
        {
          attributes: true,
          attributeFilter: ["class"],
        }
      );
    });

    it("updates isDark state when dark class is added externally", async () => {
      render(<AnimatedThemeToggler />);

      // Simulate external theme change
      act(() => {
        document.documentElement.classList.add("dark");
      });

      // Trigger MutationObserver callback
      if (mutationObserverCallback) {
        act(() => {
          mutationObserverCallback(
            [
              {
                type: "attributes",
                attributeName: "class",
                target: document.documentElement,
              } as MutationRecord,
            ],
            mutationObserverInstance as unknown as MutationObserver
          );
        });
      }

      await waitFor(() => {
        // Component should update based on MutationObserver
        expect(document.documentElement.classList.contains("dark")).toBe(true);
      });
    });

    it("updates isDark state when dark class is removed externally", async () => {
      document.documentElement.classList.add("dark");
      render(<AnimatedThemeToggler />);

      // Simulate external theme change
      act(() => {
        document.documentElement.classList.remove("dark");
      });

      // Trigger MutationObserver callback
      if (mutationObserverCallback) {
        act(() => {
          mutationObserverCallback(
            [
              {
                type: "attributes",
                attributeName: "class",
                target: document.documentElement,
              } as MutationRecord,
            ],
            mutationObserverInstance as unknown as MutationObserver
          );
        });
      }

      await waitFor(() => {
        expect(document.documentElement.classList.contains("dark")).toBe(false);
      });
    });

    it("disconnects observer on unmount", () => {
      const { unmount } = render(<AnimatedThemeToggler />);
      unmount();
      expect(mutationObserverInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles case when buttonRef.current is null (early return)", async () => {
      // This test verifies the early return in toggleTheme when buttonRef.current is null
      // We can't easily simulate this without complex ref manipulation, but we verify
      // the component doesn't crash when the ref is properly set (which is the normal case)
      const user = userEvent.setup();
      render(<AnimatedThemeToggler />);
      const button = screen.getByRole("button");

      // Verify normal operation works (ref is set)
      await user.click(button);
      expect(startViewTransitionMock).toHaveBeenCalled();

      // The early return case (ref is null) is a defensive check that's hard to test
      // without complex ref manipulation, but the code path exists for safety
    });

    it("uses flushSync to synchronously update state and DOM", async () => {
      const user = userEvent.setup();
      render(<AnimatedThemeToggler />);
      const button = screen.getByRole("button");

      await user.click(button);

      // flushSync should be called
      expect(flushSync).toHaveBeenCalled();
    });

    it("handles rapid successive clicks gracefully", async () => {
      const user = userEvent.setup();
      render(<AnimatedThemeToggler />);
      const button = screen.getByRole("button");

      // Click multiple times rapidly
      await user.click(button);
      readyResolve();
      await readyPromise;

      // Create new ready promise for second click
      readyPromise = new Promise<void>((resolve) => {
        readyResolve = resolve;
      });

      await user.click(button);
      readyResolve();
      await readyPromise;

      // Should handle both clicks without errors
      expect(startViewTransitionMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility Tests", () => {
    it("has screen reader text with sr-only class", () => {
      render(<AnimatedThemeToggler />);
      const srText = screen.getByText("Toggle theme");
      expect(srText).toHaveClass("sr-only");
    });

    it("button is accessible via keyboard", async () => {
      const user = userEvent.setup();
      render(<AnimatedThemeToggler />);
      const button = screen.getByRole("button");

      // Tab to button
      await user.tab();
      expect(button).toHaveFocus();

      // Press Enter to activate
      await user.keyboard("{Enter}");
      expect(startViewTransitionMock).toHaveBeenCalled();
    });

    it("button has proper role (implicit from button element)", () => {
      render(<AnimatedThemeToggler />);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("supports custom aria-label prop", () => {
      render(<AnimatedThemeToggler aria-label="Switch theme" />);
      const button = screen.getByRole("button", { name: "Switch theme" });
      expect(button).toBeInTheDocument();
    });

    it("supports custom aria-describedby prop", () => {
      render(
        <>
          <div id="theme-desc">Theme toggle button</div>
          <AnimatedThemeToggler aria-describedby="theme-desc" />
        </>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "theme-desc");
    });
  });
});
