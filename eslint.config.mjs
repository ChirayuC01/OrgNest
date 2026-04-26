// @ts-check
import nextConfig from "eslint-config-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Next.js flat config (already an array)
  ...nextConfig,

  // TypeScript + Prettier rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prettier/prettier": "error",
    },
  },

  {
    ignores: [".next/**", "node_modules/**", "prisma/migrations/**"],
  },
];
