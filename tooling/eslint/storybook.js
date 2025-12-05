import nextjsConfig from "./nextjs.js";
import storybookPlugin from "eslint-plugin-storybook";

/**
 * ESLint configuration for Storybook applications Extends Next.js config with
 * Storybook-specific rules
 */
export default [
  ...nextjsConfig,
  ...storybookPlugin.configs["flat/recommended"],
  {
    files: ["**/*.stories.{ts,tsx,js,jsx}", "**/stories/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
];
