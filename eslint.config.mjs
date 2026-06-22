import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import * as mdx from "eslint-plugin-mdx";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".contentlayer/**",
    // Ignore generated package output (dist)
    "packages/*/dist/**",
  ]),
  // MDX files: lint with eslint-plugin-mdx (only content folder)
  {
    ...mdx.configs.flat,
    files: ["src/content/**/*.{md,mdx}"]
  },
  // Allow CommonJS `require()` in scripts: they run with Node directly and using CJS is acceptable.
  {
    files: ["scripts/**/*.{ts,js,cjs,mjs}"],
    languageOptions: {
      sourceType: "script",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  // Enforce semicolons — project preference
  {
    rules: {
      semi: ["error", "always"]
    }
  },
  // Honor the `_`-prefix convention for intentionally-unused bindings, and ignore
  // properties destructured solely to omit them from a rest spread (e.g. stripping
  // `rating` before forwarding a payload to the MCP client).
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ]
    }
  },
  // Disallow casting to `unknown` — prefer explicit types and narrower assertions
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message: "Avoid casting to 'unknown'. Prefer explicit types or narrow the value instead."
        }
      ]
    }
  },
  // Tests and scripts often require pragmatic casting (stubbing globals, playwright, etc.).
  {
    files: ["**/__tests__/**", "tests/**/*.{ts,tsx}", "scripts/**/*.{ts,js,cjs,mjs}"],
    rules: {
      "no-restricted-syntax": "off",
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  // Playwright fixtures pass values to the runner via a `use()` callback. The
  // react-hooks plugin mistakes `use` for the React hook and flags valid
  // fixture definitions; it does not apply to the integration suite.
  {
    files: ["tests/integration/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off"
    }
  }
]);

export default eslintConfig;
