'use client'

import { getUserLevel, getLevelProgress, getNextLevel, Level } from '@/types'
import { cn } from '@/lib/utils'


const LEVEL_COLORS = [
    'from-slate-400 to-slate-300',      // Level 1 Explorer
    'from-emerald-500 to-teal-400',     // Level 2 Builder
    'from-blue-500 to-indigo-400',      // Level 3 Creator
    'from-violet-500 to-purple-400',    // Level 4 Architect
    'from-amber-500 to-yellow-400',     // Level 5 Lab Legend
]

const LEVEL_BADGES = ['🌱', '🔨', '🎨', '🏛️', '⭐']

interface LevelCardProps {
    impact: number
    levels?: Level[]
}

export function LevelCard({ impact, levels }: LevelCardProps) {
    const level = getUserLevel(impact, levels)
    const progress = getLevelProgress(impact, levels)
    const nextLevel = getNextLevel(impact, levels)
    const colorIndex = (level.level - 1) % LEVEL_COLORS.length
    const colorClass = LEVEL_COLORS[colorIndex]
    const badge = LEVEL_BADGES[colorIndex]

    return (
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
            {/* Glow blob */}
            <div className={cn('absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-20 bg-gradient-to-br', colorClass)} />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Level</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{badge}</span>
                            <div>
                                <p className={cn('text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent', colorClass)}>
                                    Level {level.level}
                                </p>
                                <p className="text-sm text-muted-foreground font-medium">{level.title}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">Impact Score</p>
                        <p className="text-2xl font-bold text-foreground">{Math.round(impact).toLocaleString()}</p>
                    </div>
                </div>

                {nextLevel ? (
                    <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>{progress}% to {nextLevel.title}</span>
                            <span>{nextLevel.minImpact - Math.round(impact)} pts needed</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div
                                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', colorClass)}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span className="text-amber-400 font-semibold">🏆 Max Level Reached!</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 w-full" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
