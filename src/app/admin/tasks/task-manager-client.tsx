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
} from '@/components/ui/dialog'
import { createTask, reviewSubmission } from '../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Plus, Loader2, ClipboardList, Clock, Hash, Users, User } from 'lucide-react'

interface Task {
    id: string
    title: string
    description?: string
    xp_reward: number
    task_type: 'individual' | 'team'
    deadline?: string
    created_at: string
}

interface Submission {
    id: string; task_id: string; user_id: string; status: string; submitted_at: string; xp_given?: number
    task?: { title?: string; xp_reward?: number; task_type?: string; deadline?: string } | null
    user?: { name?: string; team?: { team_name?: string } | null } | null
}

interface TaskManagerClientProps {
    tasks: Task[]
    submissions: Submission[]
}

type SortKey = 'deadline' | 'submitted_at' | 'student' | 'task'

const MAX_DESC = 300

export function TaskManagerClient({ tasks, submissions }: TaskManagerClientProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [reviewing, setReviewing] = useState<string | null>(null)
    const [localSubmissions, setLocalSubmissions] = useState(submissions)
    const [localTasks, setLocalTasks] = useState(tasks)
    const [desc, setDesc] = useState('')
    const [taskType, setTaskType] = useState<'individual' | 'team'>('individual')
    const [sortKey, setSortKey] = useState<SortKey>('deadline')

    // XP prompt dialog
    const [approveDialogSub, setApproveDialogSub] = useState<Submission | null>(null)
    const [xpInput, setXpInput] = useState('')

    const pending = localSubmissions.filter(s => s.status === 'pending')
    const reviewed = localSubmissions.filter(s => s.status !== 'pending')

    // Sort pending submissions
    const sortedPending = [...pending].sort((a, b) => {
        if (sortKey === 'deadline') {
            const da = a.task?.deadline ? new Date(a.task.deadline).getTime() : 0
            const db = b.task?.deadline ? new Date(b.task.deadline).getTime() : 0
            return da - db
        }
        if (sortKey === 'submitted_at') return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        if (sortKey === 'student') return ((a.user as { name?: string } | null)?.name || '').localeCompare((b.user as { name?: string } | null)?.name || '')
        if (sortKey === 'task') return ((a.task as { title?: string } | null)?.title || '').localeCompare((b.task as { title?: string } | null)?.title || '')
        return 0
    })

    const now = new Date()
    const activeTasks = localTasks.filter(t => !t.deadline || new Date(t.deadline) > now)
    const pastTasks = localTasks.filter(t => t.deadline && new Date(t.deadline) <= now)

    async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setCreating(true)
        const fd = new FormData(e.currentTarget)
        fd.set('task_type', taskType)
        const result = await createTask(fd)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Task created!')
            if (result.task) setLocalTasks(prev => [result.task as Task, ...prev])
            setShowForm(false)
            setDesc('')
            setTaskType('individual')
            router.refresh()
        }
        setCreating(false)
    }

    function openApproveDialog(sub: Submission) {
        setApproveDialogSub(sub)
        setXpInput(String((sub.task as { xp_reward?: number } | null)?.xp_reward || 0))
    }

    async function handleConfirmApprove() {
        if (!approveDialogSub) return
        const xp = parseInt(xpInput) || 0
        setReviewing(approveDialogSub.id)
        setApproveDialogSub(null)
        const result = await reviewSubmission(approveDialogSub.id, 'approved', xp, approveDialogSub.task_id, approveDialogSub.user_id)
        if (result.error) toast.error(result.error)
        else {
            toast.success(`Approved! +${xp} XP awarded`)
            setLocalSubmissions(prev => prev.map(s => s.id === approveDialogSub!.id ? { ...s, status: 'approved', xp_given: xp } : s))
            router.refresh()
        }
        setReviewing(null)
    }

    async function handleReject(sub: Submission) {
        setReviewing(sub.id)
        const result = await reviewSubmission(sub.id, 'rejected', 0, sub.task_id, sub.user_id)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Submission rejected.')
            setLocalSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'rejected' } : s))
            router.refresh()
        }
        setReviewing(null)
    }

    const inputCls = "w-full px-3 py-2.5 h-10 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"

    return (
        <div className="space-y-6">
            {/* Task List + Create Form */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <ClipboardList size={15} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Tasks</h2>
                            <p className="text-xs text-muted-foreground">{localTasks.length} tasks total</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowForm(!showForm)}
                        className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs h-8"
                    >
                        <Plus size={13} /> New Task
                    </Button>
                </div>

                {/* Create task form */}
                {showForm && (
                    <div className="px-5 pb-6 border-b border-border/30 bg-muted/10">
                        <form onSubmit={handleCreateTask} className="space-y-4 pt-5">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Title</Label>
                                <input id="title" name="title" required placeholder="Build a REST API…" className={inputCls} />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                                    <span className={`text-[10px] font-mono ${desc.length > MAX_DESC * 0.9 ? 'text-amber-400' : 'text-muted-foreground/50'}`}>{desc.length}/{MAX_DESC}</span>
                                </div>
                                <textarea
                                    id="description" name="description" rows={3} maxLength={MAX_DESC}
                                    value={desc} onChange={e => setDesc(e.target.value)}
                                    placeholder="Describe what students need to do…"
                                    className="w-full px-3 py-2.5 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {/* Task Type */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Type</Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('individual')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${taskType === 'individual' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/70'}`}
                                    >
                                        <User size={14} /> Individual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('team')}
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${taskType === 'team' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/70'}`}
                                    >
                                        <Users size={14} /> Team
                                    </button>
                                </div>
                                {taskType === 'team' && (
                                    <p className="text-[11px] text-muted-foreground">XP will be awarded to the student&apos;s team, not individually.</p>
                                )}
                            </div>

                            {/* XP + Deadline row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP Reward</Label>
                                    <div className="relative">
                                        <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                                        <input id="xp_reward" name="xp_reward" type="number" required min={1} placeholder="25"
                                            className="w-full pl-8 pr-3 py-2 h-10 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deadline</Label>
                                    <div className="relative">
                                        <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                        <input id="deadline" name="deadline" type="datetime-local"
                                            className="w-full pl-8 pr-3 py-2 h-10 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Button type="submit" disabled={creating} size="sm" className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 text-xs h-8">
                                    {creating ? <><Loader2 size={13} className="animate-spin mr-1.5" />Creating…</> : <>Create Task</>}
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setDesc(''); setTaskType('individual') }} className="text-xs h-8">Cancel</Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Task rows */}
                <div className="divide-y divide-border/20">
                    <div className="px-5 py-2 bg-muted/5 border-b border-border/20">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Tasks ({activeTasks.length})</p>
                    </div>
                    {activeTasks.map(task => (
                        <div key={task.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium">{task.title}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${task.task_type === 'team' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {task.task_type === 'team' ? 'Team' : 'Individual'}
                                    </span>
                                </div>
                                {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                                {task.deadline && (
                                    <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                        <Clock size={10} /> Due: {formatDate(task.deadline)}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-amber-400 shrink-0 mt-0.5">+{task.xp_reward} XP</span>
                        </div>
                    ))}
                    {activeTasks.length === 0 && (
                        <div className="py-8 text-center"><p className="text-sm text-muted-foreground">No active tasks right now.</p></div>
                    )}

                    {pastTasks.length > 0 && (
                        <>
                            <div className="px-5 py-2 bg-muted/5 border-y border-border/20 mt-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Tasks ({pastTasks.length})</p>
                            </div>
                            {pastTasks.map(task => (
                                <div key={task.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/10 transition-colors opacity-70 grayscale-[0.5]">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{task.title}</p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${task.task_type === 'team' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {task.task_type === 'team' ? 'Team' : 'Individual'}
                                            </span>
                                        </div>
                                        {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                                        {task.deadline && (
                                            <p className="text-xs text-rose-400/70 mt-0.5 flex items-center gap-1">
                                                <Clock size={10} /> Ended: {formatDate(task.deadline)}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-amber-400/70 shrink-0 mt-0.5">+{task.xp_reward} XP</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Pending Submissions */}
            <div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <h2 className="text-sm font-semibold">Pending Submissions</h2>
                    {pending.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 live-badge">
                            {pending.length} waiting
                        </span>
                    )}
                    {/* Sort controls */}
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Sort:</span>
                        {(['deadline', 'submitted_at', 'student', 'task'] as SortKey[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setSortKey(key)}
                                className={`text-xs px-2 py-0.5 rounded-md border transition-all ${sortKey === key ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/30 text-muted-foreground hover:border-border/60'}`}
                            >
                                {key === 'deadline' ? 'By Deadline' : key === 'submitted_at' ? 'By Submitted' : key === 'student' ? 'By Student' : 'By Task'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    {sortedPending.map(sub => (
                        <div key={sub.id} className="glass rounded-xl px-4 py-3.5 border border-amber-500/20 flex items-center gap-4 hover:border-amber-500/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium">{(sub.task as { title?: string } | null)?.title}</p>
                                    {(sub.task as { task_type?: string } | null)?.task_type === 'team' ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/20">Team</span>
                                    ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">Individual</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {(sub.user as { name?: string } | null)?.name}
                                    {(sub.user as { team?: { team_name?: string } | null } | null)?.team?.team_name && (
                                        <> · {(sub.user as { team?: { team_name?: string } | null } | null)?.team?.team_name}</>
                                    )}
                                </p>
                                {(sub.task as { deadline?: string } | null)?.deadline && (
                                    <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                                        <Clock size={9} /> Due: {formatDate((sub.task as { deadline?: string })!.deadline!)}
                                    </p>
                                )}
                            </div>
                            <span className="text-sm font-bold text-amber-400 shrink-0">+{(sub.task as { xp_reward?: number } | null)?.xp_reward} XP</span>
                            <div className="flex gap-1.5 shrink-0">
                                <Button
                                    size="sm" variant="ghost"
                                    disabled={reviewing === sub.id}
                                    onClick={() => openApproveDialog(sub)}
                                    className="h-8 px-3 gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
                                >
                                    {reviewing === sub.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Approve
                                </Button>
                                <Button
                                    size="sm" variant="ghost"
                                    disabled={reviewing === sub.id}
                                    onClick={() => handleReject(sub)}
                                    className="h-8 px-3 gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                                >
                                    <XCircle size={12} /> Reject
                                </Button>
                            </div>
                        </div>
                    ))}
                    {pending.length === 0 && (
                        <div className="glass rounded-2xl p-8 text-center border border-border/30">
                            <p className="text-sm text-muted-foreground">All caught up! No pending submissions.</p>
                        </div>
                    )}
                </div>

                {/* Reviewed section */}
                {reviewed.length > 0 && (
                    <div className="mt-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recently Reviewed</p>
                        <div className="space-y-1.5">
                            {reviewed.slice(0, 8).map(sub => (
                                <div key={sub.id} className="flex items-center gap-4 px-4 py-2.5 glass rounded-lg border border-border/20 opacity-70">
                                    <span className={`text-xs font-bold ${sub.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {sub.status === 'approved' ? '✓' : '✗'}
                                    </span>
                                    <p className="text-xs flex-1 truncate">{(sub.task as { title?: string } | null)?.title}</p>
                                    <p className="text-xs text-muted-foreground">{(sub.user as { name?: string } | null)?.name}</p>
                                    {sub.status === 'approved' && (
                                        <span className="text-xs font-semibold text-amber-400">+{sub.xp_given} XP</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* XP Prompt Dialog */}
            <Dialog open={!!approveDialogSub} onOpenChange={(open) => { if (!open) setApproveDialogSub(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Award XP</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Approving submission for:</p>
                            <p className="text-sm font-semibold mt-1">{(approveDialogSub?.task as { title?: string } | null)?.title}</p>
                            <p className="text-xs text-muted-foreground">{(approveDialogSub?.user as { name?: string } | null)?.name}</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP to Award</Label>
                            <div className="relative">
                                <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                                <input
                                    type="number"
                                    min={0}
                                    value={xpInput}
                                    onChange={e => setXpInput(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 h-10 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="bg-muted/20 rounded-lg px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-medium">Auto Reason:</span> {(approveDialogSub?.task as { title?: string } | null)?.title} — done
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setApproveDialogSub(null)}>Cancel</Button>
                        <Button size="sm" onClick={handleConfirmApprove} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20">
                            Confirm & Award XP
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
