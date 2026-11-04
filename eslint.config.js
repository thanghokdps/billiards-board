import js from "@eslint/js";
import { importX } from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/** One config at the package root; its `files` cover the web code and the agent folder (src/langchain). */
const lintingFixtures = process.env.ESLINT_LINT_FIXTURES === "1";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".next",
      "next-env.d.ts",
      "node_modules",
      ".langgraph_api",
      "evals/results",
      ...(lintingFixtures ? [] : ["src/langchain/__tests__/fixtures/**"]),
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    plugins: { "import-x": importX },
    settings: { "import-x/internal-regex": "^@/" },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["**/dev/**"], message: "dev/ is not imported by app code." }] },
      ],
    },
  },
  {
    files: ["src/**/*.tsx", "src/main.tsx"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { globals: { ...globals.node } },
  },
);
