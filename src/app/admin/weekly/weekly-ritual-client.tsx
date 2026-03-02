'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setWeeklyTitle } from '../actions'
import { toast } from 'sonner'
import { Loader2, Trophy, Star } from 'lucide-react'
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
            <div className="glass rounded-2xl p-6 border border-border/40">
                <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" /> Team of the Week
                </h2>
                <div className="space-y-2 mb-5">
                    {teams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => { setSelectedTeam(team.id); setTitle(team.weekly_title || '') }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${selectedTeam === team.id
                                    ? 'border-amber-500/40 bg-amber-500/10'
                                    : 'border-border/30 hover:border-border/60'
                                }`}
                        >
                            <span className="text-sm font-semibold flex-1">{team.team_name}</span>
                            <span className="text-xs font-bold text-amber-400">{team.team_xp.toLocaleString()} XP</span>
                            {team.weekly_title && (
                                <span className="text-xs text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10">{team.weekly_title}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    <Label>Weekly Title</Label>
                    <Input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Sprint Champions, Collaboration Kings"
                        className="bg-muted/40"
                    />
                    <Button onClick={handleSetTitle} disabled={loading} className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20">
                        {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trophy size={14} className="mr-2" />}
                        Set as Team of the Week
                    </Button>
                </div>
            </div>

            {/* Individual Highlights */}
            <div className="glass rounded-2xl p-6 border border-border/40">
                <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                    <Star size={16} className="text-primary" /> Individual Highlights
                </h2>
                <div className="space-y-3">
                    {topStudents.slice(0, 5).map((student, i) => {
                        const level = getUserLevel(student.individual_xp)
                        const initials = student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        return (
                            <div key={student.user_id} className="flex items-center gap-3 p-3 rounded-xl border border-border/20 hover:border-border/40 transition-colors">
                                <span className="text-sm font-bold text-muted-foreground w-5">#{i + 1}</span>
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{student.name}</p>
                                    <p className="text-xs text-muted-foreground">Lv.{level.level} · {student.individual_xp.toLocaleString()} XP</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-amber-400">{Math.round(student.final_score).toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground">Impact</p>
                                </div>
                            </div>
                        )
                    })}
                    {topStudents.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-6">No student data yet.</p>
                    )}
                </div>
                <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground text-center">
                        💡 Recognize these students verbally in your weekly ritual and award special badges via XP Manager
                    </p>
                </div>
            </div>
        </div>
    )
}
