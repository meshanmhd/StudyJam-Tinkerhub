'use client'

import { Task, TaskSubmission } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, timeAgo } from '@/lib/utils'
import { ClockIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface TaskCardProps {
    task: Task
    submission?: TaskSubmission
    userId: string
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

    async function markComplete() {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('task_submissions')
            .insert({ task_id: task.id, user_id: userId, status: 'pending' })
            .select()
            .single()

        if (error) {
            toast.error('Failed to submit task')
        } else {
            setCurrentSub(data as TaskSubmission)
            toast.success('Task submitted! Awaiting admin approval.')
        }
        setLoading(false)
    }

    const overdue = task.deadline && new Date(task.deadline) < new Date() && !currentSub

    return (
        <div className="glass rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300">
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
    )
}
