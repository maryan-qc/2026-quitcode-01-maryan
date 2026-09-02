import type { Metadata } from "next";
import { PorscheDesignSystemProvider } from "@porsche-design-system/components-react/ssr";
import "./globals.css";

export const metadata: Metadata = {
  title: "Хрестики-нулики",
  description: "Гра в хрестики-нулики на Next.js та Porsche Design System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className="scheme-light-dark">
      <body>
        <PorscheDesignSystemProvider>{children}</PorscheDesignSystemProvider>
      </body>
    </html>
  );
}
