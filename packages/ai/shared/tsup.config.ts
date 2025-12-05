import { defineConfig } from "tsup";

export default defineConfig({
    entry: [
        "src/index.ts",
        "src/types.ts",
        "src/config.ts",
        "src/utils.ts",
        "src/errors.ts",
    ],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
});