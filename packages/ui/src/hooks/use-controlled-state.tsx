/**
 * @module @convergence/ui/hooks/use-controlled-state
 * @file Hook for managing controlled and uncontrolled component state. Provides
 *   a unified interface for components that can be either controlled or
 *   uncontrolled.
 */

import * as React from "react";

interface CommonControlledStateProps<T> {
  value?: T;
  defaultValue?: T;
}

/**
 * Hook for managing controlled and uncontrolled component state.
 *
 * Supports both controlled (value prop provided) and uncontrolled
 * (defaultValue) patterns. Automatically syncs internal state with controlled
 * value prop changes.
 *
 * @example
 *   ```tsx
 *   // Uncontrolled mode
 *   const [value, setValue] = useControlledState({ defaultValue: 'initial' });
 *
 *   // Controlled mode
 *   const [value, setValue] = useControlledState({
 *     value: externalValue,
 *     onChange: (newValue) => setExternalValue(newValue)
 *   });
 *   ```;
 *
 * @template T - The type of the state value
 * @template Rest - Additional arguments passed to onChange callback
 * @param props - Configuration object
 * @param props.value - Controlled value (if provided, component is controlled)
 * @param props.defaultValue - Initial value for uncontrolled mode
 * @param props.onChange - Callback fired when state changes
 * @returns Tuple of [currentValue, setState] similar to React.useState
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useControlledState<T, Rest extends any[] = []>(
  props: CommonControlledStateProps<T> & {
    onChange?: (value: T, ...args: Rest) => void;
  }
): readonly [T, (next: T, ...args: Rest) => void] {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = React.useState<T>(
    value ?? (defaultValue as T)
  );

  React.useEffect(() => {
    if (value !== undefined) setInternalState(value);
  }, [value]);

  const setState = React.useCallback(
    (next: T, ...args: Rest) => {
      setInternalState(next);
      onChange?.(next, ...args);
    },
    [onChange]
  );

  return [state, setState] as const;
}
