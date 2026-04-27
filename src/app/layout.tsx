import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import AuthProvider from "@/components/AuthProvider";
import ToasterProvider from "@/components/ToasterProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "OrgNest — Team Task Management",
  description:
    "OrgNest helps teams organize work, track tasks, and collaborate with confidence. Built for modern organizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <TooltipProvider>
              <ToasterProvider />
              <AuthProvider>{children}</AuthProvider>
            </TooltipProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
