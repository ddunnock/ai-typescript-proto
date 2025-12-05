import jsdoc from "eslint-plugin-jsdoc";

/**
 * Base ESLint configuration with JSDoc rules
 * Compatible with TypeDoc for Sphinx documentation generation
 */
export default [
  {
    plugins: {
      jsdoc: jsdoc,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
    rules: {
      // Require JSDoc comments
      "jsdoc/require-jsdoc": [
        "warn",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
        },
      ],
      // Require description in JSDoc blocks
      "jsdoc/require-description": "warn",
      // Require @param for all parameters
      "jsdoc/require-param": "warn",
      // Require @returns for functions that return values
      "jsdoc/require-returns": "warn",
      // Validate parameter names match function signature
      "jsdoc/check-param-names": "error",
      // Validate JSDoc syntax
      "jsdoc/valid-types": "error",
    },
  },
];
