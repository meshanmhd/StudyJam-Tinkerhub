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
    ClipboardList,
    Gamepad2,
    Menu,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/ui/logo'
import { EditProfileDialog } from '@/components/layout/edit-profile-dialog'
import { useState } from 'react'

interface NavItem {
    href: string
    label: string
    icon: React.ElementType
}

const studentNav: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: ClipboardList },
    { href: '/games', label: 'Games', icon: Gamepad2 },
    { href: '/team', label: 'Team', icon: Users2 },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
]

const adminNav: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/tasks', label: 'Task Manager', icon: Settings },
    { href: '/admin/games', label: 'Games', icon: Gamepad2 },
    { href: '/admin/xp', label: 'XP Manager', icon: BarChart3 },
    { href: '/admin/teams', label: 'Team Manager', icon: UsersRound },
    { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/admin/badges', label: 'Badges', icon: Medal },
]

// Bottom nav items for mobile (admin: show 3 items + menu)
const adminMobileNav: NavItem[] = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
    { href: '/admin/tasks', label: 'Tasks', icon: Settings },
]

interface SidebarProps {
    role: 'admin' | 'student'
    userName: string
    userEmail: string
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const nav = role === 'admin' ? adminNav : studentNav
    const mobileNav = role === 'admin' ? adminMobileNav : studentNav
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const isActive = (href: string) =>
        pathname === href ||
        (href !== '/admin' && href !== '/dashboard' && pathname.startsWith(href))

    return (
        <>
            {/* ── Desktop Sidebar (lg+) ── */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-64 border-r border-border/50 bg-card/60 backdrop-blur-xl">
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
                        const active = isActive(item.href)
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

            {/* ── Mobile Top Bar (< lg) ── */}
            <header className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20 border border-primary/30">
                        <Logo className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-xs tracking-wide text-foreground leading-none">Tinkerhub</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-0.5">
                            {role === 'admin' ? 'Admin Panel' : 'Studyjam'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <EditProfileDialog currentName={userName}>
                        <button className="relative w-7 h-7 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
                            <Avatar className="w-full h-full">
                                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                            </Avatar>
                        </button>
                    </EditProfileDialog>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </form>
                </div>
            </header>

            {/* ── Admin Mobile Slide-up Menu overlay ── */}
            {role === 'admin' && mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        className="absolute bottom-16 inset-x-0 bg-card border-t border-border/50 rounded-t-2xl p-4 space-y-1"
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-3 pb-2">Admin Menu</p>
                        {adminNav.map(item => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
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
                        <div className="pt-2 border-t border-border/30">
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
                    </div>
                </div>
            )}

            {/* ── Mobile Bottom Navigation Bar (< lg) ── */}
            <div className="lg:hidden fixed bottom-6 inset-x-4 z-50 mx-auto max-w-sm">
                <nav className="flex items-center justify-around px-4 py-3 bg-card/95 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-full">
                    {mobileNav.map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                className={cn(
                                    'relative flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out',
                                    active
                                        ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                                        : 'text-muted-foreground hover:text-foreground hover:scale-105'
                                )}
                            >
                                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                                {active && (
                                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-white animate-in zoom-in-50" />
                                )}
                            </Link>
                        )
                    })}
                    {role === 'admin' && (
                        <button
                            onClick={() => setMobileMenuOpen(v => !v)}
                            aria-label="More menu"
                            className={cn(
                                'relative flex flex-col items-center justify-center p-2 transition-all duration-300 ease-out',
                                mobileMenuOpen
                                    ? 'text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                                    : 'text-muted-foreground hover:text-foreground hover:scale-105'
                            )}
                        >
                            {mobileMenuOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2} />}
                            {mobileMenuOpen && (
                                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-white animate-in zoom-in-50" />
                            )}
                        </button>
                    )}
                </nav>
            </div>
        </>
    )
}
