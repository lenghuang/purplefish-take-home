import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { setupDatabase } from "@/lib/db/migrate"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Recruiter Chatbot",
  description: "AI-powered recruitment screening tool",
    generator: 'v0.dev'
}

// Initialize database on app startup
setupDatabase()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
