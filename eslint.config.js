import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["mt-static/plugins/OGPEmbed/dist/**", "coverage/**"],
  },
  {
    files: [
      "mt-static/plugins/OGPEmbed/src/**/*.{ts,tsx}",
      "tests/**/*.ts",
      "vite.config.ts",
    ],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      react.configs.flat.recommended,
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "16.14" } },
    rules: {
      "react/prop-types": "off",
    },
  },
  {
    files: ["mt-static/plugins/OGPEmbed/src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
    },
  },
  prettier
);
