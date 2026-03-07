'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTeam, addStudentsToTeam, removeStudentFromTeam, deleteTeam } from '../actions'
import { deleteXpLog } from '../students/actions'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Loader2, X, Users2, AlertTriangle, Trash2, UserPlus, Search, Pencil, Zap } from 'lucide-react'

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
    teamXpLogs?: {
        id: string
        xp_value: number
        reason: string
        created_at: string
        category: string
        team_id: string
        user_id: string | null
    }[]
}

export function TeamManagerClient({ students: initialStudents, teams: initialTeams, teamXpLogs = [] }: TeamManagerClientProps) {
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
    const [confirmRemoveStudent, setConfirmRemoveStudent] = useState<Student | null>(null)
    const [confirmDeleteTeam, setConfirmDeleteTeam] = useState<{ id: string; name: string } | null>(null)
    const [confirmDeleteXPLogId, setConfirmDeleteXPLogId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Add member dialog
    const [addMemberToTeamId, setAddMemberToTeamId] = useState<string | null>(null)
    const [addSearchQuery, setAddSearchQuery] = useState('')
    const [addSelectedIds, setAddSelectedIds] = useState<string[]>([])
    const [adding, setAdding] = useState(false)

    // Team Profile Dialog (the new modal interface)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [activePanel, setActivePanel] = useState<'members' | 'edit' | 'view'>('members')
    const [isProfileOpen, setIsProfileOpen] = useState(false)

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
        setDeletingTeam(teamId)
        const result = await deleteTeam(teamId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Team "${teamName}" deleted`)
            setTeams(prev => prev.filter(t => t.id !== teamId))
            setStudents(prev => prev.map(s => s.team_id === teamId ? { ...s, team_id: null, team: null } : s))
            setIsProfileOpen(false)
            setConfirmDeleteTeam(null)
            router.refresh()
        }
        setDeletingTeam(null)
    }

    async function handleDeleteXPLog(logId: string) {
        setIsSaving(true)
        const result = await deleteXpLog(logId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Team XP record removed')
            setConfirmDeleteXPLogId(null)
            router.refresh()
        }
        setIsSaving(false)
    }

    // Group students by team
    const unassigned = students.filter(s => !s.team_id)

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredUnassigned = unassigned.filter(s => s.name.toLowerCase().includes(addSearchQuery.toLowerCase()))

    // Open profile
    function openTeamProfile(team: Team) {
        setSelectedTeam(team)
        setActivePanel('members')
        setIsProfileOpen(true)
    }

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
                        <div
                            key={team.id}
                            onClick={() => openTeamProfile(team)}
                            className="glass rounded-2xl border border-border/40 overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                        >
                            {/* Team header (simplified for list) */}
                            <div className="flex items-center gap-3 px-5 py-4 bg-muted/5">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <span className="text-primary font-bold text-sm">
                                        {team.team_name.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-base text-white">{team.team_name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {members.length} member{members.length !== 1 ? 's' : ''} · {team.team_xp.toLocaleString()} XP
                                    </p>
                                </div>
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
                <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="team_name" className="text-sm font-semibold text-muted-foreground">Team Name</Label>
                            <Input
                                id="team_name"
                                placeholder="e.g. Team Alpha"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm ring-1 ring-border/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <div className="space-y-2">

                            <div className="relative mb-2">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm ring-1 ring-border/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredStudents.map(student => {
                                    const isSelected = selectedMemberIds.includes(student.id)
                                    const alreadyInTeam = !!student.team_id && !selectedMemberIds.includes(student.id)
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleMember(student.id)}
                                            className={`group flex items-center p-3 rounded-xl transition-colors cursor-pointer ${isSelected
                                                ? 'bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 ring-1 ring-inset ring-black/5 dark:ring-white/5'
                                                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected
                                                ? 'bg-white dark:bg-white'
                                                : 'border-2 border-gray-300 dark:border-zinc-600'
                                                }`}>
                                                {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-zinc-200'}`}>{student.name}</h4>
                                                <p className={`text-xs truncate ${isSelected ? 'text-gray-500 dark:text-zinc-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                                                    {alreadyInTeam ? (
                                                        <span className="text-amber-500 flex items-center gap-1 mt-0.5">
                                                            <AlertTriangle size={10} /> Already in {student.team?.team_name}
                                                        </span>
                                                    ) : (
                                                        `${student.individual_xp.toLocaleString()} XP`
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {students.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No students available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 mt-2">
                        <Button variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-xl px-5">Cancel</Button>
                        <Button onClick={handleCreateTeam} disabled={creating} className="bg-white text-black hover:bg-gray-200 rounded-xl px-5 font-semibold transition-colors">
                            {creating ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Create Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={!!addMemberToTeamId} onOpenChange={(open) => { if (!open) { setAddMemberToTeamId(null); setAddSelectedIds([]); setAddSearchQuery('') } }}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Add Members to Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-4">
                            <Label className="block text-sm font-semibold text-muted-foreground mb-3">
                                Select Unassigned Students ({addSelectedIds.length} selected)
                            </Label>
                            <div className="relative mb-2">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                                <input
                                    type="text"
                                    placeholder="Search unassigned students..."
                                    value={addSearchQuery}
                                    onChange={e => setAddSearchQuery(e.target.value)}
                                    className="w-full bg-muted/20 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm ring-1 ring-border/10 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-1 overflow-y-auto custom-scrollbar pr-2 max-h-[300px]">
                                {filteredUnassigned.map(student => {
                                    const isSelected = addSelectedIds.includes(student.id)
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => setAddSelectedIds(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id])}
                                            className={`group flex items-center p-3 rounded-xl transition-colors cursor-pointer ${isSelected
                                                ? 'bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 ring-1 ring-inset ring-black/5 dark:ring-white/5'
                                                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center mr-4 shrink-0 transition-colors ${isSelected
                                                ? 'bg-white dark:bg-white'
                                                : 'border-2 border-gray-300 dark:border-zinc-600'
                                                }`}>
                                                {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-zinc-200'}`}>{student.name}</h4>
                                                <p className={`text-xs truncate ${isSelected ? 'text-gray-500 dark:text-zinc-400' : 'text-gray-500 dark:text-zinc-500'}`}>{student.individual_xp.toLocaleString()} XP</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {unassigned.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No unassigned students available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 mt-2">
                        <Button variant="ghost" onClick={() => setAddMemberToTeamId(null)} className="rounded-xl px-5">Cancel</Button>
                        <Button onClick={handleAddMembers} disabled={adding} className="bg-white text-black hover:bg-gray-200 rounded-xl px-5 font-semibold transition-colors">
                            {adding ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Add to Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Team Profile Modal (New Design) */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-lg bg-[#0A0A0A] border-[#1F1F1F] p-0 overflow-hidden text-white gap-0 max-h-[85vh] h-[85vh] flex flex-col">
                    <DialogTitle className="sr-only">Team Profile</DialogTitle>

                    {selectedTeam && (() => {
                        const teamMembers = students.filter(s => s.team_id === selectedTeam.id)
                        return (
                            <>
                                {/* Dialog Header — identity strip */}
                                <div className="flex items-center gap-5 px-6 py-6 border-b border-[#1F1F1F] relative">
                                    {/* Avatar */}
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                        {selectedTeam.team_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                        <p className="text-xl font-bold text-white tracking-tight truncate leading-none mb-1">{selectedTeam.team_name}</p>
                                        <div className="flex flex-col items-start gap-1.5">
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-zinc-300 leading-none">
                                                {teamMembers.length} Members
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="grid grid-cols-2 divide-x divide-[#1F1F1F] border-b border-[#1F1F1F]">
                                    {[
                                        { label: 'Total Team XP', value: selectedTeam.team_xp.toLocaleString() },
                                        { label: 'Leaderboard Rank', value: `#${[...teams].sort((a, b) => b.team_xp - a.team_xp).findIndex(t => t.id === selectedTeam.id) + 1}` },
                                    ].map(stat => (
                                        <div key={stat.label} className="flex flex-col items-center justify-center py-5 gap-1.5">
                                            <span className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">{stat.label}</span>
                                            <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Tab Strip */}
                                <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-[#1F1F1F] bg-white/[0.015]">
                                    <button
                                        onClick={() => setActivePanel('members')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'members' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Users2 size={11} /> Members
                                    </button>
                                    <button
                                        onClick={() => setActivePanel('view')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'view' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Zap size={11} /> XP Log
                                    </button>
                                    <button
                                        onClick={() => setActivePanel('edit')}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'edit' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Pencil size={11} /> Manager Actions
                                    </button>
                                </div>

                                {/* Panel Content (Scrollable) */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {/* === Members Panel === */}
                                    {activePanel === 'members' && (
                                        <div className="p-4 space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <h3 className="text-sm font-semibold text-zinc-300">Team Roster</h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setAddMemberToTeamId(selectedTeam.id)}
                                                    className="h-7 text-xs font-medium text-black bg-white hover:bg-zinc-200"
                                                >
                                                    <UserPlus size={13} className="mr-1.5" /> Add Student
                                                </Button>
                                            </div>

                                            <div className="divide-y divide-[#1F1F1F] border border-[#1F1F1F] rounded-xl bg-black/20">
                                                {teamMembers.map(student => (
                                                    <div key={student.id} className="flex items-center gap-3 px-4 py-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold shrink-0 text-white">
                                                            {student.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                                                            <p className="text-xs text-zinc-500 truncate">{student.email}</p>
                                                        </div>
                                                        <span className="text-xs font-bold text-white shrink-0 mr-2">{student.individual_xp.toLocaleString()} XP</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setConfirmRemoveStudent(student)}
                                                            disabled={removingMember === student.id}
                                                            className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 shrink-0 rounded-md"
                                                        >
                                                            {removingMember === student.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                                                        </Button>
                                                    </div>
                                                ))}
                                                {teamMembers.length === 0 && (
                                                    <div className="px-4 py-8 text-center bg-white/[0.02]">
                                                        <p className="text-sm text-zinc-500">No members in this team.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* === XP Log Panel === */}
                                    {activePanel === 'view' && (
                                        <div className="divide-y divide-[#1F1F1F]">
                                            {teamXpLogs.filter(log => log.team_id === selectedTeam.id).length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                                                    <Zap size={32} className="mb-3 opacity-20" />
                                                    <p className="text-sm">No team XP records found.</p>
                                                    <p className="text-xs text-zinc-600 mt-1">XP earned collectively will appear here.</p>
                                                </div>
                                            ) : (
                                                teamXpLogs.filter(log => log.team_id === selectedTeam.id).map(log => (
                                                    <div key={log.id} className="group flex items-start justify-between p-4 hover:bg-white/[0.02] transition-colors">
                                                        <div className="flex flex-col gap-1 pr-6">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-white">{log.reason}</span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-zinc-500 font-medium">
                                                                    {new Date(log.created_at).toLocaleDateString(undefined, {
                                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                                    })}
                                                                </span>
                                                                <span className="w-1 h-1 rounded-full bg-[#1F1F1F]" />
                                                                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
                                                                    {log.category.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="font-bold text-sm text-amber-400">+{log.xp_value}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmDeleteXPLogId(log.id);
                                                                }}
                                                                className="p-1 text-zinc-700 hover:text-rose-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Remove XP record"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {/* === Delete / Edit Panel === */}
                                    {activePanel === 'edit' && (
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-white">Danger Zone</h3>
                                                <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-4 flex flex-col gap-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-red-200">Delete Team</p>
                                                        <p className="text-xs text-red-300/70 mt-1">This will permanently delete the team. All current members will be unassigned and return to the unassigned student pool. Team XP records will be lost.</p>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        disabled={deletingTeam === selectedTeam.id}
                                                        onClick={() => setConfirmDeleteTeam({ id: selectedTeam.id, name: selectedTeam.team_name })}
                                                        className="w-full sm:w-auto self-start"
                                                    >
                                                        {deletingTeam === selectedTeam.id ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
                                                        Delete &quot;{selectedTeam.team_name}&quot;
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )
                    })()}
                </DialogContent>
            </Dialog>

            {/* Remove Student Confirmation Dialog */}
            <Dialog open={!!confirmRemoveStudent} onOpenChange={(open) => !open && setConfirmRemoveStudent(null)}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-[#0A0A0A] border-[#1F1F1F] text-white">
                    <DialogTitle className="text-xl font-bold">Remove Student</DialogTitle>
                    <div className="py-2">
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to remove <span className="text-white font-medium">{confirmRemoveStudent?.name}</span> from the team?
                        </p>
                    </div>
                    <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmRemoveStudent(null)}
                            className="bg-transparent text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirmRemoveStudent) {
                                    handleRemoveMember(confirmRemoveStudent.id)
                                    setConfirmRemoveStudent(null)
                                }
                            }}
                        >
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Team Confirmation Dialog */}
            <Dialog open={!!confirmDeleteTeam} onOpenChange={(open) => !open && setConfirmDeleteTeam(null)}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-[#0A0A0A] border-[#1F1F1F] text-white">
                    <DialogTitle className="text-xl font-bold">Delete Team</DialogTitle>
                    <div className="py-2">
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to delete <span className="text-white font-medium">{confirmDeleteTeam?.name}</span>? All members will be unassigned and team XP logs will be lost.
                        </p>
                    </div>
                    <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmDeleteTeam(null)}
                            className="bg-transparent text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!!deletingTeam}
                            onClick={() => confirmDeleteTeam && handleDeleteTeam(confirmDeleteTeam.id, confirmDeleteTeam.name)}
                        >
                            {deletingTeam ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Delete Team
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Team XP Confirmation Dialog */}
            <Dialog open={!!confirmDeleteXPLogId} onOpenChange={(open) => !open && setConfirmDeleteXPLogId(null)}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-[#0A0A0A] border-[#1F1F1F] text-white">
                    <DialogTitle className="text-xl font-bold">Remove Team XP Record</DialogTitle>
                    <div className="py-2">
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to remove this XP record? The team's total XP will decrease.
                        </p>
                    </div>
                    <DialogFooter className="mt-2 flex gap-2 sm:justify-end">
                        <Button
                            variant="ghost"
                            disabled={isSaving}
                            onClick={() => setConfirmDeleteXPLogId(null)}
                            className="bg-transparent text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isSaving}
                            onClick={() => confirmDeleteXPLogId && handleDeleteXPLog(confirmDeleteXPLogId)}
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Remove XP
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
