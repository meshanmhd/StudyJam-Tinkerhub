'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { addXpToUser } from '../actions'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="glass rounded-2xl p-6 border border-border/40">
                <h2 className="text-base font-semibold mb-5">Award XP</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-2">
                        {(['individual', 'team'] as const).map(m => (
                            <button type="button" key={m}
                                onClick={() => { setMode(m); setTargetId('') }}
                                className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all ${mode === m ? 'bg-primary/20 text-primary border border-primary/30' : 'border border-border/30 text-muted-foreground'
                                    }`}
                            >
                                {m === 'individual' ? '🧠 Individual' : '👥 Team'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Target</Label>
                        <Select value={targetId} onValueChange={setTargetId} required>
                            <SelectTrigger className="bg-muted/40"><SelectValue placeholder={`Select ${mode}...`} /></SelectTrigger>
                            <SelectContent>
                                {mode === 'individual'
                                    ? students.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} ({s.individual_xp.toLocaleString()} XP)
                                        </SelectItem>
                                    ))
                                    : teams.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.team_name} ({t.team_xp.toLocaleString()} XP)
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>XP Amount</Label>
                            <Input value={xp} onChange={e => setXp(e.target.value)} type="number" min={1} required className="bg-muted/40" placeholder="25" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-muted/40"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Reason</Label>
                        <Input value={reason} onChange={e => setReason(e.target.value)} className="bg-muted/40" placeholder="Won the code challenge" />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90">
                        {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                        Award XP
                    </Button>
                </form>
            </div>

            {/* XP Logs */}
            <div>
                <h2 className="text-base font-semibold mb-4">XP Audit Log</h2>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                    {logs.map(log => (
                        <div key={log.id} className="glass rounded-xl px-4 py-3 border border-border/20 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{log.reason || log.category}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {(log.user as { name?: string } | null)?.name || (log.team as { team_name?: string } | null)?.team_name || '—'} · {timeAgo(log.created_at)}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-amber-400">+{log.xp_value}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{log.category}</p>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-6">No XP awarded yet.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
