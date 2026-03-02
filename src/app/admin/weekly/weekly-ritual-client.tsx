'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { setWeeklyTitle } from '../actions'
import { toast } from 'sonner'
import { Loader2, Trophy, Star, Search } from 'lucide-react'
import { getUserLevel, type UserScore } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Team { id: string; team_name: string; team_xp: number; weekly_title?: string }

interface WeeklyRitualClientProps {
    teams: Team[]
    topStudents: UserScore[]
}

export function WeeklyRitualClient({ teams, topStudents }: WeeklyRitualClientProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSetTitle() {
        if (!selectedTeam || !title.trim()) { toast.error('Select a team and enter a title'); return }
        setLoading(true)
        const result = await setWeeklyTitle(selectedTeam, title.trim())
        if (result.error) toast.error(result.error)
        else toast.success('Weekly title set! 🏆')
        setLoading(false)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team of the Week */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <Trophy size={15} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Team of the Week</h2>
                        <p className="text-xs text-muted-foreground">Select a team and assign their title</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Team selector */}
                    <div className="space-y-2">
                        {teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => { setSelectedTeam(team.id); setTitle(team.weekly_title || '') }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedTeam === team.id
                                    ? 'border-amber-500/40 bg-amber-500/10 shadow-sm'
                                    : 'border-border/30 hover:border-border/50 hover:bg-muted/10'
                                    }`}
                            >
                                <div className="w-7 h-7 rounded-md bg-muted/30 flex items-center justify-center text-sm shrink-0">
                                    {selectedTeam === team.id ? '⭐' : '👥'}
                                </div>
                                <span className="text-sm font-semibold flex-1">{team.team_name}</span>
                                <span className="text-xs font-bold text-amber-400">{team.team_xp.toLocaleString()} XP</span>
                                {team.weekly_title && (
                                    <span className="text-xs text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 hidden sm:inline">
                                        {team.weekly_title}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Title input */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weekly Title</Label>
                        <div className="relative">
                            <Trophy size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/60" />
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Sprint Champions, Collaboration Kings…"
                                className="w-full pl-8 pr-3 py-2.5 h-10 bg-muted/20 border border-border/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/40 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSetTitle}
                        disabled={loading || !selectedTeam}
                        className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25 font-semibold h-10"
                    >
                        {loading
                            ? <><Loader2 size={14} className="animate-spin mr-2" />Setting…</>
                            : <><Trophy size={14} className="mr-2" />Set as Team of the Week</>
                        }
                    </Button>
                </div>
            </div>

            {/* Individual Highlights */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Star size={15} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Individual Highlights</h2>
                        <p className="text-xs text-muted-foreground">Top performers this cycle</p>
                    </div>
                </div>

                <div className="p-6 space-y-2">
                    {topStudents.slice(0, 5).map((student, i) => {
                        const level = getUserLevel(student.individual_xp)
                        const initials = student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        const rankColors = ['text-amber-400', 'text-slate-400', 'text-orange-600', 'text-muted-foreground', 'text-muted-foreground']
                        return (
                            <div key={student.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-border/20 hover:border-border/40 hover:bg-muted/10 transition-all">
                                <span className={`text-xs font-bold w-5 shrink-0 ${rankColors[i]}`}>#{i + 1}</span>
                                <Avatar className="w-8 h-8 shrink-0">
                                    <AvatarFallback className="text-xs font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">Lv.{level.level} · {level.title} · {student.individual_xp.toLocaleString()} XP</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-primary">{Math.round(student.final_score).toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">Impact</p>
                                </div>
                            </div>
                        )
                    })}
                    {topStudents.length === 0 && (
                        <div className="py-10 text-center">
                            <Search size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">No student data yet.</p>
                        </div>
                    )}
                </div>

                <div className="mx-6 mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        💡 Recognize these students verbally during the weekly ritual and award special badges via the <span className="text-primary font-medium">XP Manager</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
