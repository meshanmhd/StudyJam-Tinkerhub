'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignTeam } from '../actions'
import { toast } from 'sonner'
import { Loader2, Users2, UserCheck, UserX } from 'lucide-react'

interface Student {
    id: string
    name: string
    email: string
    individual_xp: number
    team_id: string | null
    team?: { id: string; team_name: string } | null
}

interface Team {
    id: string
    team_name: string
    team_xp: number
}

interface TeamAssignClientProps {
    students: Student[]
    teams: Team[]
}

export function TeamAssignClient({ students, teams }: TeamAssignClientProps) {
    const router = useRouter()
    const [pending, setPending] = useState<string | null>(null)
    const [localStudents, setLocalStudents] = useState(students)

    async function handleAssign(studentId: string, teamId: string) {
        setPending(studentId)
        const resolvedTeamId = teamId === 'none' ? null : teamId
        const result = await assignTeam(studentId, resolvedTeamId)
        if (result.error) {
            toast.error(result.error)
        } else {
            const teamName = teams.find(t => t.id === teamId)?.team_name
            toast.success(resolvedTeamId ? `Assigned to ${teamName}` : 'Removed from team')
            setLocalStudents(prev =>
                prev.map(s => s.id === studentId
                    ? { ...s, team_id: resolvedTeamId, team: resolvedTeamId ? { id: teamId, team_name: teamName! } : null }
                    : s
                )
            )
            router.refresh()
        }
        setPending(null)
    }

    const assigned = localStudents.filter(s => s.team_id)
    const unassigned = localStudents.filter(s => !s.team_id)

    return (
        <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-2xl p-4 border border-border/40 text-center">
                    <p className="text-2xl font-bold">{localStudents.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Students</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-emerald-500/20 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{assigned.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">In a Team</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-amber-500/20 text-center">
                    <p className="text-2xl font-bold text-amber-400">{unassigned.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Unassigned</p>
                </div>
            </div>

            {/* Unassigned students first */}
            {unassigned.length > 0 && (
                <div className="glass rounded-2xl border border-amber-500/20 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                            <UserX size={15} className="text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Unassigned Students</h2>
                            <p className="text-xs text-muted-foreground">{unassigned.length} students need a team</p>
                        </div>
                    </div>
                    <div className="divide-y divide-border/20">
                        {unassigned.map(student => (
                            <StudentRow
                                key={student.id}
                                student={student}
                                teams={teams}
                                pending={pending}
                                onAssign={handleAssign}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* All students */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <UserCheck size={15} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">All Students</h2>
                        <p className="text-xs text-muted-foreground">Assign or reassign team membership</p>
                    </div>
                </div>
                <div className="divide-y divide-border/20">
                    {localStudents.map(student => (
                        <StudentRow
                            key={student.id}
                            student={student}
                            teams={teams}
                            pending={pending}
                            onAssign={handleAssign}
                        />
                    ))}
                    {localStudents.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-2xl mb-2">🎓</p>
                            <p className="text-sm text-muted-foreground">No students registered yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Teams overview */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Teams Overview</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teams.map(team => {
                        const count = localStudents.filter(s => s.team_id === team.id).length
                        return (
                            <div key={team.id} className="glass rounded-xl px-4 py-3 border border-border/30 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Users2 size={14} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{team.team_name}</p>
                                    <p className="text-xs text-muted-foreground">{count} member{count !== 1 ? 's' : ''}</p>
                                </div>
                                <p className="text-xs font-bold text-amber-400">{team.team_xp.toLocaleString()} XP</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function StudentRow({ student, teams, pending, onAssign }: {
    student: Student
    teams: Team[]
    pending: string | null
    onAssign: (studentId: string, teamId: string) => void
}) {
    const isBusy = pending === student.id
    const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="flex items-center gap-4 px-5 py-3 hover:bg-muted/10 transition-colors">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{student.name}</p>
                <p className="text-xs text-muted-foreground truncate">{student.email}</p>
            </div>

            {/* Current team badge */}
            {student.team ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary hidden sm:block shrink-0">
                    {student.team.team_name}
                </span>
            ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hidden sm:block shrink-0">
                    No team
                </span>
            )}

            {/* XP */}
            <span className="text-xs font-semibold text-amber-400 shrink-0 hidden md:block">
                {student.individual_xp.toLocaleString()} XP
            </span>

            {/* Team selector */}
            <div className="shrink-0 w-36">
                <Select
                    value={student.team_id || 'none'}
                    onValueChange={(val) => onAssign(student.id, val)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="h-8 text-xs bg-muted/20 border-border/60 ring-1 ring-border/20 focus:ring-primary/30 focus:border-primary/50">
                        {isBusy ? (
                            <div className="flex items-center gap-1.5">
                                <Loader2 size={11} className="animate-spin" />
                                <span>Saving…</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="Select team…" />
                        )}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">
                            <span className="text-muted-foreground">— No team</span>
                        </SelectItem>
                        {teams.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                                {t.team_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Confirm button */}
            <Button
                size="sm"
                variant="ghost"
                disabled={isBusy}
                onClick={() => onAssign(student.id, student.team_id || 'none')}
                className="h-8 px-2 shrink-0 text-muted-foreground hover:text-foreground"
                title="Re-apply current selection"
            >
                {isBusy ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
            </Button>
        </div>
    )
}
