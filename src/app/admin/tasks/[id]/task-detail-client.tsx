'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { reviewSubmission, updateTask, endTask, deleteTask } from '../../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Loader2, Hash, FileText, Calendar, Users, Trophy, Pencil, PauseOctagon, Trash2, Check, X, Clock, User } from 'lucide-react'
import { Task, TaskSubmission } from '@/types'

interface SubmissionWithUser extends Omit<TaskSubmission, 'user'> {
    user?: { name?: string; team?: { team_name?: string } | null } | null
}

interface TaskDetailClientProps {
    task: Task
    submissions: SubmissionWithUser[]
}


const inputCls = "w-full px-4 py-2.5 h-11 bg-[#121212] border border-[#1F1F1F] ring-1 ring-white/5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder:text-zinc-600"

export function TaskDetailClient({ task, submissions }: TaskDetailClientProps) {
    const router = useRouter()

    // Review logic
    const [reviewing, setReviewing] = useState<string | null>(null)
    const [localSubmissions, setLocalSubmissions] = useState(submissions)
    const [reviewDialogSub, setReviewDialogSub] = useState<SubmissionWithUser | null>(null)
    const [xpInput, setXpInput] = useState('')
    const [rejectComment, setRejectComment] = useState('')

    // Task Actions Dialogs
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showEndDialog, setShowEndDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Task Actions Loading States
    const [isEditing, setIsEditing] = useState(false)
    const [isEnding, setIsEnding] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Edit form states
    const [editDesc, setEditDesc] = useState(task.description || '')
    const [editTaskType, setEditTaskType] = useState<'individual' | 'team'>(task.task_type || 'individual')

    // ─── REVIEW ACTIONS ───────────────────────────────────────────
    function openReviewDialog(sub: SubmissionWithUser) {
        setReviewDialogSub(sub)
        setXpInput(String(task.xp_reward || 0))
        setRejectComment('')
    }

    async function handleReviewAction(action: 'approved' | 'rejected') {
        if (!reviewDialogSub) return
        setReviewing(reviewDialogSub.id)
        const sub = reviewDialogSub
        const xp = parseInt(xpInput) || 0

        const result = await reviewSubmission(
            sub.id,
            action,
            action === 'approved' ? xp : 0,
            task.id,
            sub.user_id,
            action === 'rejected' ? rejectComment : undefined
        )

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(action === 'approved' ? `Approved! +${xp} XP awarded` : 'Submission rejected.')
            setLocalSubmissions(prev => prev.map(s => s.id === sub.id ? {
                ...s,
                status: action,
                xp_given: action === 'approved' ? xp : undefined,
                admin_comment: action === 'rejected' ? rejectComment : undefined
            } : s))
            setReviewDialogSub(null)
            router.refresh()
        }
        setReviewing(null)
    }

    // ─── TASK ACTIONS ─────────────────────────────────────────────
    async function handleEditTask(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsEditing(true)
        const fd = new FormData(e.currentTarget)
        fd.set('task_type', editTaskType)

        const result = await updateTask(task.id, fd)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Task updated!')
            setShowEditDialog(false)
            router.refresh()
        }
        setIsEditing(false)
    }

    async function handleEndTask() {
        setIsEnding(true)
        const result = await endTask(task.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Task ended immediately.')
            setShowEndDialog(false)
            router.refresh()
        }
        setIsEnding(false)
    }

    async function handleDeleteTask() {
        setIsDeleting(true)
        const result = await deleteTask(task.id)
        if (result.error) {
            toast.error(result.error)
            setIsDeleting(false)
        } else {
            toast.success('Task deleted successfully.')
            setShowDeleteDialog(false)
            router.push('/admin/tasks')
            router.refresh()
        }
    }

    const isPast = task.deadline && new Date(task.deadline) <= new Date()

    return (
        <div className="space-y-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">{task.title}</h1>
                        <span className={`text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider rounded-md border ${isPast ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1.5'}`}>
                            {!isPast && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                            {isPast ? 'Ended' : 'Active'}
                        </span>
                    </div>
                    {task.description && <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">{task.description}</p>}
                </div>
                <div className="flex items-center flex-wrap gap-3 shrink-0">
                    <Button
                        onClick={() => {
                            setEditDesc(task.description || '')
                            setEditTaskType(task.task_type || 'individual')
                            setShowEditDialog(true)
                        }}
                        variant="outline"
                        className="h-9 bg-transparent border-[#1F1F1F] text-zinc-300 hover:bg-white/5 hover:text-white rounded-xl text-xs font-semibold px-4 transition-colors flex-1 sm:flex-none"
                    >
                        <Pencil size={14} className="mr-2" />
                        Edit Task
                    </Button>
                    {!isPast && (
                        <Button
                            onClick={() => setShowEndDialog(true)}
                            variant="outline"
                            className="h-9 bg-transparent border-[#1F1F1F] text-zinc-300 hover:bg-white/5 hover:text-white rounded-xl text-xs font-semibold px-4 transition-colors flex-1 sm:flex-none"
                        >
                            <PauseOctagon size={14} className="mr-2" />
                            End Task
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        className="h-9 bg-transparent border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 rounded-xl text-xs font-semibold px-4 transition-colors flex-1 sm:flex-none"
                    >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Properties Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy size={16} className="text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">XP Reward</span>
                    </div>
                    <p className="text-2xl font-bold text-white tracking-tight">{task.xp_reward.toLocaleString()} <span className="text-sm font-medium text-zinc-500">XP</span></p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar size={14} className="text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Due Date</span>
                    </div>
                    <p className="text-2xl font-bold text-white tracking-tight">{task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Due Date'}</p>
                </div>

                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl p-6 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={16} className="text-zinc-500" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Task Type</span>
                    </div>
                    <p className="text-2xl font-bold text-white tracking-tight capitalize">{task.task_type} Project</p>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Submissions</h2>

                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase font-bold text-zinc-500 bg-white/[0.02] border-b border-[#1F1F1F]">
                                <tr>
                                    <th className="px-6 py-4 tracking-wider">Student / Team</th>
                                    <th className="px-6 py-4 tracking-wider">Submitted On</th>
                                    <th className="px-6 py-4 tracking-wider">Status</th>
                                    <th className="px-6 py-4 tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F1F1F]">
                                {localSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                            No submissions yet.
                                        </td>
                                    </tr>
                                ) : (
                                    localSubmissions.map((sub, idx) => {
                                        const isPending = sub.status === 'pending'
                                        const isApproved = sub.status === 'approved'
                                        const isRejected = sub.status === 'rejected'

                                        const name = task.task_type === 'team' ? (sub.user?.team?.team_name || 'Unknown Team') : (sub.user?.name || 'Unknown User')
                                        const initials = name.substring(0, 2).toUpperCase()
                                        const tId = `T${idx + 1}`

                                        return (
                                            <tr key={sub.id} className={`hover:bg-white/[0.02] transition-colors ${reviewing === sub.id ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                                                            {tId}
                                                        </div>
                                                        <span className="font-semibold text-white">{name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-zinc-400 text-xs font-medium">
                                                    {formatDate(sub.submitted_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isPending && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-wide">
                                                            Pending Review
                                                        </span>
                                                    )}
                                                    {isApproved && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px] font-bold tracking-wide">
                                                            Approved
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold tracking-wide">
                                                            Rejected
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {isPending ? (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openReviewDialog(sub)}
                                                            className="bg-white/5 text-white hover:bg-white/10 h-8 text-xs font-semibold px-5 rounded-lg transition-colors border-none"
                                                        >
                                                            Review
                                                        </Button>
                                                    ) : (
                                                        <span className="text-zinc-500 text-xs font-semibold pr-4">View</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Combined Review Dialog */}
            <Dialog open={!!reviewDialogSub} onOpenChange={(open) => { if (!open) setReviewDialogSub(null) }}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar border-[#1F1F1F] bg-[#121212] rounded-2xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Submission</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Submission From</p>
                            <p className="text-sm font-bold mt-1 text-white">{reviewDialogSub?.user?.name}</p>
                            {reviewDialogSub?.user?.team?.team_name && (
                                <p className="text-xs text-zinc-500">{reviewDialogSub.user.team.team_name}</p>
                            )}
                        </div>

                        {reviewDialogSub?.content && (
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Submission Content</Label>
                                <div className="bg-black border border-[#1F1F1F] rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                                    {reviewDialogSub.content}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">XP to Award (If Approving)</Label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                                    <input
                                        type="number"
                                        min={0}
                                        value={xpInput}
                                        onChange={e => setXpInput(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 bg-black border border-[#1F1F1F] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all text-white placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Reason (If Rejecting)</Label>
                                <textarea
                                    rows={2}
                                    value={rejectComment}
                                    onChange={e => setRejectComment(e.target.value)}
                                    placeholder="Explain what needs to be fixed..."
                                    className="w-full px-4 py-3 bg-black border border-[#1F1F1F] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition-all text-white placeholder:text-zinc-600 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#1F1F1F]">
                        <div className="flex w-full gap-3">
                            <Button
                                variant="outline"
                                disabled={reviewing === reviewDialogSub?.id}
                                onClick={() => handleReviewAction('rejected')}
                                className="flex-1 rounded-xl text-rose-400 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors h-10 font-bold bg-transparent"
                            >
                                <X size={16} className="mr-2" /> Reject
                            </Button>
                            <Button
                                disabled={reviewing === reviewDialogSub?.id}
                                onClick={() => handleReviewAction('approved')}
                                className="flex-1 bg-white text-black hover:bg-gray-200 rounded-xl h-10 font-bold transition-colors"
                            >
                                {reviewing === reviewDialogSub?.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} className="mr-2" />}
                                Approve
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* EDIT Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#121212] border-[#1F1F1F]">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditTask} className="space-y-4 pt-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Task Title</Label>
                            <input id="title" name="title" required defaultValue={task.title} className="w-full px-4 py-3 bg-[#121212] border border-[#1F1F1F] ring-1 ring-white/1 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/1 focus:border-white transition-all text-white placeholder:text-zinc-600" />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Description</Label>
                            </div>
                            <textarea
                                id="description" name="description" rows={3}
                                value={editDesc} onChange={e => setEditDesc(e.target.value)}
                                className="w-full px-4 py-3 bg-[#121212] border border-[#1F1F1F] ring-1 ring-white/1 rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-white/1 focus:border-white transition-all text-white placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Task Type */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Task Type</Label>
                            <div className="flex gap-2 h-11">
                                <button
                                    type="button"
                                    onClick={() => setEditTaskType('individual')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs transition-all ${editTaskType === 'individual' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:border-white/20 bg-transparent'}`}
                                >
                                    <User size={14} /> Individual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditTaskType('team')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs transition-all ${editTaskType === 'team' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-500 hover:border-white/20 bg-transparent'}`}
                                >
                                    <Users size={14} /> Team
                                </button>
                            </div>
                        </div>

                        {/* XP + Deadline row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">XP Reward</Label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
                                    <input id="xp_reward" name="xp_reward" type="number" required min={1} defaultValue={task.xp_reward}
                                        className="w-full pl-9 pr-4 py-2.5 h-11 bg-[#121212] border border-[#1F1F1F] ring-1 ring-white/1 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500/1 transition-all text-white" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Deadline</Label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <Calendar size={14} className="absolute right-4.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                                    <input id="deadline" name="deadline" type="datetime-local" defaultValue={task.deadline ? task.deadline.slice(0, 16) : ''}
                                        onClick={(e) => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()}
                                        className="w-full pl-9 pr-4 py-2.5 h-11 bg-[#121212] border border-[#1F1F1F] ring-1 ring-white/1 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white focus:border-white/1 transition-all cursor-pointer text-white" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 mt-2">
                            <Button variant="ghost" type="button" onClick={() => setShowEditDialog(false)} className="rounded-xl px-5 text-zinc-400 hover:text-white hover:bg-white/5">Cancel</Button>
                            <Button type="submit" disabled={isEditing} className="bg-white text-black hover:bg-gray-200 rounded-xl px-5 transition-colors">
                                {isEditing ? <><Loader2 size={14} className="animate-spin mr-1.5" />Saving…</> : <>Save Changes</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* END Dialog */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent className="sm:max-w-[400px] bg-[#121212] border-[#1F1F1F]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PauseOctagon className="text-amber-500" size={18} />
                            End Task Early
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-2">
                            Are you sure you want to end this task now? Students will no longer be able to submit their work.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="ghost" disabled={isEnding} onClick={() => setShowEndDialog(false)} className="rounded-xl text-zinc-400 hover:text-white hover:bg-white/5">Cancel</Button>
                        <Button
                            disabled={isEnding}
                            onClick={handleEndTask}
                            className="bg-amber-500 text-amber-950 hover:bg-amber-400 rounded-xl font-bold transition-colors"
                        >
                            {isEnding ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            Yes, End Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[400px] bg-[#121212] border-[#1F1F1F]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-500">
                            <Trash2 size={18} />
                            Delete Task
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-2">
                            This action cannot be undone. All submissions and XP related to this task might be affected.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="pt-4">
                        <Button variant="ghost" disabled={isDeleting} onClick={() => setShowDeleteDialog(false)} className="rounded-xl text-zinc-400 hover:text-white hover:bg-white/5">Cancel</Button>
                        <Button
                            disabled={isDeleting}
                            onClick={handleDeleteTask}
                            className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl transition-colors border-none"
                        >
                            {isDeleting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            Delete Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


