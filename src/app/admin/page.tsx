import { createClient } from '@/utils/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { Users, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import type { UserScore } from '@/types'

type PendingSub = {
    id: string
    task_id: string
    task: { title: string } | null
    user: { name: string } | null
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()

    const [usersRes, teamsRes, pendingRes, tasksRes, scoresRes] = await Promise.all([
        supabase.from('users').select('id, individual_xp').eq('role', 'student'),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('task_submissions').select('id, task_id, user:users!task_submissions_user_id_fkey(name), task:tasks!task_submissions_task_id_fkey(title)').eq('status', 'pending').order('submitted_at', { ascending: true }),
        supabase.from('tasks').select('id').gte('deadline', new Date().toISOString()),
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
    ])

    const users = usersRes.data || []
    const teams = teamsRes.data || []
    const pendingSubs: PendingSub[] = (pendingRes.data as unknown as PendingSub[]) || []
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
                <div className="bg-[#0A0A0A] rounded-2xl border border-[#1F1F1F] overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <ClipboardList size={16} className="text-zinc-400" />
                            <h2 className="text-sm font-semibold text-white">Pending Reviews</h2>
                        </div>
                        {pendingCount > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                {pendingCount} pending
                            </span>
                        )}
                    </div>
                    {pendingCount === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-zinc-500 text-sm font-medium">All caught up!</p>
                            <p className="text-[11px] text-zinc-600 mt-1">No pending submissions.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="divide-y divide-[#1F1F1F]">
                                {pendingSubs.slice(0, 8).map((sub) => (
                                    <Link
                                        key={sub.id}
                                        href={`/admin/tasks/${sub.task_id}`}
                                        className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors"
                                    >
                                        <div className="min-w-0 pr-3">
                                            <p className="text-sm font-medium text-white truncate">{sub.task?.title || 'Unknown Task'}</p>
                                            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">by {sub.user?.name || 'Unknown User'}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                                            Review →
                                        </span>
                                    </Link>
                                ))}
                            </div>
                            <Link href="/admin/tasks" className="block border-t border-[#1F1F1F] px-5 py-3 text-center text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.02] transition-colors">
                                View All {pendingCount} Submissions →
                            </Link>
                        </div>
                    )}
                </div>

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
                                <Link href="/admin/leaderboard" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                                    View full leaderboard →
                                </Link>
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
                                <Link href="/admin/leaderboard" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                                    View all {teams.length} teams →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
