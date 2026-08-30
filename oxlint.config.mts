import { defineConfig } from "oxlint";

const unusedVarOptions = {
  argsIgnorePattern: "^_",
  varsIgnorePattern: "^_",
  caughtErrorsIgnorePattern: "^_",
  destructuredArrayIgnorePattern: "^_",
} as const;

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import", "promise", "node", "jsdoc"],
  ignorePatterns: ["dist/**", "coverage/**"],
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
  },
  rules: {
    // console.* is the extension's built-in debugging mechanism ([PR Generator ...] logs, in-page log panel)
    "no-console": "off",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "no-unused-vars": ["error", unusedVarOptions],
    "@typescript-eslint/no-unused-vars": ["error", unusedVarOptions],
  },
});
