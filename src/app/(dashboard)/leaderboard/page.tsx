import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import type { UserScore } from '@/types'

export default async function LeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [scoresRes, teamsRes, profileRes] = await Promise.all([
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('users').select('team_id').eq('id', user.id).single(),
    ])

    const scoresResData: UserScore[] = scoresRes.data || []
    const scores = scoresResData.filter(s => s.role !== 'admin')
    const teams = teamsRes.data || []
    const currentUserTeamId = profileRes.data?.team_id
    const currentUserScore = scores.find(s => s.user_id === user.id)

    const RANK_LABELS = ['🥇', '🥈', '🥉']
    const RANK_STYLES = ['text-amber-400', 'text-slate-300', 'text-amber-600']

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Top performers based on Lab Contribution Index</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Individual */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
                        Individual Rankings
                    </h2>
                    <div className="glass rounded-2xl p-4 border border-border/40">
                        <Leaderboard
                            students={scores}
                            currentUserId={user.id}
                            currentUserScore={currentUserScore}
                        />
                    </div>
                </div>

                {/* Teams */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
                        Team Rankings
                    </h2>
                    <div className="glass rounded-2xl p-4 border border-border/40 space-y-2">
                        {teams.map((team, i) => {
                            const isMyTeam = team.id === currentUserTeamId
                            return (
                                <div
                                    key={team.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${isMyTeam
                                            ? 'bg-primary/10 border-primary/30'
                                            : 'border-border/20 hover:border-border/50'
                                        }`}
                                >
                                    <span className={`text-lg w-7 text-center font-bold shrink-0 ${i < 3 ? RANK_STYLES[i] : 'text-muted-foreground text-sm'}`}>
                                        {i < 3 ? RANK_LABELS[i] : `#${i + 1}`}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isMyTeam ? 'text-primary' : ''}`}>{team.team_name}</p>
                                        {team.weekly_title && (
                                            <p className="text-xs text-primary truncate">{team.weekly_title}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-bold text-amber-400">{team.team_xp.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground">Team XP</p>
                                    </div>
                                </div>
                            )
                        })}
                        {teams.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-6">No teams yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
