'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createTeam, removeStudentFromTeam, deleteTeam } from '../actions'
import { Plus, Loader2, X, Users2, AlertTriangle, Trash2 } from 'lucide-react'

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

interface TeamManagerClientProps {
    students: Student[]
    teams: Team[]
}

export function TeamManagerClient({ students: initialStudents, teams: initialTeams }: TeamManagerClientProps) {
    const router = useRouter()
    const [students, setStudents] = useState(initialStudents)
    const [teams, setTeams] = useState(initialTeams)

    // Create team dialog
    const [createOpen, setCreateOpen] = useState(false)
    const [teamName, setTeamName] = useState('')
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
    const [creating, setCreating] = useState(false)

    const [removingMember, setRemovingMember] = useState<string | null>(null)
    const [deletingTeam, setDeletingTeam] = useState<string | null>(null)

    function toggleMember(studentId: string) {
        setSelectedMemberIds(prev =>
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        )
    }

    async function handleCreateTeam() {
        if (!teamName.trim()) return toast.error('Team name is required')
        setCreating(true)
        const result = await createTeam(teamName.trim(), selectedMemberIds)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Team "${teamName}" created!`)
            // Update local state
            if (result.team) {
                setTeams(prev => [...prev, result.team!])
                setStudents(prev => prev.map(s =>
                    selectedMemberIds.includes(s.id)
                        ? { ...s, team_id: result.team!.id, team: { id: result.team!.id, team_name: result.team!.team_name } }
                        : s
                ))
            }
            setTeamName('')
            setSelectedMemberIds([])
            setCreateOpen(false)
            router.refresh()
        }
        setCreating(false)
    }

    async function handleRemoveMember(studentId: string) {
        setRemovingMember(studentId)
        const result = await removeStudentFromTeam(studentId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Student removed from team')
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, team_id: null, team: null } : s))
            router.refresh()
        }
        setRemovingMember(null)
    }

    async function handleDeleteTeam(teamId: string, teamName: string) {
        if (!confirm(`Delete team "${teamName}"? All members will be unassigned.`)) return
        setDeletingTeam(teamId)
        const result = await deleteTeam(teamId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Team "${teamName}" deleted`)
            setTeams(prev => prev.filter(t => t.id !== teamId))
            setStudents(prev => prev.map(s => s.team_id === teamId ? { ...s, team_id: null, team: null } : s))
            router.refresh()
        }
        setDeletingTeam(null)
    }

    // Group students by team
    const unassigned = students.filter(s => !s.team_id)

    return (
        <div className="space-y-6">
            {/* Top action bar */}
            <div className="flex items-center gap-3">
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus size={16} />
                    Create Team
                </Button>
                <div className="flex gap-4 text-sm text-muted-foreground ml-2">
                    <span>{teams.length} teams</span>
                    <span>{students.filter(s => s.team_id).length} assigned</span>
                    <span className="text-amber-400">{unassigned.length} unassigned</span>
                </div>
            </div>

            {/* Teams list */}
            <div className="space-y-4">
                {teams.map(team => {
                    const members = students.filter(s => s.team_id === team.id)
                    return (
                        <div key={team.id} className="glass rounded-2xl border border-border/40 overflow-hidden">
                            {/* Team header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20 bg-muted/10">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Users2 size={15} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{team.team_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {members.length} member{members.length !== 1 ? 's' : ''} · {team.team_xp.toLocaleString()} XP
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTeam(team.id, team.team_name)}
                                    disabled={deletingTeam === team.id}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    {deletingTeam === team.id
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <Trash2 size={14} />
                                    }
                                </Button>
                            </div>
                            {/* Members */}
                            <div className="divide-y divide-border/20">
                                {members.map(student => (
                                    <div key={student.id} className="flex items-center gap-3 px-5 py-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{student.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-400 shrink-0">{student.individual_xp.toLocaleString()} XP</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(student.id)}
                                            disabled={removingMember === student.id}
                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        >
                                            {removingMember === student.id
                                                ? <Loader2 size={12} className="animate-spin" />
                                                : <X size={12} />
                                            }
                                        </Button>
                                    </div>
                                ))}
                                {members.length === 0 && (
                                    <div className="px-5 py-4 text-sm text-muted-foreground italic">No members yet</div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Unassigned */}
                {unassigned.length > 0 && (
                    <div className="glass rounded-2xl border border-amber-500/20 overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20 bg-amber-500/5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle size={15} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Unassigned Students</p>
                                <p className="text-xs text-muted-foreground">{unassigned.length} students need a team</p>
                            </div>
                        </div>
                        <div className="divide-y divide-border/20">
                            {unassigned.map(student => (
                                <div key={student.id} className="flex items-center gap-3 px-5 py-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-amber-400">
                                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{student.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                                    </div>
                                    <span className="text-xs font-semibold text-amber-400 shrink-0">{student.individual_xp.toLocaleString()} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {unassigned.length === 0 && teams.length > 0 && (
                    <div className="py-8 text-center text-muted-foreground bg-muted/5 rounded-xl border border-border/10">
                        <Users2 size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                        <p className="font-medium text-sm">All students are in teams</p>
                        <p className="text-xs text-muted-foreground/60">No unassigned students remaining</p>
                    </div>
                )}

                {teams.length === 0 && students.length === 0 && (
                    <div className="glass rounded-2xl p-10 text-center border border-border/40">
                        <p className="text-sm text-muted-foreground">No students or teams yet.</p>
                    </div>
                )}
            </div>

            {/* Create Team Dialog */}
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTeamName(''); setSelectedMemberIds([]) } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Team Name</Label>
                            <Input
                                placeholder="e.g. Team Alpha"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Select Members ({selectedMemberIds.length} selected)</Label>
                            <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-border/40 p-2 bg-muted/10">
                                {students.map(student => {
                                    const isSelected = selectedMemberIds.includes(student.id)
                                    const alreadyInTeam = !!student.team_id && !selectedMemberIds.includes(student.id)
                                    return (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleMember(student.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${isSelected
                                                ? 'bg-primary/15 border border-primary/30'
                                                : 'hover:bg-muted/30 border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-border/60'}`}>
                                                {isSelected && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{student.name}</p>
                                                {alreadyInTeam && (
                                                    <p className="text-[11px] text-amber-400 flex items-center gap-1">
                                                        <AlertTriangle size={10} />
                                                        Already in {student.team?.team_name}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                                {students.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No students available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTeam} disabled={creating}>
                            {creating ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Create Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
