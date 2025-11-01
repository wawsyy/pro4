import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Encrypted Survey System",
  description: "Collect and analyze privacy-preserving responses with Zama FHEVM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(91,110,255,0.35),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(85,198,247,0.25),_transparent_45%)]" />
            <div className="relative z-10 flex min-h-screen flex-col">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
