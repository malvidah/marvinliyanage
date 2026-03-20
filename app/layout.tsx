import type React from "react"
import type { Metadata } from "next"
import { Fraunces, Fragment_Mono } from "next/font/google"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
})

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "400",
})

export const metadata: Metadata = {
  title: "Marvin Liyanage",
  description:
    "Editorial Social Strategy Lead at Big Think. Builder of Day Lab and Audian. Based in San Francisco → Portland.",
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
    <html lang="en" className={`${fraunces.variable} ${fragmentMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
