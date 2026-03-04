'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Clock, CheckCircle2, Trophy, Zap, Lock, Award, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Game = {
    id: string
    title: string
    game_type: string
    target_word: string
    deadline: string | null
    result_released: boolean
    created_at: string
}

type MySubmission = {
    solved: boolean
    num_guesses: number
    time_taken_seconds: number
    submitted_at: string
}

type TopSub = {
    game_id: string
    user_id: string
    solved: boolean
    num_guesses: number
    time_taken_seconds: number
    submitted_at: string
    user: { name: string } | null
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
}

function Countdown({ deadline }: { deadline: string }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        function update() {
            const diff = new Date(deadline).getTime() - Date.now()
            if (diff <= 0) { setTimeLeft('Ended'); return }
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            if (h > 0) setTimeLeft(`${h}h ${m}m left`)
            else if (m > 0) setTimeLeft(`${m}m ${s}s left`)
            else setTimeLeft(`${s}s left`)
        }
        update()
        const t = setInterval(update, 1000)
        return () => clearInterval(t)
    }, [deadline])

    return <span>{timeLeft}</span>
}

function ResultPopup({
    game,
    topSubs,
    mySubmission,
    userId,
    onClose,
}: {
    game: Game
    topSubs: TopSub[]
    mySubmission: MySubmission | undefined
    userId: string
    onClose: () => void
}) {
    const medals = ['🥇', '🥈', '🥉']
    const xpValues = [20, 10, 5]
    const top3 = topSubs.slice(0, 3)

    const sortedByGuesses = [...topSubs].sort((a, b) => a.num_guesses - b.num_guesses)
    const leastGuesser = sortedByGuesses.find(s => !top3.find(t => t.user_id === s.user_id))
        || sortedByGuesses[0]

    // Find current user's rank
    const myRankIndex = topSubs.findIndex(s => s.user_id === userId)
    const myXp = myRankIndex >= 0 && myRankIndex < 3 ? xpValues[myRankIndex] :
        leastGuesser?.user_id === userId ? 5 : 0

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md dialog-stroke">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy size={18} className="text-amber-400" />
                        {game.title} — Results
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Secret Word</p>
                        <p className="text-3xl font-bold font-mono tracking-[0.3em]">{game.target_word}</p>
                    </div>

                    {/* Top 3 */}
                    {top3.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Leaderboard</p>
                            {top3.map((sub, i) => (
                                <div key={sub.user_id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${i === 0 ? 'bg-amber-500/5 border-amber-500/20' :
                                    i === 1 ? 'bg-zinc-500/5 border-zinc-500/20' :
                                        'bg-orange-500/5 border-orange-500/20'
                                    } ${sub.user_id === userId ? 'ring-1 ring-primary/40' : ''}`}>
                                    <span className="text-lg">{medals[i]}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                            {sub.user?.name || 'Unknown'}
                                            {sub.user_id === userId && ' (you)'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1"><Hash size={9} />{sub.num_guesses}</span>
                                            <span className="flex items-center gap-1"><Clock size={9} />{formatTime(sub.time_taken_seconds)}</span>
                                        </div>
                                    </div>
                                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                                        <Zap size={11} />{xpValues[i]} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Fewest guesses (if not top 3) */}
                    {leastGuesser && !top3.find(s => s.user_id === leastGuesser.user_id) && (
                        <div className="rounded-xl px-3 py-2.5 border border-primary/20 bg-primary/5 flex items-center gap-3">
                            <span className="text-lg">🎯</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Fewest Guesses</p>
                                <p className="font-semibold text-sm">
                                    {leastGuesser.user?.name || 'Unknown'}
                                    {leastGuesser.user_id === userId && ' (you)'}
                                </p>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-primary">
                                <Zap size={11} />5 XP
                            </span>
                        </div>
                    )}

                    {/* My result */}
                    {mySubmission && (
                        <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-3 space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Result</p>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium">
                                        {mySubmission.solved ? '✅ Solved!' : '❌ Not solved'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {mySubmission.num_guesses} guesses · {formatTime(mySubmission.time_taken_seconds)}
                                    </p>
                                </div>
                                {myXp > 0 && (
                                    <div className="flex items-center gap-1 font-bold text-amber-400">
                                        <Zap size={14} />
                                        +{myXp} XP earned
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!mySubmission && (
                        <p className="text-center text-sm text-muted-foreground py-2">
                            You didn&apos;t participate in this game.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function GamesPageClient({
    games,
    submissionMap,
    topByGame,
    userId,
    now,
}: {
    games: Game[]
    submissionMap: Record<string, MySubmission>
    topByGame: Record<string, TopSub[]>
    userId: string
    now: string
}) {
    const [selectedGame, setSelectedGame] = useState<Game | null>(null)
    const router = useRouter()
    const nowDate = new Date(now)

    const visibleGames = games.filter(g => {
        // Show active games & result-released games
        if (g.result_released) return true
        if (!g.deadline) return true
        return new Date(g.deadline) > nowDate
    })

    if (visibleGames.length === 0) {
        return (
            <div className="glass rounded-2xl p-12 text-center border border-border/20">
                <Gamepad2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No games available</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Check back later for new challenges!</p>
            </div>
        )
    }

    return (
        <>
            {selectedGame && (
                <ResultPopup
                    game={selectedGame}
                    topSubs={topByGame[selectedGame.id] || []}
                    mySubmission={submissionMap[selectedGame.id]}
                    userId={userId}
                    onClose={() => setSelectedGame(null)}
                />
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleGames.map(game => {
                    const mySubmission = submissionMap[game.id]
                    const isActive = !game.result_released && (
                        !game.deadline || new Date(game.deadline) > nowDate
                    )
                    const isExpired = game.deadline && new Date(game.deadline) <= nowDate && !game.result_released
                    const wordLen = game.target_word.length

                    return (
                        <div
                            key={game.id}
                            className={`glass rounded-2xl border border-border/20 p-5 flex flex-col gap-4 transition-all ${!isExpired ? 'hover:border-border/40 cursor-pointer' : 'opacity-60'
                                }`}
                            onClick={() => {
                                if (game.result_released) {
                                    setSelectedGame(game)
                                } else if (isActive && !mySubmission) {
                                    router.push(`/games/${game.id}`)
                                }
                            }}
                        >
                            {/* Top row */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">
                                            Wordle · {wordLen} letters
                                        </span>
                                        {game.result_released && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
                                                Results Out
                                            </span>
                                        )}
                                        {isActive && !mySubmission && (
                                            <span className="live-badge text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-medium">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-base truncate">{game.title}</h3>
                                </div>
                                <div className="text-2xl shrink-0">
                                    {mySubmission ? (mySubmission.solved ? '✅' : '❌') : '🟩'}
                                </div>
                            </div>

                            {/* Deadline */}
                            {game.deadline && !game.result_released && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock size={11} />
                                    <Countdown deadline={game.deadline} />
                                </div>
                            )}

                            {/* My submission info */}
                            {mySubmission && (
                                <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/10 rounded-lg px-3 py-2">
                                    <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                                    <span>
                                        {mySubmission.solved ? `Solved in ${mySubmission.num_guesses} guesses` : 'Not solved'} · {formatTime(mySubmission.time_taken_seconds)}
                                    </span>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="mt-auto">
                                {game.result_released ? (
                                    <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                                        <Trophy size={12} />
                                        View Results
                                    </Button>
                                ) : mySubmission ? (
                                    <Button variant="ghost" size="sm" disabled className="w-full gap-2 text-xs">
                                        <Lock size={12} />
                                        Submitted
                                    </Button>
                                ) : isActive ? (
                                    <Button size="sm" className="w-full gap-2 text-xs">
                                        <Gamepad2 size={12} />
                                        Play Now
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" disabled className="w-full gap-2 text-xs opacity-40">
                                        Game Ended
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
