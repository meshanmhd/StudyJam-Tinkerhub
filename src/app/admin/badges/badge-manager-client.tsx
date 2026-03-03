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
import { getBadgeColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
            <div className="space-y-2">
                {badgesByStudent.map(({ student, badges: studentBadges }) => (
                    <div
                        key={student.id}
                        className="rounded-xl border border-border/40 bg-card/60 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 px-5 py-3">
                            <p className="text-sm font-medium w-48 shrink-0">{student.name}</p>
                            <div className="flex-1 flex flex-wrap gap-1.5">
                                {studentBadges.length === 0 ? (
                                    <span className="text-xs text-muted-foreground/50 italic">No badges</span>
                                ) : (
                                    studentBadges.map(ub => (
                                        <span
                                            key={ub.id}
                                            className={cn("inline-flex items-center gap-1 border px-2.5 py-0.5 rounded-full text-xs font-medium", getBadgeColor(ub.badge?.name || ''))}
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
                    <div className="rounded-xl border border-border/40 p-8 text-center bg-card/60">
                        <p className="text-sm text-muted-foreground">No students registered yet.</p>
                    </div>
                )}
            </div>

            {/* Assign Badge Dialog */}
            <Dialog open={giveOpen} onOpenChange={setGiveOpen}>
                <DialogContent className="max-w-sm bg-card border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Assign Badge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Student</Label>
                            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select a student…" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Badge</Label>
                            <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select a badge…" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                    {badges.map(b => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.icon} {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setGiveOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleAssignBadge} disabled={giving} className="min-w-24">
                            {giving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Assign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Badge Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Create Badge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Badge Name</Label>
                            <Input
                                placeholder="e.g. Quick Learner"
                                value={newBadgeName}
                                onChange={e => setNewBadgeName(e.target.value)}
                                className="h-9"
                            />
                        </div>

                        {/* Emoji section */}
                        <div className="space-y-3">
                            <div className="flex items-end gap-3">
                                {/* Preview */}
                                <div className="flex-1 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Icon Preview</Label>
                                    <div className="h-9 flex items-center gap-2 px-3 rounded-md border border-border/40 bg-muted/20">
                                        <span className="text-xl">{activeEmoji}</span>
                                        <span className="text-sm text-muted-foreground">{newBadgeName || 'Badge name…'}</span>
                                    </div>
                                </div>
                                {/* Custom input */}
                                <div className="w-36 space-y-1.5">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type Emoji</Label>
                                    <Input
                                        placeholder="Paste / type…"
                                        value={customEmojiInput}
                                        onChange={e => setCustomEmojiInput(e.target.value)}
                                        className="h-9 text-lg"
                                        maxLength={4}
                                    />
                                </div>
                            </div>

                            {/* Grid */}
                            <div>
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Or pick from grid</Label>
                                <div className="grid grid-cols-10 gap-1">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => { setNewBadgeEmoji(emoji); setCustomEmojiInput('') }}
                                            className={`text-xl p-1 rounded-md transition-all border ${activeEmoji === emoji && !customEmojiInput
                                                ? 'border-primary bg-primary/15'
                                                : 'border-transparent hover:border-border/50 hover:bg-muted/30'
                                                }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleCreateBadge} disabled={creating} className="min-w-28">
                            {creating ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Create Badge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
