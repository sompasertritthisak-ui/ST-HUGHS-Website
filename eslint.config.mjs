import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next 16 ships flat configs, so no FlatCompat shim is needed.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // New in eslint-config-next 16 (react-hooks 7): React Compiler checks. This app does not use the compiler and
    // the flagged patterns (setState in effects for client-only state, refs passed to createElement) are deliberate,
    // so they warn instead of failing the build.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", ".open-next/**", ".wrangler/**", "next-env.d.ts"]),
]);

export default eslintConfig;
