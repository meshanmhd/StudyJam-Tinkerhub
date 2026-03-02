'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTask, reviewSubmission } from '../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react'

interface Task { id: string; title: string; description?: string; xp_reward: number; deadline?: string; created_at: string }
interface Submission {
    id: string; task_id: string; user_id: string; status: string; submitted_at: string; xp_given?: number;
    task?: { title?: string; xp_reward?: number } | null;
    user?: { name?: string; team?: { team_name?: string } | null } | null;
}

interface TaskManagerClientProps {
    tasks: Task[]
    submissions: Submission[]
}

export function TaskManagerClient({ tasks, submissions }: TaskManagerClientProps) {
    const [showForm, setShowForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [reviewing, setReviewing] = useState<string | null>(null)
    const [localSubmissions, setLocalSubmissions] = useState(submissions)
    const [localTasks, setLocalTasks] = useState(tasks)

    const pending = localSubmissions.filter(s => s.status === 'pending')
    const reviewed = localSubmissions.filter(s => s.status !== 'pending')

    async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setCreating(true)
        const fd = new FormData(e.currentTarget)
        const result = await createTask(fd)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Task created!')
            setShowForm(false)
            // Optimistic update would go here
        }
        setCreating(false)
    }

    async function handleReview(sub: Submission, action: 'approved' | 'rejected') {
        setReviewing(sub.id)
        const xp = (sub.task as { xp_reward?: number } | null)?.xp_reward || 0
        const result = await reviewSubmission(sub.id, action, xp, sub.task_id, sub.user_id)
        if (result.error) toast.error(result.error)
        else {
            toast.success(action === 'approved' ? `Approved! +${xp} XP awarded 🎉` : 'Submission rejected.')
            setLocalSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: action } : s))
        }
        setReviewing(null)
    }

    return (
        <div className="space-y-6">
            {/* Create Task */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                    <h2 className="text-base font-semibold">Tasks ({localTasks.length})</h2>
                    <Button
                        size="sm"
                        onClick={() => setShowForm(!showForm)}
                        className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
                    >
                        <Plus size={14} /> New Task
                    </Button>
                </div>
                {showForm && (
                    <div className="px-5 pb-5 border-t border-border/40">
                        <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 space-y-1.5">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" required className="bg-muted/40" placeholder="Build a REST API" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" name="description" className="bg-muted/40 resize-none" rows={2} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="xp_reward">XP Reward</Label>
                                    <Input id="xp_reward" name="xp_reward" type="number" required min={1} className="bg-muted/40" placeholder="25" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="deadline">Deadline</Label>
                                    <Input id="deadline" name="deadline" type="datetime-local" className="bg-muted/40" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={creating} size="sm" className="bg-primary hover:bg-primary/90">
                                    {creating ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Create Task
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tasks list */}
                <div className="divide-y divide-border/30">
                    {localTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-4 px-5 py-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{task.title}</p>
                                {task.deadline && (
                                    <p className="text-xs text-muted-foreground mt-0.5">Due: {formatDate(task.deadline)}</p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-amber-400 shrink-0">+{task.xp_reward} XP</span>
                        </div>
                    ))}
                    {localTasks.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-6">No tasks yet.</p>
                    )}
                </div>
            </div>

            {/* Pending Submissions */}
            <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    Pending Submissions
                    {pending.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                            {pending.length}
                        </span>
                    )}
                </h2>
                <div className="space-y-2">
                    {pending.map(sub => (
                        <div key={sub.id} className="glass rounded-xl px-4 py-3 border border-amber-500/20 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{(sub.task as { title?: string } | null)?.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(sub.user as { name?: string } | null)?.name} · {(sub.user as { team?: { team_name?: string } | null } | null)?.team?.team_name}
                                </p>
                            </div>
                            <span className="text-sm font-bold text-amber-400 shrink-0">+{(sub.task as { xp_reward?: number } | null)?.xp_reward} XP</span>
                            <div className="flex gap-2 shrink-0">
                                <Button
                                    size="sm" variant="ghost"
                                    disabled={reviewing === sub.id}
                                    onClick={() => handleReview(sub, 'approved')}
                                    className="h-8 gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                    <CheckCircle size={14} /> Approve
                                </Button>
                                <Button
                                    size="sm" variant="ghost"
                                    disabled={reviewing === sub.id}
                                    onClick={() => handleReview(sub, 'rejected')}
                                    className="h-8 gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                >
                                    <XCircle size={14} /> Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                    {pending.length === 0 && (
                        <div className="glass rounded-2xl p-6 text-center">
                            <p className="text-muted-foreground text-sm">No pending submissions 🎉</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
