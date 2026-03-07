import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { RefreshButton } from '@/components/ui/refresh-button'
import type { UserScore } from '@/types'

export default async function AdminLeaderboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') redirect('/login')

    const [scoresRes, teamsRes] = await Promise.all([
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
    ])

    const scoresResData: UserScore[] = scoresRes.data || []
    const scores = scoresResData.filter(s => s.role !== 'admin')

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Leaderboard</h1>
                    <p className="text-muted-foreground text-sm mt-1">Individual ranked by Impact Score · Teams ranked by Team XP</p>
                </div>
                <RefreshButton />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Individual — sorted by impact (final_score) */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
                        Individual Rankings — Impact Score
                    </h2>
                    <div className="glass rounded-2xl p-4 border border-border/40">
                        <Leaderboard
                            students={scores}
                            currentUserId=""
                        />
                    </div>
                </div>

                {/* Teams — sorted by team_xp */}
                <div>
                    <h2 className="text-base font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
                        Team Rankings — Team XP
                    </h2>
                    <div className="glass rounded-2xl p-4 border border-border/40">
                        <Leaderboard
                            students={scores.filter(s => s.team_id)}
                            currentUserId=""
                            viewMode="team"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
