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
import { createTask } from '../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Plus, Loader2, ClipboardList, Clock, Hash, Users, User, Search, Filter } from 'lucide-react'

interface Task {
    id: string
    title: string
    description?: string
    xp_reward: number
    task_type: 'individual' | 'team'
    deadline?: string
    created_at: string
    level?: string
    submissions?: { status: string }[]
}

interface TaskManagerClientProps {
    tasks: Task[]
    stats: {
        totalStudents: number
        pendingReviews: number
        activeTasks: number
    }
}


export function TaskManagerClient({ tasks, stats }: TaskManagerClientProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [localTasks, setLocalTasks] = useState(tasks)
    const [desc, setDesc] = useState('')
    const [taskType, setTaskType] = useState<'individual' | 'team'>('individual')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterBy, setFilterBy] = useState('All')

    const now = new Date()

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

    const filteredTasks = localTasks
        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(t => {
            if (filterBy === 'All') return true
            const isPast = t.deadline && new Date(t.deadline) <= now
            if (filterBy === 'Active') return !isPast
            if (filterBy === 'Ended') return isPast
            if (filterBy === 'Pending Review') {
                return (t.submissions?.filter(s => s.status === 'pending').length || 0) > 0
            }
            return true
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const inputCls = "w-full px-4 py-2.5 h-11 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"

    return (
        <div className="space-y-10">
            {/* Header */}
            <header>
                <h1 className="text-xl font-bold tracking-tight mb-1">Task Manager</h1>
                <p className="text-zinc-500 text-sm">Create tasks and review student submissions</p>
            </header>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 transition-all hover:border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                        <ClipboardList className="text-zinc-500 w-5 h-5" />
                        <h2 className="text-sm font-medium text-zinc-500">Active Tasks</h2>
                    </div>
                    <p className="text-2xl font-bold">{stats.activeTasks}</p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 transition-all hover:border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                        <ClipboardList className="text-zinc-500 w-5 h-5" />
                        <h2 className="text-sm font-medium text-zinc-500">Pending Reviews</h2>
                    </div>
                    <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                </div>
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 transition-all hover:border-white/20">
                    <div className="flex items-center space-x-3 mb-3">
                        <Users className="text-zinc-500 w-5 h-5" />
                        <h2 className="text-sm font-medium text-zinc-500">Total Students</h2>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
            </div>

            {/* Create task dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Title</Label>
                            <input id="title" name="title" required placeholder="Build a REST API…" className={inputCls} />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                            </div>
                            <textarea
                                id="description" name="description" rows={3}
                                value={desc} onChange={e => setDesc(e.target.value)}
                                placeholder="Describe what students need to do…"
                                className="w-full px-4 py-3 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        {/* Task Type & Level */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Task Type</Label>
                                <div className="flex gap-2 h-11">
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('individual')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs transition-all ${taskType === 'individual' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/70'}`}
                                    >
                                        <User size={14} /> Individual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('team')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs transition-all ${taskType === 'team' ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border/40 text-muted-foreground hover:border-border/70'}`}
                                    >
                                        <Users size={14} /> Team
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty Level</Label>
                                <select name="level" className={`${inputCls} bg-black text-white border-gray-700 rounded-md appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-no-repeat bg-[position:right_12px_center] pr-10`} defaultValue="">
                                    <option value="" disabled>Select level...</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                    <option value="Expert">Expert</option>
                                </select>
                            </div>
                        </div>
                        {taskType === 'team' && (
                            <p className="text-[11px] text-muted-foreground -mt-1">XP will be awarded to the team, not individually.</p>
                        )}

                        {/* XP + Deadline row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP Reward</Label>
                                <div className="relative">
                                    <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                                    <input id="xp_reward" name="xp_reward" type="number" required min={1} placeholder="25"
                                        className="w-full pl-9 pr-4 py-2.5 h-11 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deadline</Label>
                                <div className="relative">
                                    <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                    <input id="deadline" name="deadline" type="datetime-local"
                                        onClick={(e) => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()}
                                        className="w-full pl-9 pr-4 py-2.5 h-11 bg-muted/20 border border-border/60 ring-1 ring-border/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 mt-2">
                            <Button variant="ghost" type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5">Cancel</Button>
                            <Button type="submit" disabled={creating} className="bg-white text-black hover:bg-gray-200 rounded-xl px-5 transition-colors">
                                {creating ? <><Loader2 size={14} className="animate-spin mr-1.5" />Creating…</> : <>Create Task</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Task List Main Area */}
            <main className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#1F1F1F] flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full sm:w-64 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-black border border-[#1F1F1F] rounded-lg focus:outline-none focus:ring-1 focus:ring-white focus:border-white/1 placeholder:text-zinc-500 text-white"
                                placeholder="Search tasks..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 z-10 pointer-events-none" />
                            <select
                                className="w-full sm:w-auto text-sm bg-black border border-[#1F1F1F] rounded-lg py-2.5 pl-9 pr-10 focus:outline-none focus:ring-1 focus:ring-white text-white appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-no-repeat bg-[position:right_10px_center]"
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                            >
                                <option value="All">All Tasks</option>
                                <option value="Active">Active</option>
                                <option value="Pending Review">Pending Review</option>
                                <option value="Ended">Ended</option>
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors whitespace-nowrap w-full md:w-auto"
                    >
                        <Plus size={16} className="font-semibold" />
                        <span>NEW TASK</span>
                    </button>
                </div>

                <div className="divide-y divide-[#1F1F1F]">
                    <div className="px-6 py-4 bg-white/[0.02] text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase border-b border-[#1F1F1F]">
                        All Tasks ({localTasks.length})
                    </div>

                    {filteredTasks.map(task => {
                        const isPast = task.deadline && new Date(task.deadline) <= now
                        const pendingCount = task.submissions?.filter(s => s.status === 'pending').length || 0

                        return (
                            <div
                                key={task.id}
                                onClick={() => router.push(`/admin/tasks/${task.id}`)}
                                className="p-6 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-3 max-w-3xl">
                                        <div className="flex items-center flex-wrap gap-3">
                                            <h3 className={`text-sm font-bold transition-colors ${isPast ? 'text-white/50' : 'text-white group-hover:text-primary'}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex gap-2">
                                                {task.task_type === 'individual' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-white/20 text-blue-400 border-blue-400/30">Individual</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-white/20 text-purple-400 border-purple-400/30">Team</span>
                                                )}

                                                {pendingCount > 0 && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-white/20 text-yellow-400 border-yellow-400/30 flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                                        {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {task.description && (
                                            <p className={`text-xs line-clamp-1 mt-1 ${isPast ? 'text-zinc-500/60' : 'text-zinc-500'}`}>{task.description}</p>
                                        )}
                                        {task.deadline && (
                                            <div className="flex items-center space-x-2 text-xs text-zinc-500/50 mt-4">
                                                <Clock size={14} />
                                                <span>{isPast ? 'Ended:' : 'Due:'} {formatDate(task.deadline)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-sm font-bold ${isPast ? 'text-white/40' : 'text-white'}`}>+{task.xp_reward} XP</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {filteredTasks.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            No tasks found matching your criteria.
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
