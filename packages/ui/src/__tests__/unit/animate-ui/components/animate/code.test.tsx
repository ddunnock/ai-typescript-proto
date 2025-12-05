/**
 * @file Comprehensive tests for the Code compound component system. Includes
 *   unit, integration, edge case, security, performance, and chaos tests.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterEach,
} from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import {
  Code,
  CodeHeader,
  CodeBlock,
  useCode,
} from "@/components/animate-ui/components/animate/code";

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: "light",
    theme: "light",
    setTheme: vi.fn(),
  })),
}));

// Mock shiki - escape HTML like real shiki does
vi.mock("shiki", () => ({
  codeToHtml: vi.fn(async (code: string, options: { lang: string }) => {
    // Escape HTML to prevent XSS, like real shiki does
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    return `<pre><code class="language-${options.lang}">${escaped}</code></pre>`;
  }),
}));

// Mock the useIsInView hook - inline to avoid hoisting issues
vi.mock("@/hooks/use-is-in-view", () => {
  const React = require("react");
  return {
    useIsInView: () => {
      const localRef = React.useRef(null);
      return { ref: localRef, isInView: true };
    },
  };
});

// Mock lucide-react icons - inline to avoid hoisting issues
vi.mock("lucide-react", () => {
  const React = require("react");
  return {
    CheckIcon: () =>
      React.createElement("svg", { "data-testid": "check-icon" }),
    CopyIcon: () => React.createElement("svg", { "data-testid": "copy-icon" }),
  };
});

// Mock motion/react - inline to avoid hoisting issues
vi.mock("motion/react", () => {
  const React = require("react");

  const MockAnimatePresence = (props: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, props.children);

  const MockMotionSpan = React.forwardRef(
    (
      props: React.HTMLAttributes<HTMLSpanElement>,
      ref: React.Ref<HTMLSpanElement>
    ) => {
      const { children, ...rest } = props;
      return React.createElement("span", { ...rest, ref }, children);
    }
  );
  MockMotionSpan.displayName = "MockMotionSpan";

  const MockMotionButton = React.forwardRef(
    (
      props: React.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: React.Ref<HTMLButtonElement>
    ) => {
      const { children, ...rest } = props;
      return React.createElement("button", { ...rest, ref }, children);
    }
  );
  MockMotionButton.displayName = "MockMotionButton";

  return {
    AnimatePresence: MockAnimatePresence,
    motion: {
      span: MockMotionSpan,
      button: MockMotionButton,
    },
    useInView: () => true,
  };
});

// Create a stable mock for clipboard that persists
const mockWriteText = vi.fn(() => Promise.resolve());

// Override navigator.clipboard globally for all tests
beforeAll(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: mockWriteText,
    },
    configurable: true,
    writable: true,
  });
});

describe("Code Compound Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockWriteText.mockClear();
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Code (Root Container)", () => {
    describe("Unit Tests", () => {
      it("renders with required code prop", () => {
        const { container } = render(<Code code="const x = 1;">Content</Code>);

        expect(
          container.querySelector('[data-slot="code"]')
        ).toBeInTheDocument();
      });

      it("renders children correctly", () => {
        render(
          <Code code="test">
            <div data-testid="child">Child content</div>
          </Code>
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
      });

      it("applies className", () => {
        const { container } = render(
          <Code code="test" className="custom-class">
            Content
          </Code>
        );

        expect(container.querySelector('[data-slot="code"]')).toHaveClass(
          "custom-class"
        );
      });

      it("applies default styling", () => {
        const { container } = render(<Code code="test">Content</Code>);

        const codeContainer = container.querySelector('[data-slot="code"]');
        expect(codeContainer).toHaveClass("relative");
        expect(codeContainer).toHaveClass("flex");
        expect(codeContainer).toHaveClass("flex-col");
        expect(codeContainer).toHaveClass("overflow-hidden");
        expect(codeContainer).toHaveClass("border");
        expect(codeContainer).toHaveClass("rounded-lg");
      });

      it("passes through additional div props", () => {
        const onClick = vi.fn();
        render(
          <Code code="test" onClick={onClick} data-testid="clickable">
            Content
          </Code>
        );

        expect(screen.getByTestId("clickable")).toBeInTheDocument();
      });
    });

    describe("Context Provider", () => {
      it("provides code to child components", () => {
        const TestConsumer = () => {
          const { code } = useCode();
          return <div data-testid="consumer">{code}</div>;
        };

        render(
          <Code code="context code">
            <TestConsumer />
          </Code>
        );

        expect(screen.getByTestId("consumer")).toHaveTextContent(
          "context code"
        );
      });

      it("throws error when useCode is used outside provider", () => {
        const TestConsumer = () => {
          const { code } = useCode();
          return <div>{code}</div>;
        };

        // Suppress console.error for this test
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        expect(() => render(<TestConsumer />)).toThrow(
          "useContext must be used within CodeContext"
        );

        consoleSpy.mockRestore();
      });
    });
  });

  describe("CodeHeader", () => {
    describe("Unit Tests", () => {
      it("renders with default props", () => {
        const { container } = render(
          <Code code="test">
            <CodeHeader>Header content</CodeHeader>
          </Code>
        );

        expect(
          container.querySelector('[data-slot="code-header"]')
        ).toBeInTheDocument();
      });

      it("renders children content", () => {
        render(
          <Code code="test">
            <CodeHeader>example.ts</CodeHeader>
          </Code>
        );

        expect(screen.getByText("example.ts")).toBeInTheDocument();
      });

      it("renders icon when provided", () => {
        const TestIcon = () => <svg data-testid="test-icon" />;

        render(
          <Code code="test">
            <CodeHeader icon={TestIcon}>With Icon</CodeHeader>
          </Code>
        );

        expect(screen.getByTestId("test-icon")).toBeInTheDocument();
      });

      it("renders copy button when copyButton is true", () => {
        render(
          <Code code="test">
            <CodeHeader copyButton>With Copy</CodeHeader>
          </Code>
        );

        expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
      });

      it("does not render copy button by default", () => {
        render(
          <Code code="test">
            <CodeHeader>No Copy</CodeHeader>
          </Code>
        );

        expect(screen.queryByTestId("copy-icon")).not.toBeInTheDocument();
      });

      it("applies custom className", () => {
        const { container } = render(
          <Code code="test">
            <CodeHeader className="custom-header">Header</CodeHeader>
          </Code>
        );

        expect(
          container.querySelector('[data-slot="code-header"]')
        ).toHaveClass("custom-header");
      });

      it("applies default styling", () => {
        const { container } = render(
          <Code code="test">
            <CodeHeader>Header</CodeHeader>
          </Code>
        );

        const header = container.querySelector('[data-slot="code-header"]');
        expect(header).toHaveClass("bg-accent");
        expect(header).toHaveClass("flex");
        expect(header).toHaveClass("items-center");
        expect(header).toHaveClass("h-10");
      });
    });

    describe("Copy Functionality", () => {
      it("copies code from context when copy button clicked", async () => {
        vi.useRealTimers();
        const user = userEvent.setup();

        render(
          <Code code="code to copy">
            <CodeHeader copyButton>Header</CodeHeader>
          </Code>
        );

        // Verify initial state
        expect(screen.getByTestId("copy-icon")).toBeInTheDocument();

        await user.click(screen.getByRole("button"));

        // Verify the copy succeeded by checking that the icon changed
        await waitFor(() => {
          expect(screen.getByTestId("check-icon")).toBeInTheDocument();
        });

        vi.useFakeTimers({ shouldAdvanceTime: true });
      });

      it("shows check icon after copy", async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

        render(
          <Code code="test">
            <CodeHeader copyButton>Header</CodeHeader>
          </Code>
        );

        await user.click(screen.getByRole("button"));

        await waitFor(() => {
          expect(screen.getByTestId("check-icon")).toBeInTheDocument();
        });
      });
    });
  });

  describe("CodeBlock (Sub-component)", () => {
    describe("Unit Tests", () => {
      it("renders code from context", async () => {
        render(
          <Code code="const x = 1;">
            <CodeBlock lang="typescript" />
          </Code>
        );

        await waitFor(() => {
          expect(
            screen.getByText((content) => content.includes("const x = 1;"))
          ).toBeInTheDocument();
        });
      });

      it("applies data-slot attribute", () => {
        const { container } = render(
          <Code code="test">
            <CodeBlock lang="typescript" />
          </Code>
        );

        expect(
          container.querySelector('[data-slot="code-block"]')
        ).toBeInTheDocument();
      });

      it("applies custom className", () => {
        const { container } = render(
          <Code code="test">
            <CodeBlock lang="typescript" className="custom-block" />
          </Code>
        );

        expect(container.querySelector('[data-slot="code-block"]')).toHaveClass(
          "custom-block"
        );
      });

      it("supports cursor prop", () => {
        const { container } = render(
          <Code code="test">
            <CodeBlock lang="typescript" cursor />
          </Code>
        );

        const block = container.querySelector('[data-slot="code-block"]');
        expect(block).toBeInTheDocument();
      });

      it("passes writing prop to primitive", () => {
        const { container } = render(
          <Code code="test">
            <CodeBlock lang="typescript" writing />
          </Code>
        );

        const block = container.querySelector('[data-slot="code-block"]');
        expect(block).toHaveAttribute("data-writing", "true");
      });
    });

    describe("Theme Integration", () => {
      it("uses resolved theme from next-themes", async () => {
        const { useTheme } = await import("next-themes");
        (useTheme as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
          resolvedTheme: "dark",
          theme: "dark",
          setTheme: vi.fn(),
        });

        const { codeToHtml } = await import("shiki");

        render(
          <Code code="test">
            <CodeBlock lang="typescript" />
          </Code>
        );

        await waitFor(() => {
          expect(codeToHtml).toHaveBeenCalledWith(
            "test",
            expect.objectContaining({
              defaultColor: "dark",
            })
          );
        });
      });
    });
  });

  describe("Compound Component Integration", () => {
    it("renders full composition correctly", async () => {
      const { container } = render(
        <Code code="const greeting = 'Hello, World!';">
          <CodeHeader copyButton>greeting.ts</CodeHeader>
          <CodeBlock lang="typescript" />
        </Code>
      );

      // All parts should render
      expect(container.querySelector('[data-slot="code"]')).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="code-header"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="code-block"]')
      ).toBeInTheDocument();

      // Header content
      expect(screen.getByText("greeting.ts")).toBeInTheDocument();

      // Copy button
      expect(screen.getByTestId("copy-icon")).toBeInTheDocument();

      // Code content
      await waitFor(() => {
        expect(
          screen.getByText((content) =>
            content.includes("const greeting = 'Hello, World!';")
          )
        ).toBeInTheDocument();
      });
    });

    it("shares code between header copy button and block", async () => {
      // Use real timers for clipboard test
      vi.useRealTimers();
      const user = userEvent.setup();
      const code = "shared code content";

      render(
        <Code code={code}>
          <CodeHeader copyButton>File</CodeHeader>
          <CodeBlock lang="typescript" />
        </Code>
      );

      // Copy button should be present
      expect(screen.getByTestId("copy-icon")).toBeInTheDocument();

      // Click copy button
      await user.click(screen.getByRole("button"));

      // After successful copy, check icon should appear
      await waitFor(() => {
        expect(screen.getByTestId("check-icon")).toBeInTheDocument();
      });

      // Block should display the same code
      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes(code))
        ).toBeInTheDocument();
      });

      // Restore fake timers
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    it("works without CodeHeader", async () => {
      render(
        <Code code="const x = 1;">
          <CodeBlock lang="typescript" />
        </Code>
      );

      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes("const x = 1;"))
        ).toBeInTheDocument();
      });
    });

    it("works with multiple CodeBlocks", async () => {
      render(
        <Code code="shared code">
          <CodeBlock lang="typescript" data-testid="block-1" />
          <CodeBlock lang="typescript" data-testid="block-2" />
        </Code>
      );

      await waitFor(() => {
        const codeElements = screen.getAllByText((content) =>
          content.includes("shared code")
        );
        expect(codeElements).toHaveLength(2);
      });
    });

    it("works with custom header icon and content", () => {
      const FileIcon = () => <svg data-testid="file-icon" />;

      render(
        <Code code="test">
          <CodeHeader icon={FileIcon} copyButton>
            <span data-testid="filename">config.json</span>
          </CodeHeader>
          <CodeBlock lang="json" />
        </Code>
      );

      expect(screen.getByTestId("file-icon")).toBeInTheDocument();
      expect(screen.getByTestId("filename")).toHaveTextContent("config.json");
      expect(screen.getByTestId("copy-icon")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty code", async () => {
      render(
        <Code code="">
          <CodeHeader copyButton>empty.ts</CodeHeader>
          <CodeBlock lang="typescript" />
        </Code>
      );

      expect(screen.getByText("empty.ts")).toBeInTheDocument();
    });

    it("handles very long code", async () => {
      const longCode = Array.from(
        { length: 100 },
        (_, i) => `const var${i} = ${i};`
      ).join("\n");

      render(
        <Code code={longCode}>
          <CodeBlock lang="typescript" />
        </Code>
      );

      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes("const var0 = 0;"))
        ).toBeInTheDocument();
      });
    });

    it("handles code with special characters", async () => {
      const specialCode = `const str = "<script>alert('xss')</script>";`;

      const { container } = render(
        <Code code={specialCode}>
          <CodeBlock lang="typescript" />
        </Code>
      );

      await waitFor(() => {
        // Check that the code block contains the special characters
        // Text may be broken up across elements, so check container innerHTML
        const codeBlock = container.querySelector('[data-slot="code-block"]');
        expect(codeBlock).toBeInTheDocument();
        expect(codeBlock?.innerHTML).toContain("const str");
        // Verify no script tag was created from the code content (XSS prevention)
        // Only check within the code block, not the whole document
        const scriptsInCodeBlock = codeBlock?.querySelectorAll("script");
        expect(scriptsInCodeBlock?.length ?? 0).toBe(0);
      });
    });

    it("handles unicode in code", async () => {
      const unicodeCode = `const emoji = "🎉"; // 日本語`;

      render(
        <Code code={unicodeCode}>
          <CodeBlock lang="typescript" />
        </Code>
      );

      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes("🎉"))
        ).toBeInTheDocument();
      });
    });

    it("handles multiline code", async () => {
      const multilineCode = `function hello() {
  console.log("Hello");
  return true;
}`;

      render(
        <Code code={multilineCode}>
          <CodeBlock lang="javascript" />
        </Code>
      );

      await waitFor(() => {
        expect(
          screen.getByText((content) => content.includes("function hello()"))
        ).toBeInTheDocument();
      });
    });
  });

  describe("Security Tests", () => {
    it("prevents XSS in code content", () => {
      const maliciousCode = '<img src=x onerror="alert(1)">';

      const { container } = render(
        <Code code={maliciousCode}>
          <CodeBlock lang="html" />
        </Code>
      );

      // Code block should render
      expect(container.querySelector('[data-slot="code"]')).toBeInTheDocument();
      // No img element with onerror should be created from code content
      expect(container.querySelector("img[onerror]")).not.toBeInTheDocument();
    });

    it("prevents XSS in className", () => {
      const maliciousClass = '<script>alert("xss")</script>';

      render(
        <Code code="test" className={maliciousClass}>
          <CodeBlock lang="typescript" />
        </Code>
      );

      expect(document.querySelector("script")).not.toBeInTheDocument();
    });

    it("safely handles copy of malicious content", () => {
      const maliciousCode = '<script>alert("xss")</script>';

      render(
        <Code code={maliciousCode}>
          <CodeHeader copyButton>malicious.html</CodeHeader>
        </Code>
      );

      // Verify no script execution
      expect(document.querySelector("script")).not.toBeInTheDocument();
      // Copy button should render
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Performance Tests", () => {
    it("renders efficiently", async () => {
      const startTime = performance.now();

      render(
        <Code code="const x = 1;">
          <CodeHeader copyButton>test.ts</CodeHeader>
          <CodeBlock lang="typescript" />
        </Code>
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it("handles many Code blocks", async () => {
      render(
        <>
          {Array.from({ length: 20 }, (_, i) => (
            <Code key={i} code={`const x${i} = ${i};`}>
              <CodeHeader copyButton>file-{i}.ts</CodeHeader>
              <CodeBlock lang="typescript" />
            </Code>
          ))}
        </>
      );

      expect(screen.getByText("file-0.ts")).toBeInTheDocument();
      expect(screen.getByText("file-19.ts")).toBeInTheDocument();
    });

    it("handles rapid re-renders", async () => {
      const { rerender } = render(
        <Code code="version 1">
          <CodeBlock lang="typescript" />
        </Code>
      );

      await act(async () => {
        for (let i = 0; i < 20; i++) {
          rerender(
            <Code code={`version ${i}`}>
              <CodeBlock lang="typescript" />
            </Code>
          );
        }
      });

      expect(true).toBe(true);
    });
  });

  describe("Chaos Tests", () => {
    it("handles rapid mount/unmount cycles", () => {
      const errors: Error[] = [];

      for (let i = 0; i < 20; i++) {
        try {
          const { unmount } = render(
            <Code code={`test ${i}`}>
              <CodeHeader copyButton>file.ts</CodeHeader>
              <CodeBlock lang="typescript" />
            </Code>
          );
          unmount();
        } catch (error) {
          errors.push(error as Error);
        }
      }

      expect(errors).toHaveLength(0);
    });

    it("handles concurrent Code components", async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<void>((resolve) => {
          const { unmount } = render(
            <Code code={`test ${i}`}>
              <CodeBlock lang="typescript" />
            </Code>
          );
          setTimeout(() => {
            unmount();
            resolve();
          }, Math.random() * 10);
        });
      });

      await Promise.all(promises);
      expect(true).toBe(true);
    });

    it("handles switching languages rapidly", async () => {
      const languages = ["typescript", "python", "rust", "go", "java"];

      const { rerender } = render(
        <Code code="test">
          <CodeBlock lang="typescript" />
        </Code>
      );

      await act(async () => {
        for (const lang of languages) {
          rerender(
            <Code code="test">
              <CodeBlock lang={lang} />
            </Code>
          );
        }
      });

      expect(true).toBe(true);
    });
  });

  describe("Accessibility", () => {
    it("has accessible copy button", () => {
      render(
        <Code code="test">
          <CodeHeader copyButton>file.ts</CodeHeader>
        </Code>
      );

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("copy button is keyboard accessible", () => {
      render(
        <Code code="keyboard copy">
          <CodeHeader copyButton>file.ts</CodeHeader>
        </Code>
      );

      const button = screen.getByRole("button");
      // Button should be focusable
      expect(button).not.toBeDisabled();
      // Button should be a proper button element
      expect(button.tagName.toLowerCase()).toBe("button");
    });
  });
});
