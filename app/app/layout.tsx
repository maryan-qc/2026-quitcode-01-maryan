import type { Metadata } from "next";
import { PorscheDesignSystemProvider } from "@porsche-design-system/components-react/ssr";
import { STORAGE_KEY, THEME_CLASSES } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Хрестики-нулики",
  description: "Гра в хрестики-нулики на Next.js та Porsche Design System",
};

/**
 * Applies the saved theme before the first paint. Without it the page renders
 * with the system scheme and then snaps to the chosen one — a visible flash on
 * every load for anyone who picked light or dark explicitly.
 */
const THEME_BOOTSTRAP = `
try {
  var classes = ${JSON.stringify(THEME_CLASSES)};
  var saved = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
  var cls = classes[saved.theme] || classes.system;
  var root = document.documentElement;
  root.classList.remove(classes.system, classes.light, classes.dark);
  root.classList.add(cls);
} catch (e) {}
`.trim();

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk" className={THEME_CLASSES.system}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <PorscheDesignSystemProvider>{children}</PorscheDesignSystemProvider>
      </body>
    </html>
  );
}
