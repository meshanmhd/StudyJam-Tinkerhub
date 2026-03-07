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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createBadge, assignBadge, removeBadge } from '../actions'
import { Plus, Award, X, Loader2 } from 'lucide-react'

const EMOJI_OPTIONS = [
    '🏆', '⭐', '🔥', '💎', '🚀', '🎯', '🧠', '🌟', '🎓', '💡',
    '🛡️', '🎨', '🔬', '⚡', '🏅', '🌈', '🦁', '👑', '🌍', '🎉',
    '💪', '🎸', '🎭', '🔑', '🧩', '🏗️', '📐', '🧬', '🔭', '🎲',
    '🦋', '🌊', '🌙', '☀️', '🧲', '⚙️', '🛸', '🎪', '🌺', '🦅',
]

interface Student { id: string; name: string }
interface Badge { id: string; name: string; icon?: string; type: string }
interface UserBadge { id: string; user_id: string; badge?: Badge; awarded_at: string }

interface BadgeManagerClientProps {
    students: Student[]
    badges: Badge[]
    userBadges: UserBadge[]
}

export function BadgeManagerClient({ students, badges: initialBadges, userBadges: initialUserBadges }: BadgeManagerClientProps) {
    const router = useRouter()
    const [badges, setBadges] = useState(initialBadges)
    const [userBadges, setUserBadges] = useState(initialUserBadges)

    const [giveOpen, setGiveOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedBadge, setSelectedBadge] = useState('')
    const [giving, setGiving] = useState(false)

    const [createOpen, setCreateOpen] = useState(false)
    const [newBadgeName, setNewBadgeName] = useState('')
    const [newBadgeEmoji, setNewBadgeEmoji] = useState('🏆')
    const [customEmojiInput, setCustomEmojiInput] = useState('')
    const [creating, setCreating] = useState(false)

    const [removing, setRemoving] = useState<string | null>(null)

    const activeEmoji = customEmojiInput.trim() || newBadgeEmoji

    async function handleCreateBadge() {
        if (!newBadgeName.trim()) return toast.error('Badge name is required')
        setCreating(true)
        const result = await createBadge(newBadgeName.trim(), activeEmoji)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Badge created')
            if (result.badge) setBadges(prev => [...prev, result.badge!])
            setNewBadgeName('')
            setNewBadgeEmoji('🏆')
            setCustomEmojiInput('')
            setCreateOpen(false)
            router.refresh()
        }
        setCreating(false)
    }

    async function handleAssignBadge() {
        if (!selectedStudent || !selectedBadge) return toast.error('Please select a student and a badge')
        setGiving(true)
        const result = await assignBadge(selectedStudent, selectedBadge)
        if (result.error) {
            toast.error(result.error)
        } else {
            const studentName = students.find(s => s.id === selectedStudent)?.name
            toast.success(`Badge assigned to ${studentName}`)
            if (result.userBadge) {
                const badge = badges.find(b => b.id === selectedBadge)
                setUserBadges(prev => [...prev, { ...result.userBadge!, badge }])
            }
            setSelectedStudent('')
            setSelectedBadge('')
            setSearchQuery('')
            setGiveOpen(false)
            router.refresh()
        }
        setGiving(false)
    }

    async function handleRemoveBadge(userBadgeId: string) {
        setRemoving(userBadgeId)
        const result = await removeBadge(userBadgeId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Badge removed')
            setUserBadges(prev => prev.filter(ub => ub.id !== userBadgeId))
        }
        setRemoving(null)
    }

    const badgesByStudent = students.map(student => ({
        student,
        badges: userBadges.filter(ub => ub.user_id === student.id),
    }))

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="space-y-6">
            {/* Action buttons */}
            <div className="flex items-center gap-3">
                <Button onClick={() => setGiveOpen(true)} className="gap-2" size="sm">
                    <Award size={14} />
                    Assign Badge
                </Button>
                <Button variant="outline" onClick={() => setCreateOpen(true)} className="gap-2" size="sm">
                    <Plus size={14} />
                    Create Badge
                </Button>
            </div>

            {/* Student list */}
            <div className="space-y-3">
                {badgesByStudent.map(({ student, badges: studentBadges }) => (
                    <div
                        key={student.id}
                        className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] overflow-hidden transition-all hover:border-white/10"
                    >
                        <div className="flex items-center gap-4 px-5 py-3.5">
                            <p className="text-sm font-medium w-48 shrink-0">{student.name}</p>
                            <div className="flex-1 flex flex-wrap gap-1.5">
                                {studentBadges.length === 0 ? (
                                    <span className="text-xs text-muted-foreground/50 italic">No badges</span>
                                ) : (
                                    studentBadges.map(ub => (
                                        <span
                                            key={ub.id}
                                            className="inline-flex items-center gap-1.5 border border-[#1F1F1F] bg-white/[0.02] px-2.5 py-1 rounded-lg text-xs font-semibold text-white/90"
                                        >
                                            <span>{ub.badge?.icon || '🏅'}</span>
                                            <span>{ub.badge?.name || 'Badge'}</span>
                                            <button
                                                onClick={() => handleRemoveBadge(ub.id)}
                                                disabled={removing === ub.id}
                                                className="ml-0.5 hover:text-destructive transition-colors opacity-60 hover:opacity-100"
                                            >
                                                {removing === ub.id ? (
                                                    <Loader2 size={9} className="animate-spin" />
                                                ) : (
                                                    <X size={9} />
                                                )}
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {students.length === 0 && (
                    <div className="rounded-xl border border-[#1F1F1F] p-8 text-center bg-[#0A0A0A]">
                        <p className="text-sm text-zinc-500">No students registered yet.</p>
                    </div>
                )}
            </div>

            {/* Assign Badge Dialog */}
            <Dialog open={giveOpen} onOpenChange={setGiveOpen}>
                <DialogContent className="max-w-sm bg-[#0A0A0A] border border-[#1F1F1F] text-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-white">Assign Badge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-zinc-500 uppercase tracking-wide">Student</Label>
                            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                <SelectTrigger className="h-10 bg-black border-[#1F1F1F] text-white">
                                    <SelectValue placeholder="Select a student…" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="bg-[#0A0A0A] border-[#1F1F1F] text-white">
                                    <div className="p-2 sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#1F1F1F]">
                                        <Input
                                            placeholder="Search student..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.stopPropagation()}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    {filteredStudents.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Badge</Label>
                            <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                                <SelectTrigger className="h-10 bg-black border-[#1F1F1F] text-white">
                                    <SelectValue placeholder="Select a badge…" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="bg-[#0A0A0A] border-[#1F1F1F] text-white">
                                    {badges.map(b => (
                                        <SelectItem key={b.id} value={b.id} className="focus:bg-white/5 focus:text-white border-none">
                                            <span className="flex items-center gap-2"><span>{b.icon}</span> <span>{b.name}</span></span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 pt-2">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => setGiveOpen(false)}>Cancel</Button>
                        <Button className="bg-white text-black hover:bg-gray-200" onClick={handleAssignBadge} disabled={giving}>
                            {giving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Badge Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md bg-[#0A0A0A] border border-[#1F1F1F] text-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold text-white">Create Badge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        {/* Preview — top, full width */}
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#1F1F1F] bg-black">
                            <span className="text-4xl leading-none">{activeEmoji}</span>
                            <div>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5">Preview</p>
                                <p className="text-base font-bold text-white">{newBadgeName || 'Badge title…'}</p>
                            </div>
                        </div>

                        {/* Emoji input + Badge name side by side */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-500 uppercase tracking-wide">Emoji</Label>
                                <Input
                                    placeholder="Paste / type…"
                                    value={customEmojiInput}
                                    onChange={e => setCustomEmojiInput(e.target.value)}
                                    className="h-10 text-lg bg-black border-[#1F1F1F] text-white placeholder:text-zinc-600"
                                    maxLength={4}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-zinc-500 uppercase tracking-wide">Badge Name</Label>
                                <Input
                                    placeholder="e.g. Quick Learner"
                                    value={newBadgeName}
                                    onChange={e => setNewBadgeName(e.target.value)}
                                    className="h-10 bg-black border-[#1F1F1F] text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        {/* Emoji grid picker */}
                        <div>
                            <Label className="text-xs text-zinc-500 uppercase tracking-wide block mb-2">Or pick from grid</Label>
                            <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl border border-[#1F1F1F] bg-black">
                                {EMOJI_OPTIONS.map(emoji => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => { setNewBadgeEmoji(emoji); setCustomEmojiInput('') }}
                                        className={`text-[1.1rem] py-1 rounded transition-all border ${activeEmoji === emoji && !customEmojiInput
                                            ? 'border-white bg-white/10'
                                            : 'border-transparent hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 pt-4">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button className="bg-white text-black hover:bg-gray-200" onClick={handleCreateBadge} disabled={creating}>
                            {creating ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Create Badge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
