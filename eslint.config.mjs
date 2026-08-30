import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "icons/**"],
  },
  js.configs.recommended,
  // strictTypeChecked is a superset of recommendedTypeChecked — maximum type-aware bug detection
  ...tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.{ts,mts}"],
    ...sonarjs.configs.recommended,
  },
  {
    files: ["**/*.{ts,mts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "sonarjs/max-lines": ["error", { maximum: 150 }],
      "sonarjs/max-lines-per-function": ["error", { maximum: 50 }],
      // Deprecations are errors (siraj parity: eslint sonarjs/deprecation + biome noDeprecatedImports)
      "sonarjs/deprecation": "error",
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Plain JS config files are not covered by tsconfig — no type-aware linting there
    files: ["**/*.mjs", "**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
);
