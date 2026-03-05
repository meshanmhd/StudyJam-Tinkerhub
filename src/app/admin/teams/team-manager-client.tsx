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
import { createTeam, addStudentsToTeam, removeStudentFromTeam, deleteTeam } from '../actions'
import { Plus, Loader2, X, Users2, AlertTriangle, Trash2, UserPlus } from 'lucide-react'

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
    const [searchQuery, setSearchQuery] = useState('')
    const [creating, setCreating] = useState(false)

    const [removingMember, setRemovingMember] = useState<string | null>(null)
    const [deletingTeam, setDeletingTeam] = useState<string | null>(null)

    // Add member dialog
    const [addMemberToTeamId, setAddMemberToTeamId] = useState<string | null>(null)
    const [addSearchQuery, setAddSearchQuery] = useState('')
    const [addSelectedIds, setAddSelectedIds] = useState<string[]>([])
    const [adding, setAdding] = useState(false)

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

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredUnassigned = unassigned.filter(s => s.name.toLowerCase().includes(addSearchQuery.toLowerCase()))

    async function handleAddMembers() {
        if (!addMemberToTeamId) return
        if (addSelectedIds.length === 0) return toast.error('Select at least one student')

        setAdding(true)
        const team = teams.find(t => t.id === addMemberToTeamId)
        const result = await addStudentsToTeam(addMemberToTeamId, addSelectedIds)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Students added to team!`)
            setStudents(prev => prev.map(s =>
                addSelectedIds.includes(s.id)
                    ? { ...s, team_id: addMemberToTeamId, team: { id: addMemberToTeamId, team_name: team?.team_name || '' } }
                    : s
            ))
            setAddSelectedIds([])
            setAddMemberToTeamId(null)
            router.refresh()
        }
        setAdding(false)
    }

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
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddMemberToTeamId(team.id)}
                                        className="h-8 gap-1.5 px-2 text-primary"
                                    >
                                        <UserPlus size={14} />
                                        <span className="hidden sm:inline">Add</span>
                                    </Button>
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
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTeamName(''); setSelectedMemberIds([]); setSearchQuery('') } }}>
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
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-8 text-sm mb-2"
                            />
                            <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-border/40 p-2 bg-muted/10">
                                {filteredStudents.map(student => {
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

            {/* Add Member Dialog */}
            <Dialog open={!!addMemberToTeamId} onOpenChange={(open) => { if (!open) { setAddMemberToTeamId(null); setAddSelectedIds([]); setAddSearchQuery('') } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Members to Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Select Unassigned Students ({addSelectedIds.length} selected)</Label>
                            <Input
                                placeholder="Search unassigned students..."
                                value={addSearchQuery}
                                onChange={e => setAddSearchQuery(e.target.value)}
                                className="h-8 text-sm mb-2"
                            />
                            <div className="max-h-64 overflow-y-auto space-y-1 rounded-xl border border-border/40 p-2 bg-muted/10">
                                {filteredUnassigned.map(student => {
                                    const isSelected = addSelectedIds.includes(student.id)
                                    return (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => setAddSelectedIds(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
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
                                                <p className="text-[11px] text-muted-foreground">{student.individual_xp.toLocaleString()} XP</p>
                                            </div>
                                        </button>
                                    )
                                })}
                                {unassigned.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No unassigned students available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddMemberToTeamId(null)}>Cancel</Button>
                        <Button onClick={handleAddMembers} disabled={adding}>
                            {adding ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Add to Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
