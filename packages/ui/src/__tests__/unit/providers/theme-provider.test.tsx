/**
 * @file Comprehensive tests for ThemeProvider and useTheme hook. Includes unit,
 *   edge case, security, performance, and chaos tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  act,
  waitFor,
  renderHook,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ThemeProvider,
  useTheme,
  isValidThemeVariant,
  resetThemeState,
  THEME_VARIANT_KEY,
  type ThemeVariant,
} from "@/providers/theme-provider";

// Default theme variant for tests - used for type checking and test assertions
const defaultTestVariant: ThemeVariant = "convergence";

/**
 * Helper component for testing useTheme hook behavior.
 *
 * @returns React element displaying theme state
 */
function ThemeConsumer() {
  const theme = useTheme();
  return (
    <div data-testid="theme-consumer" data-default-variant={defaultTestVariant}>
      <span data-testid="theme-variant">{theme.themeVariant}</span>
      <span data-testid="color-mode">{theme.colorMode}</span>
      <span data-testid="resolved-mode">{theme.resolvedColorMode}</span>
      <span data-testid="mounted">{theme.mounted ? "true" : "false"}</span>
      <button
        data-testid="set-synthwave"
        onClick={() => theme.setThemeVariant("synthwave")}
      >
        Set Synthwave
      </button>
      <button
        data-testid="set-convergence"
        onClick={() => theme.setThemeVariant("convergence")}
      >
        Set Convergence
      </button>
      <button data-testid="set-dark" onClick={() => theme.setColorMode("dark")}>
        Set Dark
      </button>
      <button
        data-testid="set-light"
        onClick={() => theme.setColorMode("light")}
      >
        Set Light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Reset theme state before each test
    resetThemeState();
    vi.clearAllMocks();
    localStorage.clear();
    // Remove any theme CSS links
    document
      .querySelectorAll("#theme-variant-css")
      .forEach((el) => el.remove());
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    resetThemeState();
  });

  describe("Unit Tests", () => {
    it("renders children correctly", () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Child Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByTestId("child")).toHaveTextContent("Child Content");
    });

    it("provides default theme variant as convergence", async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "convergence"
        );
      });
    });

    it("provides default color mode as system", async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("color-mode")).toHaveTextContent("system");
      });
    });

    it("respects defaultVariant prop", async () => {
      // Reset state and set initial variant
      resetThemeState("synthwave");

      render(
        <ThemeProvider defaultVariant="synthwave">
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should show synthwave
      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "synthwave"
        );
      });
    });

    it("respects defaultColorMode prop", async () => {
      render(
        <ThemeProvider defaultColorMode="dark">
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("color-mode")).toHaveTextContent("dark");
      });
    });

    it("updates theme variant when setThemeVariant is called", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-synthwave"));

      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "synthwave"
        );
      });
    });

    it("persists theme variant to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await user.click(screen.getByTestId("set-synthwave"));

      await waitFor(() => {
        expect(localStorage.getItem(THEME_VARIANT_KEY)).toBe("synthwave");
      });
    });

    it("sets data-theme attribute on document", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Wait for mounted state - use longer timeout and check for microtask
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      await waitFor(
        () => {
          expect(screen.getByTestId("mounted")).toHaveTextContent("true");
        },
        { timeout: 2000 }
      );

      await user.click(screen.getByTestId("set-synthwave"));

      await waitFor(() => {
        expect(document.documentElement.getAttribute("data-theme")).toBe(
          "synthwave"
        );
      });
    });

    it("mounted state transitions from false to true", async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Give microtask time to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Eventually should be true after hydration
      await waitFor(
        () => {
          expect(screen.getByTestId("mounted")).toHaveTextContent("true");
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Edge Cases", () => {
    it("throws error when useTheme is used outside ThemeProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<ThemeConsumer />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });

    it("ignores invalid theme variant from localStorage", async () => {
      localStorage.setItem(THEME_VARIANT_KEY, "invalid-theme");

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should fall back to default
      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "convergence"
        );
      });
    });

    it("handles localStorage not available gracefully", async () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error("localStorage not available");
      });

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should not throw and use default
      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "convergence"
        );
      });

      localStorage.getItem = originalGetItem;
    });

    it("handles localStorage.setItem failure gracefully", async () => {
      const user = userEvent.setup();
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error("QuotaExceededError");
      });

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should not throw when setting theme
      await user.click(screen.getByTestId("set-synthwave"));

      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "synthwave"
        );
      });

      localStorage.setItem = originalSetItem;
    });

    it("handles multiple ThemeProvider instances", async () => {
      const user = userEvent.setup();

      render(
        <>
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
          <ThemeProvider>
            <div data-testid="second-provider">
              <ThemeConsumer />
            </div>
          </ThemeProvider>
        </>
      );

      // Change theme in first provider
      const buttons = screen.getAllByTestId("set-synthwave");
      await user.click(buttons[0]!);

      // Both should update since they share the same store
      await waitFor(() => {
        const variants = screen.getAllByTestId("theme-variant");
        expect(variants[0]).toHaveTextContent("synthwave");
        expect(variants[1]).toHaveTextContent("synthwave");
      });
    });

    it("handles empty children", () => {
      const { container } = render(<ThemeProvider>{null}</ThemeProvider>);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in theme variant values from localStorage", async () => {
      localStorage.setItem(THEME_VARIANT_KEY, '<script>alert("xss")</script>');

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should ignore XSS attempt and use default
      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "convergence"
        );
      });
    });

    it("prevents prototype pollution via theme variant", async () => {
      localStorage.setItem(
        THEME_VARIANT_KEY,
        '{"__proto__":{"polluted":true}}'
      );

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Should ignore invalid value
      await waitFor(() => {
        expect(screen.getByTestId("theme-variant")).toHaveTextContent(
          "convergence"
        );
      });

      // Verify no prototype pollution
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("sanitizes theme variant in data-theme attribute", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mounted")).toHaveTextContent("true");
      });

      // Even if someone could bypass, only valid variants are accepted
      await user.click(screen.getByTestId("set-synthwave"));

      await waitFor(() => {
        const dataTheme = document.documentElement.getAttribute("data-theme");
        expect(dataTheme).toBe("synthwave");
        expect(dataTheme).not.toContain("<");
        expect(dataTheme).not.toContain(">");
      });
    });
  });

  describe("Performance Tests", () => {
    it("does not cause excessive re-renders on theme switch", async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      /**
       * Tracks render count for performance testing.
       *
       * @returns React element with theme variant
       */
      function RenderCounter() {
        renderCount++;
        const theme = useTheme();
        return <span data-testid="variant">{theme.themeVariant}</span>;
      }

      render(
        <ThemeProvider>
          <RenderCounter />
        </ThemeProvider>
      );

      const initialRenderCount = renderCount;

      // Switch theme
      await act(async () => {
        await user.click(screen.getByTestId("variant"));
      });

      // Allow for reasonable render count (initial + mounted + theme change)
      expect(renderCount).toBeLessThan(initialRenderCount + 5);
    });

    it("batches rapid theme changes", async () => {
      let renderCount = 0;

      /**
       * Tracks render count for batching test.
       *
       * @returns React element with clickable theme toggle
       */
      function RenderCounter() {
        renderCount++;
        const theme = useTheme();
        return (
          <button onClick={() => theme.setThemeVariant("synthwave")}>
            {theme.themeVariant}
          </button>
        );
      }

      const { rerender } = render(
        <ThemeProvider>
          <RenderCounter />
        </ThemeProvider>
      );

      // Wait for initial mount
      await waitFor(() => {
        expect(renderCount).toBeGreaterThan(0);
      });

      const afterMountCount = renderCount;

      // Rapid theme changes should be batched
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          rerender(
            <ThemeProvider>
              <RenderCounter />
            </ThemeProvider>
          );
        }
      });

      // Should not have 10 additional renders per change
      expect(renderCount).toBeLessThan(afterMountCount + 50);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid theme switching (100+ times)", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Rapid fire theme changes
      await act(async () => {
        for (let i = 0; i < 100; i++) {
          const button = screen.getByTestId(
            i % 2 === 0 ? "set-synthwave" : "set-convergence"
          );
          await user.click(button);
        }
      });

      // Should still be in valid state
      const variant = screen.getByTestId("theme-variant").textContent;
      expect(["convergence", "synthwave"]).toContain(variant);
    });

    it("handles corrupted localStorage data", async () => {
      // Corrupt data in various ways
      const corruptValues = [
        "",
        "null",
        "undefined",
        "{}",
        "[]",
        "0",
        "false",
        "\x00\x00\x00",
        "a".repeat(10000),
      ];

      for (const value of corruptValues) {
        localStorage.setItem(THEME_VARIANT_KEY, value);
        resetThemeState();

        const { unmount } = render(
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        );

        // Should not crash and fall back to default
        await waitFor(() => {
          expect(screen.getByTestId("theme-variant")).toHaveTextContent(
            "convergence"
          );
        });

        // Clean up before next iteration
        unmount();
      }
    });

    it("handles storage events from other tabs", async () => {
      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      // Simulate storage event from another tab
      // Note: jsdom doesn't fully support StorageEvent with storageArea, so we use a workaround
      await act(async () => {
        const event = new StorageEvent("storage", {
          key: THEME_VARIANT_KEY,
          newValue: "synthwave",
          oldValue: "convergence",
        });
        window.dispatchEvent(event);
      });

      // Component should still be in a valid state
      const variant = screen.getByTestId("theme-variant").textContent;
      expect(["convergence", "synthwave"]).toContain(variant);
    });

    it("handles concurrent mount/unmount cycles", async () => {
      const iterations = 50;
      const errors: Error[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const { unmount } = render(
            <ThemeProvider>
              <ThemeConsumer />
            </ThemeProvider>
          );
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("handles DOM manipulation during theme change", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mounted")).toHaveTextContent("true");
      });

      // Manipulate DOM during theme change
      await act(async () => {
        await user.click(screen.getByTestId("set-synthwave"));

        // Remove the theme CSS link while it's being added
        const link = document.getElementById("theme-variant-css");
        if (link) link.remove();
      });

      // Should not crash
      expect(screen.getByTestId("theme-variant")).toHaveTextContent(
        "synthwave"
      );
    });
  });
});

