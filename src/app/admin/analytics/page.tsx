import { createClient } from '@/utils/supabase/server'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const weekAgo = new Date(Date.now() - 7 * 86400e3).toISOString()

    const [studentsRes, teamsRes, xpLogsRes, attendanceRes, submissionsRes] = await Promise.all([
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
        supabase.from('teams').select('id, team_name, team_xp').order('team_xp', { ascending: false }),
        supabase.from('xp_logs').select('xp_value, category, created_at').gte('created_at', weekAgo),
        supabase.from('attendance').select('status').gte('date', firstOfMonth),
        supabase.from('task_submissions').select('status').eq('status', 'approved'),
    ])

    const students = studentsRes.data || []
    const teams = teamsRes.data || []
    const xpLogs = xpLogsRes.data || []
    const attendance = attendanceRes.data || []
    const approvedCount = submissionsRes.data?.length || 0

    const weeklyXp = xpLogs.reduce((a, l) => a + l.xp_value, 0)
    const presentCount = attendance.filter(a => a.status === 'present').length
    const absentCount = attendance.filter(a => a.status === 'absent').length
    const noClassCount = attendance.filter(a => a.status === 'no_class').length

    // XP by category
    const categoryMap: Record<string, number> = {}
    for (const l of xpLogs) {
        categoryMap[l.category] = (categoryMap[l.category] || 0) + l.xp_value
    }
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])
    const maxCatXp = Math.max(...categories.map(c => c[1]), 1)

    const maxTeamXp = Math.max(...teams.map(t => t.team_xp), 1)
    const maxImpact = Math.max(...students.map(s => s.final_score), 1)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">Platform performance overview</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Students', value: students.length },
                    { label: 'Teams', value: teams.length },
                    { label: 'XP This Week', value: weeklyXp.toLocaleString() },
                    { label: 'Approved Tasks', value: approvedCount },
                ].map(stat => (
                    <div key={stat.label} className="rounded-xl border border-border/40 bg-card/60 px-5 py-4">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top students by impact */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Top Students by Impact</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Based on impact score</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {students.slice(0, 8).map((student, i) => (
                            <div key={student.user_id} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-5 text-right shrink-0">#{i + 1}</span>
                                <span className="text-sm font-medium truncate flex-1">{student.name}</span>
                                <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden shrink-0">
                                    <div
                                        className="h-full rounded-full bg-primary"
                                        style={{ width: `${(student.final_score / maxImpact) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-primary w-10 text-right shrink-0">
                                    {Math.round(student.final_score)}
                                </span>
                            </div>
                        ))}
                        {students.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No data yet.</p>
                        )}
                    </div>
                </div>

                {/* Team XP comparison */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Team XP Comparison</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Total XP per team</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {teams.map((team, i) => (
                            <div key={team.id} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-5 text-right shrink-0">#{i + 1}</span>
                                <span className="text-sm font-medium truncate flex-1">{team.team_name}</span>
                                <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden shrink-0">
                                    <div
                                        className="h-full rounded-full bg-amber-400"
                                        style={{ width: `${(team.team_xp / maxTeamXp) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-amber-400 w-14 text-right shrink-0">
                                    {team.team_xp.toLocaleString()}
                                </span>
                            </div>
                        ))}
                        {teams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No teams yet.</p>
                        )}
                    </div>
                </div>

                {/* XP by category (this week) */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">XP by Category</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Distribution over last 7 days</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {categories.map(([cat, xp]) => (
                            <div key={cat} className="flex items-center gap-3">
                                <span className="text-sm capitalize truncate flex-1">{cat}</span>
                                <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden shrink-0">
                                    <div
                                        className="h-full rounded-full bg-emerald-500"
                                        style={{ width: `${(xp / maxCatXp) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs font-bold text-emerald-400 w-12 text-right shrink-0">
                                    {xp.toLocaleString()}
                                </span>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No XP activity this week.</p>
                        )}
                    </div>
                </div>

                {/* Attendance summary (this month) */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Attendance This Month</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Aggregate across all students</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: 'Present', count: presentCount, color: 'bg-emerald-500', text: 'text-emerald-400' },
                            { label: 'Absent', count: absentCount, color: 'bg-red-500', text: 'text-red-400' },
                            { label: 'No Class', count: noClassCount, color: 'bg-blue-500', text: 'text-blue-400' },
                        ].map(row => {
                            const total = presentCount + absentCount + noClassCount || 1
                            return (
                                <div key={row.label} className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground w-20">{row.label}</span>
                                    <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${row.color}`}
                                            style={{ width: `${(row.count / total) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-xs font-bold w-10 text-right ${row.text}`}>{row.count}</span>
                                </div>
                            )
                        })}
                        {presentCount + absentCount + noClassCount === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No attendance marked yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
