'use client'

interface ImpactMeterProps {
    individualXp: number
    teamXp: number
    finalScore: number
}

export function ImpactMeter({ individualXp, teamXp, finalScore }: ImpactMeterProps) {
    const teamContrib = teamXp > 0 ? (teamXp / (teamXp + individualXp)) * 100 : 0
    const indivContrib = 100 - teamContrib

    return (
        <div className="glass rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Lab Contribution Index</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{Math.round(finalScore).toLocaleString()}</p>
                </div>
                <div className="text-4xl">⚡</div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-violet-400 font-medium">Team Contribution (60%)</span>
                        <span className="text-muted-foreground">{teamXp.toLocaleString()} XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-1000"
                            style={{ width: `${Math.min(100, teamContrib)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-blue-400 font-medium">Individual Contribution (40%)</span>
                        <span className="text-muted-foreground">{individualXp.toLocaleString()} XP</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000"
                            style={{ width: `${Math.min(100, indivContrib)}%` }}
                        />
                    </div>
                </div>
            </div>

            <p className="text-[11px] text-muted-foreground border-t border-border/30 pt-3">
                Final Impact = 0.6 × Team XP + 0.4 × Individual XP
            </p>
        </div>
    )
}
