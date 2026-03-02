'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: string
    color?: 'purple' | 'blue' | 'amber' | 'green' | 'rose'
    glow?: boolean
}

const COLOR_MAP = {
    purple: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
}

const GLOW_MAP = {
    purple: 'shadow-violet-500/20',
    blue: 'shadow-blue-500/20',
    amber: 'shadow-amber-500/20',
    green: 'shadow-emerald-500/20',
    rose: 'shadow-rose-500/20',
}

export function StatCard({ title, value, subtitle, icon, color = 'purple', glow }: StatCardProps) {
    return (
        <div className={cn(
            'glass rounded-2xl p-5 border transition-all duration-300',
            COLOR_MAP[color],
            glow && `shadow-lg ${GLOW_MAP[color]}`
        )}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{title}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {icon && <span className="text-2xl opacity-80">{icon}</span>}
            </div>
        </div>
    )
}
