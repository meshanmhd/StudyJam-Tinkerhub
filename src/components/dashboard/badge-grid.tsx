'use client'

import { UserBadge } from '@/types'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/utils'

import { getBadgeColor } from '@/lib/utils'

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
                const colors = getBadgeColor(badge.name || '')
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
