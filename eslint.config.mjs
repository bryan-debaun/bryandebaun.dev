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
    // Ignore problematic MDX file until upstream parsing issue is resolved
    "src/content/posts/hello-world.mdx",
  ]),
  // MDX files: lint with eslint-plugin-mdx (only content folder)
  {
    ...mdx.configs.flat,
    files: ["src/content/**/*.{md,mdx}"]
  }
]);

export default eslintConfig;
