'use client'

import { Task, TaskSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, timeAgo } from '@/lib/utils'
import { ClockIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface TaskCardProps {
    task: Task
    submission?: TaskSubmission
    userId: string
}

const LEVEL_COLORS: Record<string, string> = {
    Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Advanced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Expert: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

const STATUS_STYLES = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const STATUS_ICONS = {
    pending: Loader2,
    approved: CheckCircle,
    rejected: XCircle,
}

export function TaskCard({ task, submission, userId }: TaskCardProps) {
    const [loading, setLoading] = useState(false)
    const [currentSub, setCurrentSub] = useState(submission)
    const [open, setOpen] = useState(false)
    const [content, setContent] = useState(currentSub?.content || '')

    async function markComplete() {
        setLoading(true)
        const supabase = createClient()

        let query;
        if (currentSub?.id) {
            query = supabase.from('task_submissions').update({ content, status: 'pending' }).eq('id', currentSub.id).select().single()
        } else {
            query = supabase.from('task_submissions').insert({ task_id: task.id, user_id: userId, content, status: 'pending' }).select().single()
        }

        const { data, error } = await query

        if (error) {
            toast.error('Failed to submit task')
        } else {
            setCurrentSub(data as TaskSubmission)
            toast.success(currentSub?.id ? 'Task resubmitted!' : 'Task submitted! Awaiting admin approval.')
            setOpen(false)
        }
        setLoading(false)
    }

    const overdue = task.deadline && new Date(task.deadline) < new Date() && !currentSub

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="glass rounded-2xl p-5 border border-border/50 ring-1 ring-border/20 shadow-sm hover:border-primary/40 hover:ring-primary/20 cursor-pointer transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-sm">{task.title}</h3>
                                {overdue && (
                                    <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                        Overdue
                                    </span>
                                )}
                            </div>
                            {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {task.deadline && (
                                    <span className="flex items-center gap-1">
                                        <ClockIcon size={11} />
                                        {formatDate(task.deadline)}
                                    </span>
                                )}
                                {currentSub && (
                                    <span className="text-[10px]">Submitted {timeAgo(currentSub.submitted_at)}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-sm font-bold text-amber-400">+{task.xp_reward} XP</span>
                            {currentSub ? (
                                <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${STATUS_STYLES[currentSub.status]}`}>
                                    {currentSub.status === 'pending' && <Loader2 size={10} className="animate-spin" />}
                                    {currentSub.status === 'approved' && <CheckCircle size={10} />}
                                    {currentSub.status === 'rejected' && <XCircle size={10} />}
                                    <span className="capitalize">{currentSub.status}</span>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={markComplete}
                                    disabled={loading}
                                    className="h-7 px-3 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
                                >
                                    {loading ? <Loader2 size={12} className="animate-spin" /> : 'Submit'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Task Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${LEVEL_COLORS[task.level || 'Beginner'] || LEVEL_COLORS['Beginner']}`}>
                                {task.level || 'Beginner'}
                            </span>
                        </div>
                        {task.description && (
                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{task.description}</p>
                        )}
                        {task.deadline && (
                            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40 w-max">
                                <ClockIcon size={12} /> Limit: {formatDate(task.deadline)}
                            </p>
                        )}
                    </div>

                    <hr className="border-border/20 my-4" />

                    {currentSub?.status === 'rejected' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mt-2">
                            <p className="text-xs font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                                <XCircle size={14} /> Submission Rejected
                            </p>
                            {currentSub.admin_comment ? (
                                <p className="text-sm text-foreground/80 mt-2">{currentSub.admin_comment}</p>
                            ) : (
                                <p className="text-sm border-foreground/50 italic mt-2">No feedback provided.</p>
                            )}
                        </div>
                    )}

                    {currentSub?.status === 'approved' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between mt-2">
                            <div>
                                <p className="text-xs font-bold text-emerald-400 mb-0.5 flex items-center gap-1.5">
                                    <CheckCircle size={14} /> Task Approved
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Great job! You completed this task.</p>
                            </div>
                            <span className="text-lg font-bold text-amber-400">+{currentSub.xp_given || task.xp_reward} XP</span>
                        </div>
                    )}

                    {(currentSub?.status !== 'approved' && currentSub?.status !== 'pending' && currentSub?.status !== 'rejected') && (
                        <div className="space-y-2 mt-2">
                            <p className="text-sm text-foreground/90 font-medium">Ready to submit your task?</p>
                            <p className="text-xs text-muted-foreground">Make sure you have completed the requirements off-platform in person before submitting.</p>
                        </div>
                    )}

                    {currentSub?.status === 'pending' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 mt-2">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <ClockIcon size={16} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-amber-500">Submission Under Review</p>
                                <p className="text-xs text-amber-500/70 mt-0.5">Check back later for admin feedback.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Close</Button>
                    {(currentSub?.status !== 'approved' && currentSub?.status !== 'pending') && (
                        <Button
                            size="sm"
                            onClick={markComplete}
                            disabled={loading}
                            className="bg-primary/20 hover:bg-primary/30 text-white font-medium border border-primary/20"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            {currentSub?.status === 'rejected' ? 'Resubmit Task' : 'Submit Task'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
