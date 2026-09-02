import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
