/**
 * @module @convergence/ui/components/animate-ui/primitives/animate/code-block
 * @file Animated CodeBlock primitive with syntax highlighting. Provides a code
 *   display component with optional typewriter animation effect, syntax
 *   highlighting via Shiki, and viewport-aware rendering.
 */

"use client";

import * as React from "react";

import { useIsInView, type UseIsInViewOptions } from "@/hooks/use-is-in-view";

/**
 * Props for the CodeBlock primitive component. Combines div props with code
 * display and animation configuration.
 */
type CodeBlockProps = React.ComponentProps<"div"> & {
  /** The source code to display */
  code: string;
  /** Programming language for syntax highlighting (e.g., 'typescript', 'python') */
  lang: string;
  /** Active theme mode for syntax highlighting (default: 'light') */
  theme?: "light" | "dark";
  /** Shiki theme names for light and dark modes */
  themes?: { light: string; dark: string };
  /** Enable typewriter animation effect (default: false) */
  writing?: boolean;
  /** Duration of typewriter animation in milliseconds (default: 5000) */
  duration?: number;
  /** Delay before starting animation in milliseconds (default: 0) */
  delay?: number;
  /** Callback fired when typewriter animation completes */
  onDone?: () => void;
  /** Callback fired on each character write with progress info */
  onWrite?: (info: { index: number; length: number; done: boolean }) => void;
  /** Ref to scroll container for auto-scroll during animation */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
} & UseIsInViewOptions;

/**
 * Animated CodeBlock primitive with syntax highlighting and typewriter effect.
 *
 * Displays syntax-highlighted code using Shiki with optional typewriter
 * animation that reveals code character by character. Supports viewport-aware
 * rendering to start animations when visible, and auto-scrolling during the
 * animation.
 *
 * @example
 *   ```tsx
 *   // Static code display
 *   <CodeBlock
 *     code="const x = 1;"
 *     lang="typescript"
 *   />
 *
 *   // Typewriter animation
 *   <CodeBlock
 *     code={codeString}
 *     lang="python"
 *     writing
 *     duration={3000}
 *     onDone={() => console.log('Done!')}
 *   />
 *
 *   // With theme support
 *   <CodeBlock
 *     code={code}
 *     lang="javascript"
 *     theme={isDark ? 'dark' : 'light'}
 *     themes={{ light: 'github-light', dark: 'github-dark' }}
 *   />
 *   ```;
 *
 * @param props - CodeBlock component props
 * @param props.ref - Ref to attach to the container div
 * @param props.code - The source code string to display
 * @param props.lang - Programming language for syntax highlighting
 * @param props.theme - Active theme mode ('light' or 'dark', default: 'light')
 * @param props.themes - Shiki theme names (default: github-light/github-dark)
 * @param props.writing - Enable typewriter animation (default: false)
 * @param props.duration - Animation duration in ms (default: 5000)
 * @param props.delay - Delay before animation starts in ms (default: 0)
 * @param props.onDone - Callback when animation completes
 * @param props.onWrite - Progress callback with index, length, and done status
 * @param props.scrollContainerRef - Container ref for auto-scroll during
 *   animation
 * @param props.inView - Whether to trigger based on viewport visibility
 * @param props.inViewOnce - Only trigger animation once when in view (default:
 *   true)
 * @param props.inViewMargin - Intersection observer margin (default: '0px')
 * @param props... - All other div HTML attributes
 * @returns Syntax-highlighted code block component
 * @see {@link https://shiki.style/ Shiki} For syntax highlighting
 * @see {@link useIsInView} For viewport detection
 */
function CodeBlock({
  ref,
  code,
  lang,
  theme = "light",
  themes = {
    light: "github-light",
    dark: "github-dark",
  },
  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView = false,
  inViewOnce = true,
  inViewMargin = "0px",
  ...props
}: CodeBlockProps) {
  const { ref: localRef, isInView } = useIsInView(
    ref as React.Ref<HTMLDivElement>,
    {
      inView,
      inViewOnce,
      inViewMargin,
    }
  );

  const [visibleCode, setVisibleCode] = React.useState("");
  const [highlightedCode, setHighlightedCode] = React.useState("");
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import("shiki");

        const highlighted = await codeToHtml(visibleCode, {
          lang,
          themes,
          defaultColor: theme,
        });

        setHighlightedCode(highlighted);
      } catch (e) {
        console.error(`Language "${lang}" could not be loaded.`, e);
      }
    };

    loadHighlightedCode();
  }, [lang, themes, writing, isInView, duration, delay, visibleCode, theme]);

  React.useEffect(() => {
    if (!writing) {
      setVisibleCode(code);
      onDone?.();
      onWrite?.({ index: code.length, length: code.length, done: true });
      return;
    }

    if (!code.length || !isInView) return;

    const characters = Array.from(code);
    let index = 0;
    const totalDuration = duration;
    const interval = totalDuration / characters.length;
    let intervalId: NodeJS.Timeout;

    // Extract animation step logic to reduce nesting
    const animateNextCharacter = () => {
      const nextChar = characters.slice(0, index + 1).join("");
      setVisibleCode(nextChar);
      onWrite?.({
        index: index + 1,
        length: characters.length,
        done: false,
      });
      index += 1;
      localRef.current?.scrollTo({
        top: localRef.current?.scrollHeight,
        behavior: "smooth",
      });
    };

    const completeAnimation = () => {
      clearInterval(intervalId);
      setIsDone(true);
      onDone?.();
      onWrite?.({
        index: characters.length,
        length: characters.length,
        done: true,
      });
    };

    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        if (index < characters.length) {
          animateNextCharacter();
        } else {
          completeAnimation();
        }
      }, interval);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [code, duration, delay, isInView, writing, onDone, onWrite, localRef]);

  React.useEffect(() => {
    if (!writing || !isInView) return;
    const el =
      scrollContainerRef?.current ??
      (localRef.current?.parentElement as HTMLElement | null) ??
      (localRef.current as unknown as HTMLElement | null);

    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [highlightedCode, writing, isInView, scrollContainerRef, localRef]);

  return (
    <div
      ref={localRef}
      data-slot="code-block"
      data-writing={writing}
      data-done={isDone}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      {...props}
    />
  );
}

export { CodeBlock, type CodeBlockProps };
