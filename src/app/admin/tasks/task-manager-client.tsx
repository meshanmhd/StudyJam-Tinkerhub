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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createTask } from '../actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Plus, Loader2, Clock, Hash, Users, User, Search, Filter } from 'lucide-react'
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
                                <Tabs value={taskType} onValueChange={(val) => setTaskType(val as 'individual' | 'team')} className="w-full h-11">
                                    <TabsList className="w-full h-full bg-muted/20 border border-border/40 p-1 rounded-xl">
                                        <TabsTrigger value="individual" className="flex-1 rounded-lg text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary transition-all">
                                            <User size={14} className="mr-1.5" /> Individual
                                        </TabsTrigger>
                                        <TabsTrigger value="team" className="flex-1 rounded-lg text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary transition-all">
                                            <Users size={14} className="mr-1.5" /> Team
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Difficulty Level</Label>
                                <Select name="level" defaultValue="">
                                    <SelectTrigger className={`${inputCls} bg-black text-white hover:bg-muted/10 transition-colors`}>
                                        <SelectValue placeholder="Select level..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-border/40 text-white rounded-xl shadow-2xl">
                                        <SelectItem value="Beginner" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Beginner</SelectItem>
                                        <SelectItem value="Intermediate" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Intermediate</SelectItem>
                                        <SelectItem value="Advanced" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Advanced</SelectItem>
                                        <SelectItem value="Expert" className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>


                        {/* XP Reward */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP Reward</Label>
                            <div className="relative">
                                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                                <input id="xp_reward" name="xp_reward" type="number" required min={1} placeholder="eg:25"
                                    className="w-full pl-9 pr-4 py-2.5 h-11 bg-muted/20 border border-border/60 ring-2 ring-border/20 rounded-xl text-sm focus:outline-none" />
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deadline</Label>
                            <DateTimePicker name="deadline" id="deadline" />
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
                            <Select value={filterBy} onValueChange={setFilterBy}>
                                <SelectTrigger className="w-full sm:w-40 text-sm bg-black border border-[#1F1F1F] rounded-lg h-[41.5px] pl-10 pr-4 focus:ring-1 focus:ring-white text-white hover:bg-white/[0.02] transition-colors focus:border-[#1F1F1F] ring-offset-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-[#1F1F1F] text-white rounded-lg shadow-2xl">
                                    <SelectItem value="All" className="focus:bg-white/[0.08] focus:text-white cursor-pointer rounded-md">All Tasks</SelectItem>
                                    <SelectItem value="Active" className="focus:bg-white/[0.08] focus:text-white cursor-pointer rounded-md">Active</SelectItem>
                                    <SelectItem value="Pending Review" className="focus:bg-white/[0.08] focus:text-white cursor-pointer rounded-md">Pending Review</SelectItem>
                                    <SelectItem value="Ended" className="focus:bg-white/[0.08] focus:text-white cursor-pointer rounded-md">Ended</SelectItem>
                                </SelectContent>
                            </Select>
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
                                className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex items-center justify-between gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className={`text-sm font-semibold transition-colors truncate ${isPast ? 'text-white/50' : 'text-white group-hover:text-primary'}`}>
                                            {task.title}
                                        </h3>
                                        {task.task_type === 'individual' ? (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border text-blue-400 border-blue-400/30 shrink-0">Indiv</span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border text-purple-400 border-purple-400/30 shrink-0">Team</span>
                                        )}
                                        {pendingCount > 0 && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border text-amber-400 border-amber-400/30 flex items-center gap-1 shrink-0">
                                                <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                                                {pendingCount} pending
                                            </span>
                                        )}
                                    </div>
                                    {task.description && (
                                        <p className={`text-xs line-clamp-1 mt-0.5 ${isPast ? 'text-zinc-600' : 'text-zinc-500'}`}>{task.description}</p>
                                    )}
                                </div>
                                <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                                    <span className={`text-xs font-bold ${isPast ? 'text-white/40' : 'text-amber-400'}`}>+{task.xp_reward} XP</span>
                                    {task.deadline && (
                                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                            <Clock size={9} />{isPast ? 'Ended' : 'Due'}: {formatDate(task.deadline)}
                                        </span>
                                    )}
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
