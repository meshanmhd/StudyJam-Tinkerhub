import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { RefreshButton } from '@/components/ui/refresh-button'
import { formatDate, timeAgo } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Loader2, BookOpen, AlertCircle, Zap } from 'lucide-react'
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

    const totalXpEarned = submissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.xp_given || 0), 0)

    const completedCount = submissions.filter(s => s.status === 'approved').length
    const pendingCount = submissions.filter(s => s.status === 'pending').length
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">Track your progress and earned XP</p>
                </div>
                <RefreshButton />
            </div>

            {/* Summary stats — horizontal row of 4 */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] p-4 text-center">
                    <p className="text-xl font-bold text-white">{activeTasks.length}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Active</p>
                </div>
                <div className="bg-[#0A0A0A] rounded-2xl border border-emerald-500/20 p-4 text-center">
                    <p className="text-xl font-bold text-emerald-400">{completedCount}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Completed</p>
                </div>
                <div className="bg-[#0A0A0A] rounded-2xl border border-amber-500/20 p-4 text-center">
                    <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">In Review</p>
                </div>
                <div className="bg-[#0A0A0A] rounded-2xl border border-amber-500/30 p-4 text-center">
                    <p className="text-xl font-bold text-amber-400">+{totalXpEarned}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">XP Earned</p>
                </div>
            </div>

            {/* ─── Active Tasks ─────────────────────────────────────── */}
            <section>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-1 h-5 rounded-full bg-primary"></div>
                    <h2 className="text-base font-semibold">Active Tasks</h2>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{activeTasks.length}</span>
                    <span className="text-[10px] text-zinc-600 ml-1">+1 hr grace period</span>
                </div>
                {activeTasks.length === 0 ? (
                    <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] p-10 text-center">
                        <p className="text-2xl mb-2">✨</p>
                        <p className="text-zinc-400 text-sm font-medium">No active tasks right now.</p>
                        <p className="text-xs text-zinc-600 mt-1">Check back later for new challenges!</p>
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
            </section>

            {/* ─── Submitted Tasks ──────────────────────────────────── */}
            {submittedTasks.length > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-1 h-5 rounded-full bg-zinc-600"></div>
                        <h2 className="text-base font-semibold">Submitted</h2>
                        <span className="text-xs bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded-full font-medium">{submittedTasks.length}</span>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] overflow-hidden divide-y divide-[#1A1A1A]">
                        {submittedTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                submission={submissionMap[task.id] as TaskSubmission | undefined}
                                userId={user.id}
                                variant="compact"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ─── Missed Tasks ─────────────────────────────────────── */}
            {missedTasks.length > 0 && (
                <section>
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-1 h-5 rounded-full bg-rose-500/50"></div>
                        <h2 className="text-base font-semibold text-zinc-500">Missed</h2>
                        <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">{missedTasks.length}</span>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] overflow-hidden divide-y divide-[#1A1A1A] opacity-60">
                        {missedTasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                submission={undefined}
                                userId={user.id}
                                variant="compact"
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
