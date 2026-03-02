'use client'

import { UserBadge } from '@/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'

const BADGE_COLORS: Record<string, string> = {
    'Bug Hunter': 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
    'Community Backbone': 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    'Most Improved': 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    'Feature Builder': 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    'Lab Legend': 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30',
    'Streak Master': 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    'Team Player': 'from-violet-500/20 to-violet-500/5 border-violet-500/30',
    'Top Presenter': 'from-sky-500/20 to-sky-500/5 border-sky-500/30',
}

interface BadgeGridProps {
    userBadges: UserBadge[]
}

export function BadgeGrid({ userBadges }: BadgeGridProps) {
    if (userBadges.length === 0) {
        return (
            <div className="glass rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">🎖️</p>
                <p className="text-sm text-muted-foreground">No badges yet. Keep contributing!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {userBadges.map((ub) => {
                const badge = ub.badge
                if (!badge) return null
                const colors = BADGE_COLORS[badge.name] || 'from-muted/20 to-muted/5 border-border/30'
                return (
                    <div
                        key={ub.id}
                        className={cn(
                            'rounded-xl p-4 border bg-gradient-to-b text-center transition-all duration-300 hover:scale-105',
                            colors
                        )}
                    >
                        <p className="text-3xl mb-1.5">{badge.icon}</p>
                        <p className="text-xs font-semibold leading-tight">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(ub.awarded_at)}</p>
                    </div>
                )
            })}
        </div>
    )
}
