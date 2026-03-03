import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { WordleGame } from './wordle-game'

export default async function PlayGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single()

    if (!game) notFound()

    // If result released, redirect back to games page
    if (game.result_released) redirect('/games')

    // If deadline passed, redirect back
    if (game.deadline && new Date(game.deadline) < new Date()) redirect('/games')

    // Check if already submitted
    const { data: existing } = await supabase
        .from('game_submissions')
        .select('id')
        .eq('game_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

    if (existing) redirect('/games')

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <a href="/games" className="hover:text-foreground transition-colors">Games</a>
                    <span>/</span>
                    <span>{game.title}</span>
                </div>
                <h1 className="text-2xl font-bold">{game.title}</h1>
                {game.deadline && (
                    <p className="text-muted-foreground text-sm mt-1">
                        Deadline: {new Date(game.deadline).toLocaleString()}
                    </p>
                )}
            </div>

            <WordleGame
                gameId={game.id}
                targetWord={game.target_word}
                wordList={game.word_list as string[]}
            />
        </div>
    )
}
