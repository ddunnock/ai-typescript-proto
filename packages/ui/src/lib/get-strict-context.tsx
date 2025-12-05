/**
 * @module @convergence/ui/lib/get-strict-context
 * @file Utility for creating type-safe React context with strict null checks.
 *   Ensures context is always accessed within a Provider, throwing clear errors
 *   if not.
 */

import * as React from "react";

/**
 * Creates a type-safe React context with strict null checking.
 *
 * Returns a Provider component and hook that throws an error if used outside
 * the Provider. Prevents common bugs from forgetting to wrap components in
 * context providers.
 *
 * @example
 *   ```tsx
 *   interface ThemeContextValue {
 *     theme: 'light' | 'dark';
 *     setTheme: (theme: string) => void;
 *   }
 *
 *   const [ThemeProvider, useTheme] = getStrictContext<ThemeContextValue>('ThemeProvider');
 *
 *   function App() {
 *     return (
 *       <ThemeProvider value={{ theme: 'dark', setTheme }}>
 *         <Child />
 *       </ThemeProvider>
 *     );
 *   }
 *
 *   function Child() {
 *     const { theme } = useTheme(); // Safe - throws if used outside Provider
 *     return <div>{theme}</div>;
 *   }
 *   ```;
 *
 * @template T - The type of the context value
 * @param name - Optional name for error messages (e.g. "ThemeProvider")
 * @returns Tuple of [Provider, useContext] - Provider component and safe
 *   context hook
 */
function getStrictContext<T>(
  name?: string
): readonly [
  ({
    value,
    children,
  }: {
    value: T;
    children?: React.ReactNode;
  }) => React.JSX.Element,
  () => T,
] {
  const Context = React.createContext<T | undefined>(undefined);

  const Provider = ({
    value,
    children,
  }: {
    value: T;
    children?: React.ReactNode;
  }) => <Context.Provider value={value}>{children}</Context.Provider>;

  const useSafeContext = () => {
    const ctx = React.useContext(Context);
    if (ctx === undefined) {
      throw new Error(`useContext must be used within ${name ?? "a Provider"}`);
    }
    return ctx;
  };

  return [Provider, useSafeContext] as const;
}

export { getStrictContext };
