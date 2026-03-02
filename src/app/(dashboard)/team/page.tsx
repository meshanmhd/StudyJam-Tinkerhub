import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getUserLevel } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/stat-card'

export default async function TeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*, team:teams(*)')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.team_id) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="glass rounded-2xl p-10 text-center">
                    <p className="text-4xl mb-4">👥</p>
                    <p className="text-muted-foreground">You haven&apos;t been assigned to a team yet.</p>
                </div>
            </div>
        )
    }

    const [membersRes, xpLogsRes] = await Promise.all([
        supabase.from('user_scores').select('*').eq('team_id', profile.team_id),
        supabase.from('xp_logs')
            .select('*')
            .eq('team_id', profile.team_id)
            .order('created_at', { ascending: false })
            .limit(10),
    ])

    const members = membersRes.data || []
    const xpLogs = xpLogsRes.data || []
    const team = profile.team

    return (
        <div className="space-y-8">
            {/* Team Header */}
            <div className="glass rounded-2xl p-6 relative overflow-hidden border border-border/40">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Team</p>
                            <h1 className="text-3xl font-bold text-foreground">{team.team_name}</h1>
                            {team.weekly_title && (
                                <p className="text-sm text-primary mt-1">⭐ {team.weekly_title}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-0.5">Team XP</p>
                            <p className="text-4xl font-bold text-amber-400">{team.team_xp.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Members" value={members.length} icon="👥" color="blue" />
                <StatCard
                    title="Avg Impact"
                    value={members.length > 0
                        ? Math.round(members.reduce((a, m) => a + m.final_score, 0) / members.length).toLocaleString()
                        : '0'}
                    subtitle="Per member"
                    icon="⚡"
                    color="purple"
                />
                <StatCard
                    title="Team XP"
                    value={team.team_xp.toLocaleString()}
                    icon="🏆"
                    color="amber"
                />
                <StatCard
                    title="Top Contributor"
                    value={members.sort((a, b) => b.individual_xp - a.individual_xp)[0]?.name.split(' ')[0] || '—'}
                    subtitle="Individual XP leader"
                    icon="⭐"
                    color="green"
                />
            </div>

            {/* Members */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🧑‍🤝‍🧑</span> Team Members
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(member => {
                        const level = getUserLevel(member.individual_xp)
                        const initials = member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        const isMe = member.user_id === user.id
                        return (
                            <div key={member.user_id}
                                className={`glass rounded-2xl p-4 border transition-all ${isMe ? 'border-primary/40 bg-primary/5' : 'border-border/30'}`}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback className={`font-bold ${isMe ? 'bg-primary/30 text-primary' : 'bg-muted/60'}`}>
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-semibold">{member.name} {isMe && <span className="text-primary text-xs">(You)</span>}</p>
                                        <p className="text-xs text-muted-foreground">Lv.{level.level} {level.title}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                                    <span>Individual XP: <span className="text-foreground font-semibold">{member.individual_xp.toLocaleString()}</span></span>
                                    <span>Impact: <span className="text-amber-400 font-semibold">{Math.round(member.final_score).toLocaleString()}</span></span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Recent XP Logs */}
            {xpLogs.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>📜</span> Recent Team Activity
                    </h2>
                    <div className="space-y-2">
                        {xpLogs.map(log => (
                            <div key={log.id} className="glass rounded-xl px-4 py-3 border border-border/30 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{log.reason || log.category}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{log.category}</p>
                                </div>
                                <span className="text-sm font-bold text-amber-400">+{log.xp_value} XP</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
