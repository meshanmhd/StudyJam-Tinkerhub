import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { GameAnalyticsClient } from './game-analytics-client'

export default async function AdminGameAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single()

    if (!game) notFound()

    const { data: submissions } = await supabase
        .from('game_submissions')
        .select('*, user:users(name)')
        .eq('game_id', id)
        .order('submitted_at', { ascending: true })

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <a href="/admin/games" className="hover:text-foreground transition-colors">Games</a>
                    <span>/</span>
                    <span>Analytics</span>
                </div>
                <h1 className="text-2xl font-bold">{game.title}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Word: <span className="font-mono font-bold text-foreground">{game.result_released ? game.target_word : '•'.repeat(game.target_word.length)}</span>
                    &nbsp;·&nbsp;{game.target_word.length} letters
                </p>
            </div>

            <GameAnalyticsClient
                game={game}
                submissions={(submissions || []).map(s => ({
                    ...s,
                    userName: (s.user as { name: string } | null)?.name || 'Unknown',
                }))}
            />
        </div>
    )
}
