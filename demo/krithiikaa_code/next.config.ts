import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge overlaps the check-in systray at narrow widths and
  // shows up in every screenshot. Development-only either way.
  devIndicators: false,

  // Pin the workspace root. Without this, Turbopack walks up and finds an
  // unrelated package-lock.json in the home directory and treats THAT as the
  // root, which changes how modules resolve.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
