import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function formatXp(xp: number): string {
  return xp.toLocaleString()
}

export function getBadgeColor(text: string): string {
  if (!text) return 'bg-primary/10 text-primary border-primary/20'

  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }

  const colors = [
    'bg-red-500/10 text-red-500 border-red-500/20',
    'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'bg-green-500/10 text-green-500 border-green-500/20',
    'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'bg-pink-500/10 text-pink-500 border-pink-500/20',
    'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  ]

  return colors[Math.abs(hash) % colors.length]
}
