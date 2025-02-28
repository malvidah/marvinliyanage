import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Metadata } from 'next'
import { NextAuthProvider } from './providers'
import { LinkTitleProvider } from '@/lib/LinkTitleContext'
import AutoArchive from '@/components/AutoArchive'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Marvin Liyanage",
  description: "Personal wiki for Marvin Liyanage",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <LinkTitleProvider>
            {children}
          </LinkTitleProvider>
          <AutoArchive />
        </NextAuthProvider>
      </body>
    </html>
  )
}



import './globals.css'