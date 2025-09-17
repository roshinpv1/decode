import type { Metadata } from 'next'
import { Inter, Open_Sans } from 'next/font/google'
import './globals.css'
import '../lib/fontawesome'

const inter = Inter({ subsets: ['latin'] })
const openSans = Open_Sans({ 
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Hackathon Chatbot',
  description: 'AI-powered chatbot for hackathon participants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${openSans.variable}`}>{children}</body>
    </html>
  )
}
