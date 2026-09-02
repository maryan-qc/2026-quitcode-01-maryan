import type { NextConfig } from "next";

// GitHub Pages serves a project site from /<repo>/, so the static export needs
// a basePath. Local dev and `npm run build` stay at the root — the deploy
// script sets GITHUB_PAGES=true.
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = "/2026-quitcode-01-maryan";

const nextConfig: NextConfig = {
  ...(isGithubPages && {
    output: "export",
    basePath,
    assetPrefix: `${basePath}/`,
    images: { unoptimized: true },
  }),
  experimental: {
    // Porsche Design System relies on the native CSS `light-dark()` function for
    // theming; Lightning CSS' polyfill for it breaks the palette, so exclude it.
    useLightningcss: true,
    lightningCssFeatures: {
      exclude: ["light-dark"],
    },
  },
};

export default nextConfig;
