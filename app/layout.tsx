import React from "react";
import { Poppins } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/context/AuthProvider";
import BrowserPushBridge from "@/components/widgets/BrowserPushBridge";
import { UtilsProvider } from "@/context/UtilsProvider";
// import { LoadingProvider } from "@/context/LoadingProvider";
// import NavigationLoader from "@/components/widgets/NavigationLoader";
import "./globals.css";
import "@/styles/palette.css";
import { themeBootstrapScript } from "@/lib/theme";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_DOMAIN_URL || "https://talentsexplore.com",
  ),
  title: "Talents Explore",
  description:
    "Discover creative talent, connect with the Talents Explore community, and read our platform policies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${poppins.variable} relative top-0 bg-dark-200 font-sans`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        {/* <LoadingProvider> */}
        <AuthProvider>
          <BrowserPushBridge />
          {/* <Suspense>
              <NavigationLoader />
            </Suspense> */}
          <UtilsProvider>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" />
            </ThemeProvider>
          </UtilsProvider>
        </AuthProvider>
        {/* </LoadingProvider> */}
      </body>
    </html>
  );
}
