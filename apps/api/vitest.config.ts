import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./test/global-setup.ts"],
    // Los archivos comparten la base de pruebas, así que se ejecutan uno tras otro.
    fileParallelism: false,
    testTimeout: 15000,
    env: { NODE_ENV: "test" },
  },
});
