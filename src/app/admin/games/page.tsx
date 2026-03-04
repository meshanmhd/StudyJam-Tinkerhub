import { createClient } from '@/utils/supabase/server'
import { GamesClient } from './games-client'

export default async function AdminGamesPage() {
    const supabase = await createClient()

    const { data: games } = await supabase
        .from('games')
        .select('*, submissions:game_submissions(count)')
        .order('created_at', { ascending: false })

    // Count submissions per game
    const { data: subCounts } = await supabase
        .from('game_submissions')
        .select('game_id')

    const countMap: Record<string, number> = {}
    for (const s of subCounts || []) {
        countMap[s.game_id] = (countMap[s.game_id] || 0) + 1
    }

    const enriched = (games || []).map(g => ({
        ...g,
        submission_count: countMap[g.id] || 0,
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Games</h1>
                <p className="text-muted-foreground text-sm mt-1">Create and manage word games for students</p>
            </div>
            <GamesClient games={enriched} />
        </div>
    )
}
