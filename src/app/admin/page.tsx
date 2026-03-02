import { createClient } from '@/utils/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'

type PendingSub = {
    id: string
    task: { title: string } | null
    user: { name: string } | null
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()

    const [usersRes, teamsRes, logsRes, pendingRes, tasksRes] = await Promise.all([
        supabase.from('users').select('id, individual_xp').eq('role', 'student'),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('xp_logs').select('xp_value').gte('created_at', new Date(Date.now() - 7 * 86400e3).toISOString()),
        supabase.from('task_submissions').select('id').eq('status', 'pending'),
        supabase.from('tasks').select('id').gte('deadline', new Date().toISOString()),
    ])

    const users = usersRes.data || []
    const teams = teamsRes.data || []
    const weeklyXp = (logsRes.data || []).reduce((acc, l) => acc + (l.xp_value || 0), 0)
    const pendingCount = pendingRes.data?.length || 0
    const activeTasks = tasksRes.data?.length || 0

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin Overview</h1>
                <p className="text-muted-foreground text-sm mt-1">Monitor the platform at a glance</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Students" value={users.length} icon="🧑‍🎓" color="blue" />
                <StatCard title="Teams" value={teams.length} icon="👥" color="purple" />
                <StatCard title="XP This Week" value={weeklyXp.toLocaleString()} subtitle="Across all logs" icon="⚡" color="amber" />
                <StatCard title="Active Tasks" value={activeTasks} icon="📋" color="green" />
            </div>

            {/* Pending Submissions Banner */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>⏳</span> Pending Submissions
                    {pendingCount > 0 && (
                        <span className="live-badge ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">
                            {pendingCount} waiting
                        </span>
                    )}
                </h2>
                {pendingCount === 0 ? (
                    <div className="glass rounded-2xl p-8 text-center">
                        <p className="text-muted-foreground text-sm">No pending submissions. 🎉</p>
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-5 border border-amber-500/20">
                        <p className="text-sm text-amber-400 font-medium">{pendingCount} submission{pendingCount !== 1 ? 's' : ''} awaiting review.</p>
                        <a href="/admin/tasks" className="text-xs text-primary hover:underline mt-1 inline-block">Go to Task Manager →</a>
                    </div>
                )}
            </div>

            {/* Teams leaderboard */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Team Rankings</h2>
                <div className="space-y-2">
                    {teams.map((team, i) => (
                        <div key={team.id} className="glass rounded-xl px-4 py-3 border border-border/30 flex items-center gap-3">
                            <span className="text-lg w-6">{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                            <p className="flex-1 font-medium">{team.team_name}</p>
                            {team.weekly_title && <p className="text-xs text-primary">{team.weekly_title}</p>}
                            <p className="font-bold text-amber-400">{team.team_xp.toLocaleString()} XP</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
