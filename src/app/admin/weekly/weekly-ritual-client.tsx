'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { setWeeklyTitle, setStudentWeeklyHighlight } from '../actions'
import { toast } from 'sonner'
import { Loader2, Trophy, Star, X } from 'lucide-react'
import { type UserScore } from '@/types'
import { cn } from '@/lib/utils'

interface Team { id: string; team_name: string; team_xp: number; weekly_title?: string }
interface StudentScore extends UserScore {
    user?: { id: string; weekly_highlight?: string | null }
}

interface WeeklyRitualClientProps {
    teams: Team[]
    students: StudentScore[]
}

export function WeeklyRitualClient({ teams, students }: WeeklyRitualClientProps) {
    // ── Team of the Week ──
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
    const [teamTitle, setTeamTitle] = useState('')
    const [teamLoading, setTeamLoading] = useState(false)

    // ── Individual Highlight ──
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
    const [highlightText, setHighlightText] = useState('')
    const [highlightLoading, setHighlightLoading] = useState(false)
    const [clearingId, setClearingId] = useState<string | null>(null)

    async function handleSetTeamTitle() {
        if (!selectedTeam || !teamTitle.trim()) { toast.error('Select a team and enter a title'); return }
        setTeamLoading(true)
        const result = await setWeeklyTitle(selectedTeam, teamTitle.trim())
        if (result.error) toast.error(result.error)
        else toast.success('Team of the week set')
        setTeamLoading(false)
    }

    async function handleSetHighlight() {
        if (!selectedStudentId || !highlightText.trim()) { toast.error('Select a student and enter a title'); return }
        setHighlightLoading(true)
        const result = await setStudentWeeklyHighlight(selectedStudentId, highlightText.trim())
        if (result.error) toast.error(result.error)
        else {
            toast.success('Student highlight set')
            setSelectedStudentId(null)
            setHighlightText('')
        }
        setHighlightLoading(false)
    }

    async function handleClearHighlight(userId: string) {
        setClearingId(userId)
        const result = await setStudentWeeklyHighlight(userId, null)
        if (result.error) toast.error(result.error)
        else toast.success('Highlight cleared')
        setClearingId(null)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Team of the Week ── */}
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <Trophy size={14} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Team of the Week</h2>
                        <p className="text-xs text-muted-foreground">Assign a title to the winning team</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        {teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => { setSelectedTeam(team.id); setTeamTitle(team.weekly_title || '') }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all',
                                    selectedTeam === team.id
                                        ? 'border-amber-500/40 bg-amber-500/8'
                                        : 'border-border/30 hover:border-border/50 hover:bg-muted/10'
                                )}
                            >
                                <span className="text-sm font-medium flex-1">{team.team_name}</span>
                                <span className="text-xs font-bold text-amber-400 shrink-0">{team.team_xp.toLocaleString()} XP</span>
                                {team.weekly_title && (
                                    <span className="text-[11px] text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 shrink-0 hidden sm:inline">
                                        {team.weekly_title}
                                    </span>
                                )}
                            </button>
                        ))}
                        {teams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No teams yet.</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Title</Label>
                        <Input
                            value={teamTitle}
                            onChange={e => setTeamTitle(e.target.value)}
                            placeholder="Sprint Champions, Deep Thinkers…"
                            className="h-9"
                            disabled={!selectedTeam}
                        />
                    </div>

                    <Button
                        onClick={handleSetTeamTitle}
                        disabled={teamLoading || !selectedTeam}
                        size="sm"
                        className="w-full"
                    >
                        {teamLoading
                            ? <><Loader2 size={13} className="animate-spin mr-1.5" />Saving…</>
                            : <><Trophy size={13} className="mr-1.5" />Set Team of the Week</>
                        }
                    </Button>
                </div>
            </div>

            {/* ── Individual Highlights ── */}
            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                <div className="px-5 py-4 border-b border-border/30 bg-muted/10 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Star size={14} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Individual Highlights</h2>
                        <p className="text-xs text-muted-foreground">Assign a personal title to a student</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Student selector rows */}
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                        {students.map(student => {
                            const initials = student.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                            const currentHighlight = student.user?.weekly_highlight
                            const isSelected = selectedStudentId === student.user_id

                            return (
                                <div
                                    key={student.user_id}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                                        isSelected
                                            ? 'border-primary/40 bg-primary/8'
                                            : 'border-transparent hover:border-border/40 hover:bg-muted/10'
                                    )}
                                    onClick={() => {
                                        setSelectedStudentId(student.user_id)
                                        setHighlightText(currentHighlight || '')
                                    }}
                                >
                                    <Avatar className="w-7 h-7 shrink-0">
                                        <AvatarFallback className="text-[10px] font-bold bg-primary/15 text-primary">{initials}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium flex-1 truncate">{student.name}</span>
                                    {currentHighlight ? (
                                        <div className="flex items-center gap-1">
                                            <span className="text-[11px] text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 shrink-0 hidden sm:inline truncate max-w-28">
                                                {currentHighlight}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleClearHighlight(student.user_id) }}
                                                disabled={clearingId === student.user_id}
                                                className="text-muted-foreground/50 hover:text-destructive transition-colors"
                                            >
                                                {clearingId === student.user_id
                                                    ? <Loader2 size={10} className="animate-spin" />
                                                    : <X size={10} />
                                                }
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )
                        })}
                        {students.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No students yet.</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Highlight Title</Label>
                        <Input
                            value={highlightText}
                            onChange={e => setHighlightText(e.target.value)}
                            placeholder="Most Improved, Problem Solver…"
                            className="h-9"
                            disabled={!selectedStudentId}
                        />
                    </div>

                    <Button
                        onClick={handleSetHighlight}
                        disabled={highlightLoading || !selectedStudentId}
                        size="sm"
                        className="w-full"
                        variant="outline"
                    >
                        {highlightLoading
                            ? <><Loader2 size={13} className="animate-spin mr-1.5" />Saving…</>
                            : <><Star size={13} className="mr-1.5" />Set Individual Highlight</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}
