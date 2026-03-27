'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTask } from '../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Plus, Loader2, Clock, Users, User, Search } from 'lucide-react'
import { DateTimePicker } from '@/components/ui/datetime-picker'

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
}

export function TaskManagerClient({ tasks }: TaskManagerClientProps) {
    const router = useRouter()
    const [showForm, setShowForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [localTasks, setLocalTasks] = useState(tasks)
    const [desc, setDesc] = useState('')
    const [taskType, setTaskType] = useState<'individual' | 'team'>('individual')
    const [level, setLevel] = useState('Beginner')
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
            setLevel('Beginner')
            router.refresh()
        }
        setCreating(false)
    }

    const activeTasks = localTasks
        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(t => {
            const isPast = t.deadline && new Date(t.deadline) <= now
            if (filterBy === 'Active') return !isPast
            if (filterBy === 'Ended') return false
            if (filterBy === 'Pending Review') return (t.submissions?.filter(s => s.status === 'pending').length || 0) > 0
            // All — split into active/ended below
            return !isPast
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const endedTasks = localTasks
        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(t => {
            const isPast = t.deadline && new Date(t.deadline) <= now
            if (filterBy === 'Active') return false
            if (filterBy === 'Ended') return isPast
            if (filterBy === 'Pending Review') return false
            return !!isPast
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="space-y-10">
            {/* Header */}
            <header>
                <h1 className="text-xl font-bold tracking-tight mb-1">Task Manager</h1>
                <p className="text-zinc-500 text-sm">Create tasks and review student submissions</p>
            </header>



            {/* Create task dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl overflow-hidden">

                    {/* Modal Header */}
                    <div className="px-5 pt-5 pb-3 border-b border-[#1A1A1A]">
                        <DialogTitle className="text-base font-semibold text-white">Create New Task</DialogTitle>
                        <p className="text-xs text-zinc-500 mt-0.5">Fill in the details to publish a new task for students.</p>
                    </div>

                    <form onSubmit={handleCreateTask} className="px-5 py-4 space-y-3.5">

                        {/* ── Task Title ── */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Task Title</label>
                            <input
                                id="title" name="title" required
                                placeholder="e.g. Build a REST API with Node.js"
                                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-[#222] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                            />
                        </div>

                        {/* ── Description ── */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Description</label>
                            <textarea
                                id="description" name="description" rows={4}
                                value={desc} onChange={e => setDesc(e.target.value)}
                                placeholder="What should students complete for this task?"
                                className="w-full px-4 py-3 rounded-lg bg-[#111] border border-[#222] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all resize-none"
                            />
                        </div>

                        {/* ── Task Type ── */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Task Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['individual', 'team'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setTaskType(type)}
                                        className={`flex items-center justify-center gap-2 h-11 rounded-lg border text-sm font-medium transition-all ${taskType === type
                                            ? 'bg-white text-black border-white'
                                            : 'bg-[#111] text-zinc-400 border-[#222] hover:border-zinc-600 hover:text-zinc-200'
                                            }`}
                                    >
                                        {type === 'individual' ? <User size={14} /> : <Users size={14} />}
                                        {type === 'individual' ? 'Individual' : 'Team'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Level & XP row ── */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Difficulty */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Difficulty</label>
                                <Select name="level" value={level} onValueChange={setLevel}>
                                    <SelectTrigger className="w-full !h-11 px-4 bg-[#111] border border-[#222] text-sm text-white focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all rounded-lg">
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A0A0A] border-[#1F1F1F] text-white rounded-xl shadow-2xl">
                                        <SelectItem value="Beginner" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Beginner</SelectItem>
                                        <SelectItem value="Intermediate" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Intermediate</SelectItem>
                                        <SelectItem value="Advanced" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Advanced</SelectItem>
                                        <SelectItem value="Expert" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* XP Reward */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">XP Reward</label>
                                <input
                                    id="xp_reward" name="xp_reward" type="number" required min={1} placeholder="25"
                                    className="w-full h-11 px-4 rounded-lg bg-[#111] border border-[#222] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* ── Deadline ── */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">Deadline</label>
                            <DateTimePicker name="deadline" id="deadline" required />
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="flex items-center gap-3 pt-1 border-t border-[#1A1A1A] mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 h-10 rounded-lg border border-[#222] text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating}
                                className="flex-1 h-10 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {creating ? <><Loader2 size={14} className="animate-spin" />Creating…</> : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>


            {/* Task List Main Area */}
            <main className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-[#1F1F1F] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            className="w-full pl-10 pr-4 py-2 text-sm bg-black border border-[#1F1F1F] rounded-lg focus:outline-none focus:ring-1 focus:ring-white placeholder:text-zinc-600 text-white"
                            placeholder="Search tasks..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filter tab pills */}
                    <div className="flex items-center gap-1 bg-[#111] border border-[#1F1F1F] rounded-lg p-1 shrink-0 overflow-x-auto">
                        {(['All', 'Active', 'Ended', 'Pending Review'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterBy(tab)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${filterBy === tab
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    {/* New task button */}
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors whitespace-nowrap shrink-0"
                    >
                        <Plus size={14} />
                        <span>New Task</span>
                    </button>
                </div>

                <div className="divide-y divide-[#1F1F1F]">
                    {/* ── Active Tasks ── */}
                    {activeTasks.length > 0 && (
                        <>
                            <div className="px-6 py-3 bg-white/[0.02] text-[11px] font-bold tracking-[0.1em] text-zinc-500 uppercase border-b border-[#1F1F1F] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                                Active ({activeTasks.length})
                            </div>
                            {activeTasks.map(task => {
                                const pendingCount = task.submissions?.filter(s => s.status === 'pending').length || 0
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => router.push(`/admin/tasks/${task.id}`)}
                                        className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-center justify-between gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold transition-colors truncate text-white group-hover:text-primary">
                                                    {task.title}
                                                </h3>
                                                {task.task_type === 'individual' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0"><User size={9} />Solo</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0"><Users size={9} />Team</span>
                                                )}
                                                {pendingCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                        {pendingCount} review
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-xs line-clamp-1 mt-0.5 text-zinc-500">{task.description}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                                            <span className="text-xs font-bold text-amber-400">+{task.xp_reward} XP</span>
                                            {task.deadline && (
                                                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                    <Clock size={9} />Due: {formatDate(task.deadline)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {/* ── Ended Tasks ── */}
                    {endedTasks.length > 0 && (
                        <>
                            <div className="px-6 py-3 bg-white/[0.02] text-[11px] font-bold tracking-[0.1em] text-zinc-600 uppercase border-b border-[#1F1F1F] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />
                                Ended ({endedTasks.length})
                            </div>
                            {endedTasks.map(task => {
                                const pendingCount = task.submissions?.filter(s => s.status === 'pending').length || 0
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => router.push(`/admin/tasks/${task.id}`)}
                                        className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-center justify-between gap-4 opacity-60"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold transition-colors truncate text-white/50 group-hover:text-white/70">
                                                    {task.title}
                                                </h3>
                                                {task.task_type === 'individual' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/5 text-blue-400/40 border border-blue-500/10 shrink-0"><User size={9} />Solo</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/5 text-violet-400/40 border border-violet-500/10 shrink-0"><Users size={9} />Team</span>
                                                )}
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700 shrink-0">Ended</span>
                                                {pendingCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 opacity-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                        {pendingCount} review
                                                    </span>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-xs line-clamp-1 mt-0.5 text-zinc-600">{task.description}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                                            <span className="text-xs font-bold text-white/30">+{task.xp_reward} XP</span>
                                            {task.deadline && (
                                                <span className="text-[10px] text-zinc-700 flex items-center gap-1">
                                                    <Clock size={9} />Ended: {formatDate(task.deadline)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}

                    {activeTasks.length === 0 && endedTasks.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">
                            No tasks found matching your criteria.
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
