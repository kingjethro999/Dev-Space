import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { Toaster } from "@/components/ui/toaster"
import { QuickNavigator } from "@/components/quick-navigator"

// Using GitHub's system font stack - no Google Fonts needed

export const metadata: Metadata = {
  title: "Dev Space - Developer Community by King Jethro",
  description: "Connect, collaborate, and grow with developers worldwide. Built by King Jethro (@kingjethro999)",
  generator: "King Jethro",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QuickNavigator />
            <Toaster />
            {children}
          </AuthProvider>
          <Analytics />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
