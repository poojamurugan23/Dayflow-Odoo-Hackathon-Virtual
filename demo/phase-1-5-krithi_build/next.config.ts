import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Turbopack walks up and finds an
  // unrelated package-lock.json in the home directory and treats THAT as the
  // root, which changes how modules resolve.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
