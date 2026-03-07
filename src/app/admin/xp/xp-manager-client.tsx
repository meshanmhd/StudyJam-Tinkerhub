'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { addXpToUser } from '../actions'
import { toast } from 'sonner'
import { Loader2, Zap, MessageSquare, TrendingUp } from 'lucide-react'

interface Student { id: string; name: string; individual_xp: number; team_id: string | null }
interface Team { id: string; team_name: string; team_xp: number }
interface Log {
    id: string; xp_value: number; reason?: string; category: string; created_at: string;
    user?: { name?: string } | null; team?: { team_name?: string } | null;
}

interface XpManagerClientProps {
    students: Student[]
    teams: Team[]
    logs: Log[]
}

export function XpManagerClient({ students, teams, logs: initialLogs }: XpManagerClientProps) {
    const router = useRouter()
    const [mode, setMode] = useState<'individual' | 'team'>('individual')
    const [targetId, setTargetId] = useState('')
    const [xp, setXp] = useState('')
    const [reason, setReason] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState(initialLogs)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!targetId || !xp || !reason.trim()) { toast.error('Fill all required fields'); return }
        setLoading(true)
        const userId = mode === 'individual' ? targetId : ''
        const teamId = mode === 'team' ? targetId : null
        const result = await addXpToUser(userId, teamId, parseInt(xp), reason)
        if (result.error) toast.error(result.error)
        else {
            toast.success(`XP awarded!`)
            setXp(''); setReason(''); setTargetId(''); setSearchQuery('')
            router.refresh()
        }
        setLoading(false)
    }

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const filteredTeams = teams.filter(t => t.team_name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-4">
            {/* Award XP Form */}
            <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] overflow-hidden h-fit">
                {/* Form header */}
                <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <Zap size={15} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">Award XP</h2>
                        <p className="text-xs text-zinc-500">Grant experience points to a student or team</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 bg-white/[0.02] rounded-xl border border-[#1F1F1F]">
                        {(['individual', 'team'] as const).map(m => (
                            <button type="button" key={m}
                                onClick={() => { setMode(m); setTargetId('') }}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${mode === m
                                    ? 'bg-black text-white shadow-sm border border-[#1F1F1F]'
                                    : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                {m === 'individual' ? 'Individual' : 'Team'}
                            </button>
                        ))}
                    </div>

                    {/* Target */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            {mode === 'individual' ? 'Student' : 'Team'}
                        </Label>
                        <Select value={targetId} onValueChange={setTargetId} required>
                            <SelectTrigger className="w-full bg-black border-[#1F1F1F] ring-1 ring-[#1F1F1F] text-white focus:border-amber-500/50 focus:ring-amber-500/20 h-10">
                                <SelectValue placeholder={`Select ${mode}…`} />
                            </SelectTrigger>
                            <SelectContent position="popper" className="bg-[#0A0A0A] border-[#1F1F1F] text-white">
                                <div className="p-2 sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#1F1F1F]">
                                    <Input
                                        placeholder={`Search ${mode}...`}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="h-8 text-sm bg-black border-[#1F1F1F] text-white"
                                    />
                                </div>
                                {mode === 'individual'
                                    ? filteredStudents.map(s => (
                                        <SelectItem key={s.id} value={s.id} className="focus:bg-white/5 focus:text-white">
                                            <span className="font-medium text-white">{s.name}</span>
                                            <span className="ml-2 text-zinc-500 text-xs">{s.individual_xp.toLocaleString()} XP</span>
                                        </SelectItem>
                                    ))
                                    : filteredTeams.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="focus:bg-white/5 focus:text-white">
                                            <span className="font-medium text-white">{t.team_name}</span>
                                            <span className="ml-2 text-zinc-500 text-xs">{t.team_xp.toLocaleString()} XP</span>
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    {/* XP amount */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">XP Amount <span className="text-zinc-600 normal-case">(use negative to deduct)</span></Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400">
                                <Zap size={13} />
                            </span>
                            <input
                                value={xp}
                                onChange={e => setXp(e.target.value)}
                                type="number"
                                required
                                placeholder="50"
                                className="w-full pl-8 pr-3 py-2 h-10 bg-black border border-[#1F1F1F] ring-1 ring-[#1F1F1F] text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            Reason / Title
                        </Label>
                        <div className="relative">
                            <MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                required
                                placeholder="e.g. Won the code challenge…"
                                className="w-full pl-8 pr-3 py-2 h-10 bg-black border border-[#1F1F1F] ring-1 ring-[#1F1F1F] text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold h-10"
                    >
                        {loading
                            ? <><Loader2 size={14} className="animate-spin mr-2" />Awarding…</>
                            : <><Zap size={14} className="mr-2" />Award XP</>
                        }
                    </Button>
                </form>
            </div>

            {/* XP Audit Log */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <TrendingUp size={15} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">XP Audit Log</h2>
                        <p className="text-xs text-zinc-500">{logs.length} entries recorded</p>
                    </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] divide-y divide-[#1F1F1F] overflow-hidden max-h-[480px] overflow-y-auto custom-scrollbar">
                    {logs.map(log => {
                        const targetName = (log.user as { name?: string } | null)?.name || (log.team as { team_name?: string } | null)?.team_name || 'Unknown'
                        const isNegative = log.xp_value < 0
                        return (
                            <div key={log.id} className="flex flex-col gap-1.5 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-sm font-bold text-white leading-tight">
                                        {targetName}
                                    </h3>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={`text-sm font-bold ${isNegative ? 'text-rose-400' : 'text-amber-400'}`}>
                                            {isNegative ? '' : '+'}{log.xp_value}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-snug">
                                    {log.reason || 'Manual XP Award'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-zinc-500 font-medium">
                                        {new Date(log.created_at).toLocaleDateString(undefined, {
                                            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    {logs.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-sm text-zinc-500">No XP awarded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
