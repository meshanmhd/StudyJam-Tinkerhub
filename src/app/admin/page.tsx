import { createClient } from '@/utils/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { Users, ClipboardList } from 'lucide-react'

type PendingSub = {
    id: string
    task: { title: string } | null
    user: { name: string } | null
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()

    const [usersRes, teamsRes, pendingRes, tasksRes] = await Promise.all([
        supabase.from('users').select('id, individual_xp').eq('role', 'student'),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('task_submissions').select('id').eq('status', 'pending'),
        supabase.from('tasks').select('id').gte('deadline', new Date().toISOString()),
    ])

    const users = usersRes.data || []
    const teams = teamsRes.data || []
    const pendingCount = pendingRes.data?.length || 0
    const activeTasks = tasksRes.data?.length || 0

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Admin Overview</h1>
                <p className="text-muted-foreground text-sm mt-1">Command center for managing the platform</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Students" value={users.length} icon={<Users size={24} />} color="blue" />
                <StatCard title="Registered Teams" value={teams.length} icon={<Users size={24} />} color="purple" />
                <StatCard title="Active Tasks" value={activeTasks} icon={<ClipboardList size={24} />} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Submissions Banner */}
                <div className="glass flex flex-col rounded-2xl border border-border/20 p-6 shadow-xl">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center justify-between">
                        Pending Reviews
                        {pendingCount > 0 && (
                            <span className="live-badge text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {pendingCount} Action Required
                            </span>
                        )}
                    </h2>
                    {pendingCount === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-muted/5 rounded-xl border border-border/10">
                            <ClipboardList size={32} className="text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm font-medium">All caught up!</p>
                            <p className="text-xs text-muted-foreground/60">No pending submissions.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                            <p className="text-xl text-amber-400 font-bold mb-1">{pendingCount}</p>
                            <p className="text-sm text-amber-400/80 mb-4">submissions waiting</p>
                            <a href="/admin/tasks" className="text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg transition-colors">
                                Review Submissions →
                            </a>
                        </div>
                    )}
                </div>

                {/* Teams leaderboard */}
                <div className="glass rounded-2xl border border-border/20 p-6 shadow-xl">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Top Teams</h2>
                    <div className="space-y-2">
                        {teams.slice(0, 5).map((team, i) => (
                            <div key={team.id} className="bg-muted/10 rounded-xl px-4 py-3 border border-border/20 flex items-center gap-4 transition-all hover:bg-muted/20">
                                <span className={`text-base font-bold w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                                    {i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{team.team_name}</p>
                                    {team.weekly_title && <p className="text-[10px] uppercase tracking-wider text-primary truncate mt-0.5">{team.weekly_title}</p>}
                                </div>
                                <span className="font-bold text-sm bg-muted/30 px-2 py-1 rounded-md text-foreground/80">{team.team_xp.toLocaleString()} XP</span>
                            </div>
                        ))}
                        {teams.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No teams created yet.</p>
                        )}
                        {teams.length > 5 && (
                            <a href="/admin/teams" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                                View all {teams.length} teams →
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
