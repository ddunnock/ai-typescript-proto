import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/base.ts",
        "src/anthropic.ts",
        "src/openai.ts",
        "src/google.ts",
        "src/local.ts",
        "src/factory.ts",
    ],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
});
