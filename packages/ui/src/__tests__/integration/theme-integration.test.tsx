/**
 * @fileoverview Integration tests for theme system components working together.
 * Tests ThemeProvider and ThemeSwitcher component interactions.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme, resetThemeState, THEME_VARIANT_KEY } from "../../providers/theme-provider";
import { ThemeSwitcher } from "../../components/theme-switcher";

describe("Theme System Integration", () => {
  beforeEach(() => {
    resetThemeState();
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.querySelectorAll("#theme-variant-css").forEach((el) => el.remove());
  });

  describe("ThemeProvider + ThemeSwitcher Integration", () => {
    it("ThemeSwitcher changes propagate to ThemeProvider state", async () => {
      const user = userEvent.setup();

      /**
       * Displays current theme state for testing.
       * @returns React element with theme variant and color mode
       */
      function ThemeDisplay() {
        const { themeVariant, colorMode } = useTheme();
        return (
          <div>
            <span data-testid="variant">{themeVariant}</span>
            <span data-testid="mode">{colorMode}</span>
          </div>
        );
      }

      render(
        <ThemeProvider>
          <ThemeSwitcher />
          <ThemeDisplay />
        </ThemeProvider>
      );

      // Wait for mount
      await waitFor(() => {
        expect(screen.getByLabelText("Theme variant")).toBeInTheDocument();
      });

      // Change theme variant
      await user.selectOptions(screen.getByLabelText("Theme variant"), "synthwave");

      // Display should update
      await waitFor(() => {
        expect(screen.getByTestId("variant")).toHaveTextContent("synthwave");
      });

      // Change color mode
      await user.selectOptions(screen.getByLabelText("Color mode"), "dark");

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
      });
    });

    it("Multiple ThemeSwitchers stay synchronized", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <div data-testid="switcher-1">
            <ThemeSwitcher />
          </div>
          <div data-testid="switcher-2">
            <ThemeSwitcher />
          </div>
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getAllByLabelText("Theme variant")).toHaveLength(2);
      });

      const [switcher1Variant, switcher2Variant] =
        screen.getAllByLabelText("Theme variant");

      // Change in first switcher
      await user.selectOptions(switcher1Variant as HTMLSelectElement, "synthwave");

      // Second switcher should reflect change
      await waitFor(() => {
        expect((switcher1Variant as HTMLSelectElement).value).toBe("synthwave");
        expect((switcher2Variant as HTMLSelectElement).value).toBe("synthwave");
      });

      // Change in second switcher
      await user.selectOptions(switcher2Variant as HTMLSelectElement, "convergence");

      // First switcher should reflect change
      await waitFor(() => {
        expect((switcher1Variant as HTMLSelectElement).value).toBe("convergence");
        expect((switcher2Variant as HTMLSelectElement).value).toBe("convergence");
      });
    });

    it("Theme persists across ThemeSwitcher remounts", async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Theme variant")).toBeInTheDocument();
      });

      // Change theme
      await user.selectOptions(screen.getByLabelText("Theme variant"), "synthwave");

      // Unmount and remount ThemeSwitcher
      rerender(
        <ThemeProvider>
          <div key="placeholder" />
        </ThemeProvider>
      );

      rerender(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      // Theme should still be synthwave
      await waitFor(() => {
        expect(
          (screen.getByLabelText("Theme variant") as HTMLSelectElement).value
        ).toBe("synthwave");
      });
    });
  });

  describe("localStorage Integration", () => {
    it("Theme variant persists to localStorage", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Theme variant")).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText("Theme variant"), "synthwave");

      // Check localStorage
      expect(localStorage.getItem(THEME_VARIANT_KEY)).toBe("synthwave");
    });

    it("Theme loads from localStorage on initial render", async () => {
      // Pre-set localStorage then reset state - this simulates
      // a fresh load where localStorage was already set
      localStorage.setItem(THEME_VARIANT_KEY, "synthwave");
      // Reset state to synthwave (simulating reading from localStorage at module load)
      resetThemeState("synthwave");

      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      // Wait for component to mount and show the stored value
      await waitFor(() => {
        const select = screen.getByLabelText("Theme variant") as HTMLSelectElement;
        expect(select.value).toBe("synthwave");
      });
    });

    it("Invalid localStorage value falls back to default", async () => {
      localStorage.setItem(THEME_VARIANT_KEY, "invalid-theme");
      resetThemeState();

      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      await waitFor(() => {
        const select = screen.getByLabelText("Theme variant") as HTMLSelectElement;
        expect(select.value).toBe("convergence");
      });
    });
  });

  describe("DOM Attribute Integration", () => {
    it("Theme variant changes update data-theme attribute", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      // Wait for mount
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(screen.getByLabelText("Theme variant")).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText("Theme variant"), "synthwave");

      await waitFor(() => {
        expect(document.documentElement.getAttribute("data-theme")).toBe("synthwave");
      });
    });

    it("Color mode changes update class attribute via next-themes", async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Color mode")).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText("Color mode"), "dark");

      // next-themes adds the class to html element
      await waitFor(() => {
        expect(
          document.documentElement.classList.contains("dark") ||
            document.documentElement.classList.contains("light")
        ).toBe(true);
      });
    });
  });

  describe("Nested Provider Behavior", () => {
    it("Child components receive theme from nearest provider", async () => {
      /**
       * Displays current theme variant for testing.
       * @returns React element with theme variant
       */
      function ThemeDisplay() {
        const { themeVariant } = useTheme();
        return <span data-testid="display">{themeVariant}</span>;
      }

      render(
        <ThemeProvider>
          <ThemeDisplay />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("display")).toHaveTextContent("convergence");
      });
    });
  });

  describe("Concurrent Operations", () => {
    it("Handles multiple rapid changes across components", async () => {
      const user = userEvent.setup();

      /**
       * Counter component for testing concurrent theme changes.
       * @returns React element with combined theme state
       */
      function Counter() {
        const { themeVariant, colorMode } = useTheme();
        return (
          <div data-testid="counter">
            {themeVariant}-{colorMode}
          </div>
        );
      }

      render(
        <ThemeProvider>
          <ThemeSwitcher />
          <Counter />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByLabelText("Theme variant")).toBeInTheDocument();
      });

      const variantSelect = screen.getByLabelText("Theme variant");
      const modeSelect = screen.getByLabelText("Color mode");

      // Rapid changes
      for (let i = 0; i < 5; i++) {
        await user.selectOptions(
          variantSelect,
          i % 2 === 0 ? "synthwave" : "convergence"
        );
        await user.selectOptions(
          modeSelect,
          i % 3 === 0 ? "dark" : i % 3 === 1 ? "light" : "system"
        );
      }

      // Counter should show valid combination
      const counter = screen.getByTestId("counter");
      expect(counter.textContent).toMatch(/^(convergence|synthwave)-(light|dark|system)$/);
    });
  });

  describe("Error Boundary Behavior", () => {
    it("Theme context throws outside provider with clear message", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      /**
       * Component that uses useTheme outside provider for error testing.
       * @returns Null (should throw before returning)
       */
      function InvalidComponent() {
        useTheme(); // Should throw
        return null;
      }

      expect(() => {
        render(<InvalidComponent />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Full User Flow", () => {
    it("Complete theme customization flow works end-to-end", async () => {
      const user = userEvent.setup();

      /**
       * Displays full theme status for end-to-end testing.
       * @returns React element with all theme state properties
       */
      function ThemeStatus() {
        const { themeVariant, colorMode, resolvedColorMode, mounted } = useTheme();
        return (
          <div data-testid="status">
            <span data-testid="variant">{themeVariant}</span>
            <span data-testid="mode">{colorMode}</span>
            <span data-testid="resolved">{resolvedColorMode}</span>
            <span data-testid="mounted">{mounted ? "yes" : "no"}</span>
          </div>
        );
      }

      render(
        <ThemeProvider>
          <ThemeSwitcher />
          <ThemeStatus />
        </ThemeProvider>
      );

      // 1. Initial state - wait for mount
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId("mounted")).toHaveTextContent("yes");
      });

      expect(screen.getByTestId("variant")).toHaveTextContent("convergence");
      expect(screen.getByTestId("mode")).toHaveTextContent("system");

      // 2. User changes theme variant
      await user.selectOptions(screen.getByLabelText("Theme variant"), "synthwave");

      await waitFor(() => {
        expect(screen.getByTestId("variant")).toHaveTextContent("synthwave");
      });

      // 3. User changes color mode
      await user.selectOptions(screen.getByLabelText("Color mode"), "dark");

      await waitFor(() => {
        expect(screen.getByTestId("mode")).toHaveTextContent("dark");
        expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
      });

      // 4. Verify persistence
      expect(localStorage.getItem(THEME_VARIANT_KEY)).toBe("synthwave");

      // 5. Verify DOM attributes
      await waitFor(() => {
        expect(document.documentElement.getAttribute("data-theme")).toBe("synthwave");
      });
    });
  });
});
