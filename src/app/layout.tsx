import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tinkerhub Studyjam',
  description: 'Track your learning journey, earn XP, level up, and collaborate with your team in a gamified study environment.',
  keywords: 'study jam, gamified learning, XP, leaderboard, collaboration',
}

export const viewport: Viewport = {
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} font-sans antialiased bg-black text-white`}>
        {children}
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  )
}
