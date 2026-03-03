import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { GamesPageClient } from './games-page-client'

export default async function GamesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const now = new Date()

    // Fetch active games (not expired more than 24h) and released result games
    const { data: games } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })

    // Fetch current user's submissions for these games
    const { data: mySubmissions } = await supabase
        .from('game_submissions')
        .select('game_id, solved, num_guesses, time_taken_seconds, submitted_at')
        .eq('user_id', user.id)

    const submissionMap: Record<string, {
        solved: boolean
        num_guesses: number
        time_taken_seconds: number
        submitted_at: string
    }> = {}
    for (const s of mySubmissions || []) {
        submissionMap[s.game_id] = s
    }

    // For result-released games, fetch top 3 submissions
    const releasedGameIds = (games || []).filter(g => g.result_released).map(g => g.id)
    let allTopSubmissions: {
        game_id: string
        user_id: string
        solved: boolean
        num_guesses: number
        time_taken_seconds: number
        submitted_at: string
        user: { name: string } | null
    }[] = []

    if (releasedGameIds.length > 0) {
        const { data: tops } = await supabase
            .from('game_submissions')
            .select('game_id, user_id, solved, num_guesses, time_taken_seconds, submitted_at, user:users(name)')
            .in('game_id', releasedGameIds)
            .eq('solved', true)
            .order('submitted_at', { ascending: true })
        allTopSubmissions = (tops || []) as unknown as typeof allTopSubmissions
    }

    // Group top submissions by game (top 3 per game + least guesser)
    const topByGame: Record<string, typeof allTopSubmissions> = {}
    for (const s of allTopSubmissions) {
        if (!topByGame[s.game_id]) topByGame[s.game_id] = []
        topByGame[s.game_id].push(s)
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Games</h1>
                <p className="text-muted-foreground text-sm mt-1">Challenge yourself with word games</p>
            </div>
            <GamesPageClient
                games={games || []}
                submissionMap={submissionMap}
                topByGame={topByGame}
                userId={user.id}
                now={now.toISOString()}
            />
        </div>
    )
}
