'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users2,
    Trophy,
    LogOut,
    Zap,
    Settings,
    ChartBar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/logo'
import { EditProfileDialog } from '@/components/layout/edit-profile-dialog'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
}

const studentNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/team', label: 'My Team', icon: Users2 },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

const adminNav: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/session', label: 'Session Mode', icon: Zap },
    { href: '/admin/tasks', label: 'Task Manager', icon: Settings },
    { href: '/admin/xp', label: 'XP Manager', icon: ChartBar },
    { href: '/admin/teams', label: 'Team Assign', icon: Users2 },
    { href: '/admin/weekly', label: 'Weekly Ritual', icon: Trophy },
    { href: '/admin/analytics', label: 'Analytics', icon: ChartBar },
]

interface SidebarProps {
    role: 'admin' | 'student'
    userName: string
    userEmail: string
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const nav = role === 'admin' ? adminNav : studentNav
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex flex-col w-64 border-r border-border/50 bg-card/60 backdrop-blur-xl">
            {/* Brand */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/20 border border-primary/30">
                    <Logo className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="font-bold text-sm tracking-wide text-foreground">Tinkerhub</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {role === 'admin' ? 'Admin Panel' : 'Studyjam'}
                    </p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {nav.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href || (item.href !== '/admin' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                active
                                    ? 'bg-primary/20 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Icon size={16} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="px-3 pb-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/30 mb-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
                    </div>
                    <EditProfileDialog currentName={userName} />
                </div>
                <form action={logout}>
                    <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        <LogOut size={14} />
                        Sign out
                    </Button>
                </form>
            </div>
        </aside>
    )
}
