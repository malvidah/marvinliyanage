import type React from "react"
import type { Metadata } from "next"
import AuthProvider from "./components/AuthProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Marvin Liyanage",
  description:
    "Editorial Social Strategy Lead at Big Think. Builder of Day Lab and Audian. Based in San Francisco and Portland.",
  openGraph: {
    title: "Marvin Liyanage",
    description:
      "Editorial Social Strategy Lead at Big Think. Builder of Day Lab and Audian.",
    url: "https://marvinliyanage.com",
    siteName: "Marvin Liyanage",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oswald:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