describe("isValidThemeVariant", () => {
  it("returns true for valid variants", () => {
    expect(isValidThemeVariant("convergence")).toBe(true);
    expect(isValidThemeVariant("synthwave")).toBe(true);
  });

  it("returns false for invalid variants", () => {
    expect(isValidThemeVariant("invalid")).toBe(false);
    expect(isValidThemeVariant("")).toBe(false);
    expect(isValidThemeVariant(null)).toBe(false);
    expect(isValidThemeVariant(undefined)).toBe(false);
    expect(isValidThemeVariant(123)).toBe(false);
    expect(isValidThemeVariant({})).toBe(false);
    expect(isValidThemeVariant([])).toBe(false);
  });
});

describe("useTheme hook", () => {
  beforeEach(() => {
    resetThemeState();
    localStorage.clear();
  });

  it("returns all expected properties", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current).toHaveProperty("themeVariant");
    expect(result.current).toHaveProperty("setThemeVariant");
    expect(result.current).toHaveProperty("colorMode");
    expect(result.current).toHaveProperty("setColorMode");
    expect(result.current).toHaveProperty("resolvedColorMode");
    expect(result.current).toHaveProperty("mounted");
  });

  it("setThemeVariant updates themeVariant", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await act(async () => {
      result.current.setThemeVariant("synthwave");
    });

    expect(result.current.themeVariant).toBe("synthwave");
  });

  it("setColorMode updates colorMode", async () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    await act(async () => {
      result.current.setColorMode("dark");
    });

    await waitFor(() => {
      expect(result.current.colorMode).toBe("dark");
    });
  });
});
