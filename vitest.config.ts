import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // "server-only" throws unless resolved under Next's "react-server"
      // bundler condition (its "default" export always throws — see
      // node_modules/server-only/index.js — only that condition picks the
      // no-op empty.js instead). Vitest runs plain Node, so point it at the
      // no-op directly by absolute path rather than adopting the
      // "react-server" condition wholesale (which would also change how
      // React itself resolves) — the package's own "exports" map doesn't
      // list "./empty.js" as an importable subpath, so a bare-specifier
      // alias can't reach it either.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
  },
});
