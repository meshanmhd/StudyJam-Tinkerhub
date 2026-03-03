'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { releaseGameResult } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Trophy, Clock, Hash, CheckCircle2, XCircle, Zap, Award } from 'lucide-react'

type Submission = {
    id: string
    user_id: string
    userName: string
    solved: boolean
    guesses: string[]
    num_guesses: number
    time_taken_seconds: number
    submitted_at: string
}

type Game = {
    id: string
    title: string
    target_word: string
    result_released: boolean
    deadline: string | null
}

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
}

export function GameAnalyticsClient({ game, submissions }: { game: Game; submissions: Submission[] }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    const solved = submissions.filter(s => s.solved).sort((a, b) =>
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    )
    const unsolved = submissions.filter(s => !s.solved)

    const top3 = solved.slice(0, 3)
    const leastGuesser = solved.length > 0
        ? [...solved].sort((a, b) => a.num_guesses - b.num_guesses)[0]
        : null

    const medals = ['🥇', '🥈', '🥉']
    const xpValues = [20, 10, 5]

    function handleRelease() {
        setError('')
        startTransition(async () => {
            const result = await releaseGameResult(game.id)
            if (result.error) setError(result.error)
            else router.refresh()
        })
    }

    return (
        <div className="space-y-6">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass rounded-xl border border-border/20 p-4 text-center">
                    <p className="text-2xl font-bold">{submissions.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Players</p>
                </div>
                <div className="glass rounded-xl border border-border/20 p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{solved.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Solved</p>
                </div>
                <div className="glass rounded-xl border border-border/20 p-4 text-center">
                    <p className="text-2xl font-bold text-rose-400">{unsolved.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Didn&apos;t Solve</p>
                </div>
                <div className="glass rounded-xl border border-border/20 p-4 text-center">
                    <p className="text-2xl font-bold">
                        {solved.length > 0
                            ? (solved.reduce((a, b) => a + b.num_guesses, 0) / solved.length).toFixed(1)
                            : '–'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Guesses</p>
                </div>
            </div>

            {/* Top 3 Podium */}
            {top3.length > 0 && (
                <div className="glass rounded-2xl border border-border/20 p-6">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Trophy size={14} />
                        Top Finishers
                    </h2>
                    <div className="space-y-3">
                        {top3.map((sub, i) => {
                            const isLeastGuesser = leastGuesser?.user_id === sub.user_id
                            return (
                                <div key={sub.id} className={`flex items-center gap-4 rounded-xl px-4 py-3 border ${i === 0 ? 'bg-amber-500/5 border-amber-500/20' :
                                        i === 1 ? 'bg-zinc-500/5 border-zinc-500/20' :
                                            'bg-orange-500/5 border-orange-500/20'
                                    }`}>
                                    <span className="text-xl w-8 text-center">{medals[i]}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm truncate">{sub.userName}</p>
                                            {isLeastGuesser && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
                                                    🎯 Fewest Guesses
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Hash size={10} />{sub.num_guesses} guesses</span>
                                            <span className="flex items-center gap-1"><Clock size={10} />{formatTime(sub.time_taken_seconds)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm font-bold text-amber-400">
                                        <Zap size={12} />
                                        {xpValues[i]} XP
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Fewest guesser (if not top 3) */}
                    {leastGuesser && !top3.find(s => s.user_id === leastGuesser.user_id) && (
                        <div className="mt-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Award size={11} /> Fewest Guesses Award
                            </p>
                            <div className="flex items-center gap-4 rounded-xl px-4 py-3 border border-primary/20 bg-primary/5">
                                <span className="text-xl">🎯</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{leastGuesser.userName}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{leastGuesser.num_guesses} guesses only!</p>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-bold text-primary">
                                    <Zap size={12} />5 XP
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* All participants table */}
            <div className="glass rounded-2xl border border-border/20 p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    All Participants ({submissions.length})
                </h2>
                {submissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No submissions yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-muted-foreground border-b border-border/20">
                                    <th className="pb-3 pr-4 font-medium">Student</th>
                                    <th className="pb-3 pr-4 font-medium text-center">Solved</th>
                                    <th className="pb-3 pr-4 font-medium text-center">Guesses</th>
                                    <th className="pb-3 pr-4 font-medium text-center">Time Taken</th>
                                    <th className="pb-3 font-medium">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/10">
                                {submissions.map(sub => (
                                    <tr key={sub.id} className="hover:bg-muted/5 transition-colors">
                                        <td className="py-3 pr-4 font-medium">{sub.userName}</td>
                                        <td className="py-3 pr-4 text-center">
                                            {sub.solved
                                                ? <CheckCircle2 size={14} className="inline text-green-400" />
                                                : <XCircle size={14} className="inline text-rose-400" />}
                                        </td>
                                        <td className="py-3 pr-4 text-center text-muted-foreground">{sub.num_guesses}</td>
                                        <td className="py-3 pr-4 text-center text-muted-foreground">{formatTime(sub.time_taken_seconds)}</td>
                                        <td className="py-3 text-muted-foreground text-xs">
                                            {new Date(sub.submitted_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Release Results */}
            <div className="glass rounded-2xl border border-border/20 p-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Release Results</h2>
                {game.result_released ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 size={16} />
                        Results have been released. Students can view their ranking. XP has been awarded.
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-4">
                            Once released, students cannot submit further. XP will be automatically awarded to top performers.
                            The secret word will be revealed on this page.
                        </p>
                        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
                        <Button
                            onClick={handleRelease}
                            disabled={isPending || submissions.length === 0}
                            className="gap-2"
                        >
                            <Trophy size={14} />
                            {isPending ? 'Releasing...' : 'Release Results & Award XP'}
                        </Button>
                        {submissions.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">Need at least 1 submission to release.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
