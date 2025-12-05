import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactConfig from "@convergence/eslint-config/react";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...reactConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Disable static-components rule for slot.tsx
    // The Slot component uses module-level caching for motion components,
    // which is a deliberate pattern to avoid recreating components during render.
    files: ["src/components/animate-ui/primitives/animate/slot.tsx"],
    rules: {
      "react-hooks/static-components": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  }
);
