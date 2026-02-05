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
    // Temporary: ignore specific MDX files that trigger the MDX parser bug. See issue: TODO
    "src/content/posts/hello-world.mdx",
    "src/content/philosophy/private-example.mdx",
    "src/content/philosophy/cptsd.mdx",
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
  }
]);

export default eslintConfig;
