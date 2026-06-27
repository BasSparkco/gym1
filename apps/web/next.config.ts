import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Required for pnpm monorepo: trace files from the repo root so shared
  // node_modules are included in the standalone bundle.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
