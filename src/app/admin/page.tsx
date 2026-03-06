import { createClient } from '@/utils/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { Users, ClipboardList } from 'lucide-react'
import type { UserScore } from '@/types'

type PendingSub = {
    id: string
    task: { title: string } | null
    user: { name: string } | null
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()

    const [usersRes, teamsRes, pendingRes, tasksRes, scoresRes] = await Promise.all([
        supabase.from('users').select('id, individual_xp').eq('role', 'student'),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('task_submissions').select('id, user:users(name), task:tasks(title)').eq('status', 'pending').order('submitted_at', { ascending: true }),
        supabase.from('tasks').select('id').gte('deadline', new Date().toISOString()),
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
    ])

    const users = usersRes.data || []
    const teams = teamsRes.data || []
    const pendingSubs: PendingSub[] = (pendingRes.data as any) || []
    const pendingCount = pendingSubs.length
    const activeTasks = tasksRes.data?.length || 0

    const scoresResData: UserScore[] = scoresRes.data || []
    const scores = scoresResData.filter(s => s.role !== 'admin')

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
                {/* Pending Submissions Card */}
                <a href="/admin/tasks" className="block group">
                    <div className="glass rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Pending Reviews
                            </h2>
                            {pendingCount > 0 && (
                                <span className="live-badge text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Action Required
                                </span>
                            )}
                        </div>
                        {pendingCount === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                <ClipboardList size={28} className="text-muted-foreground/30 mb-3" />
                                <p className="text-muted-foreground text-sm font-medium">All caught up!</p>
                                <p className="text-[10px] text-muted-foreground/60">No pending submissions.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="space-y-2 mb-4 flex-1">
                                    {pendingSubs.slice(0, 4).map((sub) => (
                                        <div key={sub.id} className="bg-muted/10 rounded-xl px-3 py-2 border border-border/20 flex items-center justify-between transition-colors group-hover:border-primary/20">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-sm font-medium truncate">{sub.task?.title || 'Unknown Task'}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">By {sub.user?.name || 'Unknown User'}</p>
                                            </div>
                                            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full shrink-0 border border-amber-500/20">Review</span>
                                        </div>
                                    ))}
                                </div>

                                <span className="text-xs font-semibold text-primary transition-colors mt-auto text-center block w-full bg-primary/5 group-hover:bg-primary/10 py-2.5 rounded-xl border border-primary/10">
                                    View All {pendingCount} Submissions →
                                </span>
                            </div>
                        )}
                    </div>
                </a>

                <div className="space-y-6">
                    {/* Top Students leaderboard */}
                    <div className="glass rounded-2xl border border-border/20 p-6 shadow-xl">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Top Students</h2>
                        <div className="space-y-2">
                            <Leaderboard
                                students={scores}
                                currentUserId=""
                                limit={5}
                            />
                            {scores.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">No students yet.</p>
                            )}
                            {scores.length > 5 && (
                                <a href="/admin/leaderboard" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                                    View full leaderboard →
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Teams leaderboard */}
                    <div className="glass rounded-2xl border border-border/20 p-6 shadow-xl">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Top Teams</h2>
                        <div className="space-y-2">
                            <Leaderboard
                                students={scores.filter(s => s.team_id)}
                                currentUserId=""
                                viewMode="team"
                                limit={5}
                            />
                            {teams.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-6">No teams created yet.</p>
                            )}
                            {teams.length > 5 && (
                                <a href="/admin/leaderboard" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                                    View all {teams.length} teams →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
