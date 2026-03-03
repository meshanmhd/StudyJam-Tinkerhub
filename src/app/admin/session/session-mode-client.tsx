'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addXpToUser } from '../actions'
import { toast } from 'sonner'
import { timeAgo } from '@/lib/utils'

interface Student { id: string; name: string; team_id: string | null }
interface Team { id: string; team_name: string }
interface Log { id: string; xp_value: number; reason?: string; category: string; created_at: string }

const QUICK_XP = [
    { label: '+20 Presentation', xp: 20, category: 'presentation', reason: 'Session presentation' },
    { label: '+15 Helped Teammate', xp: 15, category: 'help', reason: 'Helped a teammate' },
    { label: '+25 Core Task Done', xp: 25, category: 'task', reason: 'Core task completed in session' },
    { label: '+10 Attendance', xp: 10, category: 'attendance', reason: 'Session attendance' },
]

interface SessionModeClientProps {
    students: Student[]
    teams: Team[]
    recentLogs: Log[]
}

export function SessionModeClient({ students, teams, recentLogs }: SessionModeClientProps) {
    const [mode, setMode] = useState<'individual' | 'team'>('individual')
    const [targetId, setTargetId] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const [logs, setLogs] = useState(recentLogs)

    async function handleQuickXp(btn: typeof QUICK_XP[0]) {
        if (!targetId) { toast.error('Select a target first'); return }
        setLoading(btn.label)
        const userId = mode === 'individual' ? targetId : ''
        const teamId = mode === 'team' ? targetId : null
        const result = await addXpToUser(userId || '', teamId, btn.xp, btn.reason)
        if (result.error) toast.error(result.error)
        else toast.success(`${btn.label} XP awarded!`)
        setLoading(null)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel */}
            <div className="lg:col-span-2 space-y-5">
                {/* Mode Toggle */}
                <div className="glass rounded-2xl p-5 border border-border/40">
                    <div className="flex gap-2 mb-5">
                        {(['individual', 'team'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setTargetId('') }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${mode === m ? 'bg-primary/20 text-primary border border-primary/30' : 'border border-border/30 text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {m === 'individual' ? 'Individual' : 'Team'}
                            </button>
                        ))}
                    </div>

                    <Label className="text-xs text-muted-foreground mb-2 block">
                        Select {mode === 'individual' ? 'Student' : 'Team'}
                    </Label>
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger className="bg-muted/40 border-border/50">
                            <SelectValue placeholder={`Choose a ${mode}...`} />
                        </SelectTrigger>
                        <SelectContent>
                            {mode === 'individual'
                                ? students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                : teams.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name}</SelectItem>)
                            }
                        </SelectContent>
                    </Select>
                </div>

                {/* Quick XP Buttons */}
                <div className="glass rounded-2xl p-5 border border-border/40">
                    <p className="text-sm font-semibold mb-4 text-muted-foreground">Quick Award</p>
                    <div className="grid grid-cols-2 gap-3">
                        {QUICK_XP.map(btn => (
                            <Button
                                key={btn.label}
                                onClick={() => handleQuickXp(btn)}
                                disabled={!!loading || !targetId}
                                className="h-14 flex-col gap-1 bg-muted/40 hover:bg-primary/20 hover:text-primary border border-border/30 hover:border-primary/30 text-foreground transition-all duration-200"
                                variant="outline"
                            >
                                <span className="text-lg font-bold text-amber-400">+{btn.xp}</span>
                                <span className="text-xs">{btn.label.replace(/^\+\d+\s/, '')}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Log */}
            <div>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Recent XP Activity</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {logs.map(log => (
                        <div key={log.id} className="glass rounded-xl px-4 py-3 border border-border/20">
                            <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{log.reason || log.category}</p>
                                    <p className="text-[10px] text-muted-foreground">{timeAgo(log.created_at)}</p>
                                </div>
                                <span className="text-sm font-bold text-amber-400 shrink-0 ml-2">+{log.xp_value}</span>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-8">No XP awarded yet this session.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
