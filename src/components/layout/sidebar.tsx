'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users2,
    Trophy,
    LogOut,
    Settings,
    BarChart3,
    Medal,
    CalendarCheck,
    UsersRound,
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
    { href: '/admin/tasks', label: 'Task Manager', icon: Settings },
    { href: '/admin/xp', label: 'XP Manager', icon: BarChart3 },
    { href: '/admin/teams', label: 'Team Manager', icon: UsersRound },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/admin/badges', label: 'Badges', icon: Medal },
    { href: '/admin/weekly', label: 'Weekly Ritual', icon: Trophy },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
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
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {nav.map((item) => {
                    const Icon = item.icon
                    const active = pathname === item.href ||
                        (item.href !== '/admin' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                                active
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            )}
                        >
                            <Icon size={15} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* User */}
            <div className="px-3 pb-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/20 mb-2">
                    <Avatar className="w-8 h-8 shrink-0">
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
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
                    >
                        <LogOut size={14} />
                        Sign out
                    </Button>
                </form>
            </div>
        </aside>
    )
}
