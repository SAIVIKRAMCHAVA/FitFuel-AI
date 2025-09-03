// path: eslint.config.mjs
// Minimal TS flat config + explicit ignore of .next and node_modules.

import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // Ignore build artifacts everywhere
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  // TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      // relaxed rules for this project
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  // JS files (keep default, mostly unused here)
  {
    files: ["**/*.{js,jsx}"],
    rules: {},
  },
];
