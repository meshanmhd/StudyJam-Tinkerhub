'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addXpToUser } from '../actions'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'
import { Loader2, Zap, MessageSquare, TrendingUp } from 'lucide-react'

const CATEGORIES = ['task', 'attendance', 'presentation', 'help', 'other']

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

export function XpManagerClient({ students, teams, logs }: XpManagerClientProps) {
    const [mode, setMode] = useState<'individual' | 'team'>('individual')
    const [targetId, setTargetId] = useState('')
    const [xp, setXp] = useState('')
    const [reason, setReason] = useState('')
    const [category, setCategory] = useState('other')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!targetId || !xp) { toast.error('Fill all required fields'); return }
        setLoading(true)
        const userId = mode === 'individual' ? targetId : null
        const teamId = mode === 'team' ? targetId : null
        const result = await addXpToUser(userId || '', teamId, parseInt(xp), reason, category)
        if (result.error) toast.error(result.error)
        else {
            toast.success(`XP awarded! 🎉`)
            setXp(''); setReason(''); setTargetId('')
        }
        setLoading(false)
    }

    const CATEGORY_ICONS: Record<string, string> = {
        task: '📋', attendance: '📅', presentation: '🎤', help: '🤝', other: '✨'
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Award XP Form */}
            <div className="glass rounded-2xl border border-border/40 overflow-hidden">
                {/* Form header */}
                <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                        <Zap size={15} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Award XP</h2>
                        <p className="text-xs text-muted-foreground">Grant experience points to a student or team</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 bg-muted/30 rounded-xl border border-border/20">
                        {(['individual', 'team'] as const).map(m => (
                            <button type="button" key={m}
                                onClick={() => { setMode(m); setTargetId('') }}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${mode === m
                                    ? 'bg-background text-foreground shadow-sm border border-border/40'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {m === 'individual' ? '🧠 Individual' : '👥 Team'}
                            </button>
                        ))}
                    </div>

                    {/* Target */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {mode === 'individual' ? 'Student' : 'Team'}
                        </Label>
                        <Select value={targetId} onValueChange={setTargetId} required>
                            <SelectTrigger className="bg-muted/20 border-border/40 focus:border-amber-500/50 focus:ring-amber-500/20 h-10">
                                <SelectValue placeholder={`Select ${mode}…`} />
                            </SelectTrigger>
                            <SelectContent>
                                {mode === 'individual'
                                    ? students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            <span className="font-medium">{s.name}</span>
                                            <span className="ml-2 text-muted-foreground text-xs">{s.individual_xp.toLocaleString()} XP</span>
                                        </SelectItem>
                                    ))
                                    : teams.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            <span className="font-medium">{t.team_name}</span>
                                            <span className="ml-2 text-muted-foreground text-xs">{t.team_xp.toLocaleString()} XP</span>
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    {/* XP amount + Category */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">XP Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400">
                                    <Zap size={13} />
                                </span>
                                <input
                                    value={xp}
                                    onChange={e => setXp(e.target.value)}
                                    type="number"
                                    min={1}
                                    required
                                    placeholder="50"
                                    className="w-full pl-8 pr-3 py-2 h-10 bg-muted/20 border border-border/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-muted/20 border-border/40 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c} className="capitalize">
                                            {CATEGORY_ICONS[c]} {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Reason <span className="normal-case text-muted-foreground/60">(optional)</span>
                        </Label>
                        <div className="relative">
                            <MessageSquare size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                            <input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Won the code challenge…"
                                className="w-full pl-8 pr-3 py-2 h-10 bg-muted/20 border border-border/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
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
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <TrendingUp size={15} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">XP Audit Log</h2>
                        <p className="text-xs text-muted-foreground">{logs.length} entries recorded</p>
                    </div>
                </div>

                <div className="glass rounded-2xl border border-border/30 divide-y divide-border/20 overflow-hidden max-h-[480px] overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                            <div className="w-7 h-7 rounded-md bg-muted/30 flex items-center justify-center text-sm shrink-0">
                                {CATEGORY_ICONS[log.category] || '✨'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{log.reason || log.category}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {(log.user as { name?: string } | null)?.name
                                        || (log.team as { team_name?: string } | null)?.team_name
                                        || '—'}
                                    <span className="mx-1">·</span>
                                    {timeAgo(log.created_at)}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-amber-400">+{log.xp_value}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{log.category}</p>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-2xl mb-2">📭</p>
                            <p className="text-sm text-muted-foreground">No XP awarded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
