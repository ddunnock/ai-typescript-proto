import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Root ESLint configuration for the ConvergenceOS monorepo.
 * This delegates to package-specific configs for most linting.
 */
export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
        },
    },
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "**/.next/**",
            "**/coverage/**",
            "services/ml/**",
            "docs/**",
        ],
    }
);
