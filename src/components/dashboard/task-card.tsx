'use client'

import { Task, TaskSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { formatDate, timeAgo } from '@/lib/utils'
import { ClockIcon, CheckCircle, XCircle, Loader2, AlertCircle, Zap } from 'lucide-react'
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

interface TaskCardProps {
    task: Task
    submission?: TaskSubmission
    userId: string
    variant?: 'default' | 'compact'
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

export function TaskCard({ task, submission, userId, variant = 'default' }: TaskCardProps) {
    const [loading, setLoading] = useState(false)
    const [currentSub, setCurrentSub] = useState(submission)
    const [open, setOpen] = useState(false)

    async function markComplete() {
        setLoading(true)
        const supabase = createClient()

        // Use upsert so that even if the user submits from a stale session on
        // another device, it merges into the existing row instead of creating
        // a duplicate. The DB unique constraint on (task_id, user_id) is the
        // true guard; upsert makes the failure graceful on the client side.
        const isResubmission = !!currentSub?.id
        const { data, error } = await supabase
            .from('task_submissions')
            .upsert(
                {
                    ...(currentSub?.id ? { id: currentSub.id } : {}),
                    task_id: task.id,
                    user_id: userId,
                    content: currentSub?.content || '',
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                },
                { onConflict: 'task_id,user_id' }
            )
            .select()
            .single()

        if (error) {
            console.error('Submission error:', error)
            if (error.message?.includes('row-level security') || error.message?.includes('duplicate')) {
                toast.error('Task already submitted. Please refresh the page to see changes.')
            } else {
                toast.error(`Failed to submit: ${error.message}`)
            }
        } else {
            const returnedData = Array.isArray(data) ? data[0] : data
            setCurrentSub(returnedData as TaskSubmission)
            toast.success(isResubmission ? 'Task resubmitted!' : 'Task submitted! Awaiting admin approval.')
            setOpen(false)
        }
        setLoading(false)
    }

    const overdue = !!(task.deadline && new Date(task.deadline) < new Date() && !currentSub)
    const status = currentSub?.status
    const borderAccent = status === 'approved' ? 'border-l-emerald-500' : status === 'rejected' ? 'border-l-rose-500' : status === 'pending' ? 'border-l-amber-500' : overdue ? 'border-l-rose-500/50' : 'border-l-zinc-700'

    const TriggerContent = variant === 'compact' ? (
        <div className={`flex items-center gap-4 px-5 py-4 border-l-2 ${borderAccent} hover:bg-white/[0.04] transition-colors cursor-pointer text-left`}>
            {/* Status Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${status === 'approved' ? 'bg-emerald-500/15' :
                status === 'rejected' ? 'bg-rose-500/15' :
                    status === 'pending' ? 'bg-amber-500/15' :
                        overdue ? 'bg-rose-500/10' : 'bg-zinc-800'
                }`}>
                {status === 'pending' && <Loader2 size={14} className="text-amber-400 animate-spin" />}
                {status === 'approved' && <CheckCircle size={14} className="text-emerald-400" />}
                {status === 'rejected' && <XCircle size={14} className="text-rose-400" />}
                {!status && overdue && <AlertCircle size={14} className="text-rose-400/50" />}
                {!status && !overdue && <ClockIcon size={14} className="text-zinc-500" />}
            </div>

            {/* Middle Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold truncate ${overdue && !status ? 'text-zinc-400' : 'text-white'}`}>{task.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-zinc-500/10 text-zinc-400 border-zinc-500/20 shrink-0">
                        {task.level || 'Beginner'}
                    </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                    {currentSub && `Submitted ${timeAgo(currentSub.submitted_at)}`}
                    {!currentSub && task.deadline && `End${overdue ? 'ed' : 's'} ${formatDate(task.deadline)}`}
                </p>
            </div>

            {/* Right Content */}
            <div className="flex items-center gap-3 shrink-0">
                {status === 'approved' && currentSub?.xp_given ? (
                    <span className="flex items-center gap-1 text-sm font-bold text-amber-400">
                        <Zap size={12} />+{currentSub?.xp_given}
                    </span>
                ) : (
                    <span className={`text-sm font-bold ${overdue && !status ? 'text-zinc-600' : 'text-amber-400/50'}`}>+{task.xp_reward} XP</span>
                )}
                {status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                        {status}
                    </span>
                )}
            </div>
        </div>
    ) : (
        <div className="glass rounded-2xl p-5 border border-border/50 ring-1 ring-border/20 shadow-sm hover:border-primary/40 hover:ring-primary/20 cursor-pointer transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{task.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${LEVEL_COLORS[task.level || 'Beginner'] || LEVEL_COLORS['Beginner']}`}>
                            {task.level || 'Beginner'}
                        </span>
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
                        <div className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                            <span>To Do</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {TriggerContent}
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
                            {!!currentSub?.admin_comment ? (
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

                    {!currentSub && !overdue && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-2">
                            <p className="text-sm text-foreground/90 font-medium">Ready to submit your task?</p>
                            <p className="text-xs text-muted-foreground mt-1">Make sure you have completed the requirements off-platform in person before submitting.</p>
                        </div>
                    )}

                    {!currentSub && overdue && (
                        <div className="space-y-2 mt-2 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                            <p className="text-sm text-rose-400 font-bold flex items-center gap-1.5">
                                <AlertCircle size={14} /> Task Deadline Passed
                            </p>
                            <p className="text-xs text-rose-400/80">This task can no longer be submitted.</p>
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
                    {(!currentSub || (currentSub.status === 'rejected' && currentSub.allow_resubmission !== false)) && !overdue && (
                        <Button
                            size="sm"
                            onClick={markComplete}
                            disabled={loading || overdue}
                            className={`bg-white hover:bg-white/80 text-black font-medium transition-colors ${loading ? 'opacity-80' : ''}`}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
                            {currentSub?.status === 'rejected' ? 'Resubmit Task' : 'Submit for Review'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
