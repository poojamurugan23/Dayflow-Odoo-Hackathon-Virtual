import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // A separate clone of the team repo sits inside this folder and now
      // holds its own copy of the project. It is gitignored; keep it out of
      // our lint too, so its files cannot fail our build.
      "Dayflow-Odoo-Hackathon-Virtual/**",
      "phase-1-5-krithi_build/**",
    ],
  },
];

export default eslintConfig;
