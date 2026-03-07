'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Trophy, Trash2, Pencil, Zap, X, Check, Loader2 } from 'lucide-react'
import { assignXpToStudent, deleteXpLog, updateStudentProfile } from './actions'

export type DBStudent = {
    id: string
    name: string
    email: string
    individual_xp: number
    streak_days: number
    longest_streak: number
    last_activity_date: string | null
    team_id: string | null
    team: { id: string; team_name: string } | null
}

export type DBXPLog = {
    id: string
    user_id: string | null
    team_id: string | null
    category: string
    xp_value: number
    reason: string
    created_at: string
}

export function StudentsClient({
    students,
    xpLogs,
    teams,
    userScores
}: {
    students: DBStudent[]
    xpLogs: DBXPLog[]
    teams: { id: string; team_name: string }[]
    userScores: { user_id: string; total_score: number; impact_score: number; final_score: number; rank?: number }[]
}) {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<DBStudent | null>(null)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    // 'view' | 'edit' | 'xp'
    const [activePanel, setActivePanel] = useState<'view' | 'edit' | 'xp'>('view')

    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editTeamId, setEditTeamId] = useState('')

    const [xpValue, setXpValue] = useState('')
    const [xpReason, setXpReason] = useState('')

    const [isSaving, setIsSaving] = useState(false)
    const [confirmDeleteXpId, setConfirmDeleteXpId] = useState<string | null>(null)

    const handleStudentClick = (student: DBStudent) => {
        setSelectedStudent(student)
        setEditName(student.name)
        setEditEmail(student.email)
        setEditTeamId(student.team_id || '')
        setActivePanel('view')
        setXpValue('')
        setXpReason('')
        setIsProfileOpen(true)
    }

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.team?.team_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const sortedStudents = [...students].sort((a, b) => b.individual_xp - a.individual_xp)
    const getRank = (id: string) => sortedStudents.findIndex(s => s.id === id) + 1

    const studentXLogs = selectedStudent
        ? xpLogs.filter(log => log.user_id === selectedStudent.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []

    const handleSaveProfile = async () => {
        if (!selectedStudent) return
        setIsSaving(true)
        const res = await updateStudentProfile(selectedStudent.id, editName, editEmail, editTeamId.length > 0 ? editTeamId : null)
        if (res.error) toast.error(res.error)
        else {
            toast.success('Profile updated')
            setSelectedStudent({ ...selectedStudent, name: editName, email: editEmail, team_id: editTeamId || null, team: teams.find(t => t.id === editTeamId) || null })
            setActivePanel('view')
            router.refresh()
        }
        setIsSaving(false)
    }

    const handleAssignXP = async () => {
        if (!selectedStudent || !xpValue || !xpReason) return
        setIsSaving(true)
        const res = await assignXpToStudent(selectedStudent.id, parseInt(xpValue), xpReason)
        if (res.error) toast.error(res.error)
        else {
            toast.success(`+${xpValue} XP assigned`)
            setActivePanel('view')
            setXpValue('')
            setXpReason('')
            router.refresh()
        }
        setIsSaving(false)
    }

    const handleDeleteXP = async (logId: string) => {
        setIsSaving(true)
        const res = await deleteXpLog(logId)
        if (res.error) toast.error(res.error)
        else {
            toast.success('XP record removed')
            router.refresh()
            setConfirmDeleteXpId(null)
        }
        setIsSaving(false)
    }

    const initials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Students</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">{students.length} enrolled</p>
                </div>
                <div className="relative w-full md:w-56 md:ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all text-white placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-semibold text-zinc-600 bg-white/[0.02] border-b border-[#1F1F1F]">
                            <tr>
                                <th className="px-5 py-3 tracking-wider">Student</th>
                                <th className="px-5 py-3 tracking-wider">Team</th>
                                <th className="px-5 py-3 tracking-wider">XP</th>
                                <th className="px-5 py-3 tracking-wider">Rank</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F1F1F]">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-600 text-sm">No students found.</td></tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr
                                        key={s.id}
                                        onClick={() => handleStudentClick(s)}
                                        className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-semibold text-xs">
                                                    {initials(s.name)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white group-hover:text-zinc-200 transition-colors">{s.name}</div>
                                                    <div className="text-xs text-zinc-600">{s.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {s.team?.team_name ? (
                                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px] text-zinc-300 uppercase tracking-wider">{s.team.team_name}</span>
                                            ) : (
                                                <span className="text-zinc-600 text-[11px]">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-white font-medium">{s.individual_xp.toLocaleString()}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <Trophy size={12} className={getRank(s.id) <= 3 ? 'text-amber-400' : 'text-zinc-700'} />
                                                <span className={`text-xs font-semibold ${getRank(s.id) <= 3 ? 'text-amber-400' : 'text-zinc-400'}`}>#{getRank(s.id)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-lg bg-[#0A0A0A] border-[#1F1F1F] p-0 overflow-hidden text-white gap-0 max-h-[85vh] h-[85vh] flex flex-col">
                    <DialogTitle className="sr-only">Student Profile</DialogTitle>

                    {selectedStudent && (
                        <>
                            {/* Dialog Header — identity strip */}
                            <div className="flex items-center gap-5 px-6 py-6 border-b border-[#1F1F1F] relative">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                    {initials(selectedStudent.name)}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                    <p className="text-xl font-bold text-white tracking-tight truncate leading-none mb-1">{selectedStudent.name}</p>
                                    <div className="flex flex-col items-start gap-1.5">
                                        <p className="text-sm text-zinc-400 truncate leading-none">{selectedStudent.email}</p>
                                        {selectedStudent.team?.team_name && (
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-white/10 border border-white/20 text-zinc-300 leading-none">
                                                {selectedStudent.team.team_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 divide-x divide-[#1F1F1F] border-b border-[#1F1F1F]">
                                {[
                                    { label: 'Total XP', value: selectedStudent.individual_xp.toLocaleString() },
                                    { label: 'Impact', value: userScores.find(s => s.user_id === selectedStudent.id)?.final_score?.toFixed(1) || '0.0' },
                                    { label: 'Rank', value: `#${getRank(selectedStudent.id)}` },
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
                                    onClick={() => setActivePanel('view')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'view' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    XP Log
                                </button>
                                <button
                                    onClick={() => setActivePanel('edit')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'edit' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Pencil size={11} /> Edit Profile
                                </button>
                                <button
                                    onClick={() => setActivePanel('xp')}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activePanel === 'xp' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Zap size={11} /> Assign XP
                                </button>
                            </div>

                            {/* Panel Content (Scrollable) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {/* === XP Log === */}
                                {activePanel === 'view' && (
                                    <div className="divide-y divide-[#1F1F1F]">
                                        {studentXLogs.length === 0 ? (
                                            <div className="py-14 text-center text-zinc-600 text-sm">No XP records yet.</div>
                                        ) : (
                                            studentXLogs.map((log) => (
                                                <div key={log.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.025] transition-colors group">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-white truncate">{log.reason}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-zinc-600">
                                                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-500">{log.category}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                                        <span className="text-sm font-semibold text-white">+{log.xp_value}</span>
                                                        <button
                                                            onClick={() => setConfirmDeleteXpId(log.id)}
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

                                {/* === Edit Profile === */}
                                {activePanel === 'edit' && (
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">Name</Label>
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">Email</Label>
                                                <input
                                                    value={editEmail}
                                                    onChange={e => setEditEmail(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">Team</Label>
                                                <select
                                                    value={editTeamId}
                                                    onChange={e => setEditTeamId(e.target.value)}
                                                    className="w-full px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                                >
                                                    <option value="">No Team</option>
                                                    {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <Button onClick={handleSaveProfile} disabled={isSaving} size="sm" className="bg-white text-black text-xs font-semibold h-8 rounded-md hover:bg-zinc-200">
                                                <Check size={13} className="mr-1" /> Save
                                            </Button>
                                            <Button onClick={() => setActivePanel('view')} variant="ghost" size="sm" className="h-8 text-xs text-zinc-500 hover:text-white rounded-md">
                                                <X size={13} className="mr-1" /> Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* === Assign XP === */}
                                {activePanel === 'xp' && (
                                    <div className="p-5 space-y-4">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">XP Amount</Label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={xpValue}
                                                    onChange={e => setXpValue(e.target.value)}
                                                    placeholder="e.g. 100"
                                                    className="w-full px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-zinc-500 uppercase tracking-wider">Reason</Label>
                                                <input
                                                    value={xpReason}
                                                    onChange={e => setXpReason(e.target.value)}
                                                    placeholder="e.g. Exceptional contribution"
                                                    className="w-full px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <Button onClick={handleAssignXP} disabled={isSaving || !xpValue || !xpReason} size="sm" className="bg-white text-black text-xs font-semibold h-8 rounded-md hover:bg-zinc-200">
                                                <Zap size={13} className="mr-1" /> Assign XP
                                            </Button>
                                            <Button onClick={() => setActivePanel('view')} variant="ghost" size="sm" className="h-8 text-xs text-zinc-500 hover:text-white rounded-md">
                                                <X size={13} className="mr-1" /> Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete XP Confirmation Dialog */}
            <Dialog open={!!confirmDeleteXpId} onOpenChange={(open) => !open && setConfirmDeleteXpId(null)}>
                <DialogContent aria-describedby={undefined} className="sm:max-w-md bg-[#0A0A0A] border-[#1F1F1F] text-white">
                    <DialogTitle className="text-xl font-bold">Remove XP Record</DialogTitle>
                    <div className="py-2">
                        <p className="text-sm text-zinc-400">
                            Are you sure you want to remove this XP record? The student's total XP will decrease.
                        </p>
                    </div>
                    <div className="mt-4 flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => setConfirmDeleteXpId(null)}
                            className="bg-transparent text-zinc-400 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => confirmDeleteXpId && handleDeleteXP(confirmDeleteXpId)}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            Remove XP
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
