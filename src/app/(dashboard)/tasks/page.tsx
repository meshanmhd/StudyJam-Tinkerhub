import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { RefreshButton } from '@/components/ui/refresh-button'
import { formatDate, timeAgo } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Loader2, ClipboardList, BookOpen, Trophy } from 'lucide-react'
import type { Task, TaskSubmission } from '@/types'

import { TaskCard } from '@/components/dashboard/task-card'

export default async function TasksPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [tasksRes, submissionsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase
            .from('task_submissions')
            .select('*, task:tasks(title, xp_reward, task_type)')
            .eq('user_id', user.id)
            .order('submitted_at', { ascending: false }),
    ])

    const tasks: Task[] = tasksRes.data || []
    const submissions: TaskSubmission[] = submissionsRes.data || []

    const submissionMap = Object.fromEntries(submissions.map(s => [s.task_id, s]))

    const now = new Date()
    const ONE_HOUR = 60 * 60 * 1000

    // Active: not submitted AND (no deadline, or within deadline + grace)
    const activeTasks = tasks.filter(t => {
        const hasSubmitted = !!submissionMap[t.id]
        if (hasSubmitted) return false
        if (!t.deadline) return true
        const deadlinePlusGrace = new Date(new Date(t.deadline).getTime() + ONE_HOUR)
        return deadlinePlusGrace > now
    })

    // Submitted: tasks with a submission
    const submittedTasks = tasks.filter(t => !!submissionMap[t.id])

    // Missed: deadline passed, no submission
    const missedTasks = tasks.filter(t => {
        if (!t.deadline) return false
        if (submissionMap[t.id]) return false
        const deadlinePlusGrace = new Date(new Date(t.deadline).getTime() + ONE_HOUR)
        return deadlinePlusGrace <= now
    })

    const STATUS_STYLES = {
        pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    }

    const totalXpEarned = submissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.xp_given || 0), 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">Track your task progress and earned XP</p>
                </div>
                <RefreshButton />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-2xl p-4 border border-emerald-500/20 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{submissions.filter(s => s.status === 'approved').length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-amber-500/20 text-center">
                    <p className="text-2xl font-bold text-amber-400">{submissions.filter(s => s.status === 'pending').length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
                </div>
                <div className="glass rounded-2xl p-4 border border-primary/20 text-center">
                    <p className="text-2xl font-bold text-amber-400">+{totalXpEarned}</p>
                    <p className="text-xs text-muted-foreground mt-1">XP Earned</p>
                </div>
            </div>

            {/* Active Tasks */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <BookOpen size={16} className="text-primary" />
                    <h2 className="text-base font-semibold">Active Tasks</h2>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activeTasks.length}</span>
                    <span className="text-xs bg-muted/20 text-muted-foreground px-2 py-0.5 rounded-full ml-1">+1hr Grace</span>
                </div>
                {activeTasks.length === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center border border-border/20">
                        <p className="text-2xl mb-2">✨</p>
                        <p className="text-muted-foreground text-sm">No active tasks right now.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                submission={submissionMap[task.id] as TaskSubmission | undefined}
                                userId={user.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Submitted Tasks */}
            {submittedTasks.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardList size={16} className="text-muted-foreground" />
                        <h2 className="text-base font-semibold">Submitted</h2>
                        <span className="text-xs bg-muted/20 text-muted-foreground px-2 py-0.5 rounded-full">{submittedTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                        {submittedTasks.map(task => {
                            const sub = submissionMap[task.id]
                            const status = sub.status as 'pending' | 'approved' | 'rejected'
                            return (
                                <div key={task.id} className={`glass rounded-xl px-4 py-3.5 border transition-all ${status === 'approved' ? 'border-emerald-500/20' : status === 'rejected' ? 'border-rose-500/20' : 'border-amber-500/20'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium">{task.title}</p>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${task.task_type === 'team' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {task.task_type === 'team' ? 'Team' : 'Individual'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">Submitted {timeAgo(sub.submitted_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {status === 'approved' && sub.xp_given && (
                                                <span className="text-sm font-bold text-amber-400">+{sub.xp_given} XP</span>
                                            )}
                                            <div className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>
                                                {status === 'pending' && <Loader2 size={10} className="animate-spin" />}
                                                {status === 'approved' && <CheckCircle size={10} />}
                                                {status === 'rejected' && <XCircle size={10} />}
                                                <span className="capitalize">{status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Missed Tasks */}
            {missedTasks.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={16} className="text-rose-400" />
                        <h2 className="text-base font-semibold text-rose-400/80">Missed</h2>
                        <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">{missedTasks.length}</span>
                    </div>
                    <div className="space-y-2 opacity-60">
                        {missedTasks.map(task => (
                            <div key={task.id} className="glass rounded-xl px-4 py-3.5 border border-rose-500/10 grayscale-[0.4]">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{task.title}</p>
                                        {task.deadline && (
                                            <p className="text-xs text-rose-400/70 mt-0.5 flex items-center gap-1">
                                                <Clock size={10} /> Ended: {formatDate(task.deadline)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-muted-foreground/50 shrink-0">+{task.xp_reward} XP</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
