// path: eslint.config.mjs

// Use the explicit .js extension so Node/ESM can resolve the patch correctly on ESLint 9.
import "@rushstack/eslint-patch/modern-module-resolution.js";

import next from "eslint-config-next";

export default [
  ...next,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];
