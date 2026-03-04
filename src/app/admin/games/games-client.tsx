'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGame } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Gamepad2, Trophy, Users, Calendar, ExternalLink } from 'lucide-react'

type Game = {
    id: string
    title: string
    game_type: string
    target_word: string
    deadline: string | null
    result_released: boolean
    created_at: string
    submission_count: number
}

export function GamesClient({ games }: { games: Game[] }) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        const formData = new FormData(e.currentTarget)
        startTransition(async () => {
            const result = await createGame(formData)
            if (result.error) {
                setError(result.error)
            } else {
                setOpen(false)
                router.refresh()
            }
        })
    }

    const now = new Date()

    return (
        <>
            {/* Header row with create button */}
            <div className="flex justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus size={15} />
                            Create Game
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg dialog-stroke">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Gamepad2 size={18} />
                                Create Wordle Game
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4 mt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Game Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="e.g. Wednesday Wordle"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="target_word">Secret Word</Label>
                                <Input
                                    id="target_word"
                                    name="target_word"
                                    placeholder="e.g. CRANE"
                                    required
                                    className="uppercase"
                                    maxLength={10}
                                />
                                <p className="text-xs text-muted-foreground">Students can guess any real English word of this length</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="deadline">Deadline (optional)</Label>
                                <Input
                                    id="deadline"
                                    name="deadline"
                                    type="datetime-local"
                                />
                                <p className="text-xs text-muted-foreground">Game auto-deletes 24 hours after deadline</p>
                            </div>

                            {error && (
                                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
                            )}

                            <div className="flex gap-2 justify-end pt-2">
                                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? 'Creating...' : 'Create Game'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Games list */}
            {games.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-border/20">
                    <Gamepad2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No games yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Create your first Wordle game to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {games.map(game => {
                        const isExpired = game.deadline ? new Date(game.deadline) < now : false
                        const isActive = !isExpired
                        return (
                            <div
                                key={game.id}
                                onClick={() => router.push(`/admin/games/${game.id}`)}
                                className="glass rounded-2xl border border-border/20 p-5 hover:border-border/40 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wide">
                                                Wordle
                                            </span>
                                            {game.result_released && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-medium">
                                                    Results Released
                                                </span>
                                            )}
                                            {isActive && !game.result_released && (
                                                <span className="live-badge text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
                                                    Active
                                                </span>
                                            )}
                                            {isExpired && !game.result_released && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                                                    Ended
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-base">{game.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users size={11} />
                                                {game.submission_count} submissions
                                            </span>
                                            {game.deadline && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    {new Date(game.deadline).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground mt-1 shrink-0 transition-colors" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
