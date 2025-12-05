import base from "./base.js";
import nextPlugin from "@next/eslint-plugin-next";

/**
 * ESLint configuration for Next.js applications
 * Extends base config with Next.js-specific rules
 */
export default [
  ...base,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];

