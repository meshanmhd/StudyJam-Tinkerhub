'use client'

import { useState, useEffect } from 'react'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { UserScore } from '@/types'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface RealtimeLeaderboardProps {
    initialScores: UserScore[]
    currentUserId: string
}

export function RealtimeLeaderboard({ initialScores, currentUserId }: RealtimeLeaderboardProps) {
    const [scores, setScores] = useState<UserScore[]>(initialScores)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [view, setView] = useState<'individual' | 'team'>('individual')
    const supabase = createClient()

    const fetchLeaderboard = async () => {
        setIsRefreshing(true)
        try {
            const { data } = await supabase
                .from('user_scores')
                .select('*')
                .order(view === 'individual' ? 'final_score' : 'team_xp', { ascending: false })

            if (data) {
                // Filter out admins
                const filteredScores = data.filter(s => s.role !== 'admin')
                setScores(filteredScores)
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Auto-refresh every 1 minute (60000 ms)
    useEffect(() => {
        const interval = setInterval(fetchLeaderboard, 60000)
        return () => clearInterval(interval)
    }, [view])

    // Fetch when view changes
    useEffect(() => {
        fetchLeaderboard()
    }, [view])

    // Sync with server updates (triggered by RealtimeProvider's router.refresh)
    useEffect(() => {
        setScores(initialScores)
    }, [initialScores])

    const currentUserScore = scores.find(s => s.user_id === currentUserId)

    // Sort by selected mode utilizing rounded values
    const sortedScores = [...scores].sort((a, b) => {
        if (view === 'team') {
            return Math.round(b.team_xp) - Math.round(a.team_xp)
        }
        return Math.round(b.final_score) - Math.round(a.final_score)
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex bg-muted/30 p-1 rounded-xl glass border border-border/20">
                    <button
                        onClick={() => setView('individual')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'individual' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Individual
                    </button>
                    <button
                        onClick={() => setView('team')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'team' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Team XP
                    </button>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchLeaderboard}
                    disabled={isRefreshing}
                    className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Refresh</span>
                </Button>
            </div>

            <div className="glass rounded-2xl p-4 border border-border/40">
                <Leaderboard
                    students={sortedScores}
                    currentUserId={currentUserId}
                    currentUserScore={currentUserScore}
                    viewMode={view}
                    limit={5}
                />
            </div>
        </div>
    )
}
