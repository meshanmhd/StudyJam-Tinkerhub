'use client'

import { UserScore } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getUserLevel } from '@/types'

const RANK_STYLES = [
    'text-amber-400',    // 1st
    'text-slate-300',    // 2nd
    'text-amber-600',    // 3rd
]

const RANK_LABELS = ['🥇', '🥈', '🥉', '4', '5']

interface LeaderboardProps {
    students: UserScore[]
    currentUserId: string
    currentUserScore?: UserScore
    viewMode?: 'individual' | 'team'
}

export function Leaderboard({ students, currentUserId, currentUserScore, viewMode = 'individual' }: LeaderboardProps) {
    const isTeamView = viewMode === 'team'

    // In team view, deduplicate by team_id and sort by team_xp
    const uniqueTeams = Array.from(new Map(students.filter(s => s.team_id).map(s => [s.team_id, s])).values())
        .sort((a, b) => b.team_xp - a.team_xp)

    const listToRender = isTeamView ? uniqueTeams : students
    const topFive = listToRender.slice(0, 5)

    const currentRank = currentUserScore
        ? isTeamView
            ? listToRender.findIndex(s => s.team_id === currentUserScore.team_id) + 1
            : students.findIndex(s => s.user_id === currentUserId) + 1
        : null

    return (
        <div className="space-y-4">
            {/* Top 5 */}
            <div className="space-y-2">
                {topFive.map((student, i) => {
                    const isMe = isTeamView
                        ? student.team_id === currentUserScore?.team_id
                        : student.user_id === currentUserId

                    const displayName = isTeamView ? student.team_name || 'Unknown Team' : student.name
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

                    // For individual view: level is based on impact score (final_score)
                    const level = !isTeamView ? getUserLevel(student.final_score) : null

                    return (
                        <div
                            key={isTeamView ? student.team_id : student.user_id}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
                                isMe
                                    ? 'bg-primary/10 border-primary/30'
                                    : 'glass border-border/30 hover:border-border/60'
                            )}
                        >
                            <span className={cn('text-lg w-6 text-center font-bold shrink-0', i < 3 ? RANK_STYLES[i] : 'text-muted-foreground text-sm')}>
                                {RANK_LABELS[i]}
                            </span>
                            <Avatar className="w-8 h-8 shrink-0">
                                <AvatarFallback className={cn('text-xs font-bold', isMe ? 'bg-primary/30 text-primary' : 'bg-muted/60')}>
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className={cn('text-sm font-medium truncate', isMe && 'text-primary')}>
                                    {displayName}
                                </p>
                                {!isTeamView && level && (
                                    <p className="text-[11px] text-muted-foreground">Lv.{level.level} {level.title}</p>
                                )}
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-foreground">
                                    {isTeamView
                                        ? student.team_xp.toLocaleString()
                                        : Math.round(student.final_score).toLocaleString()
                                    }
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {isTeamView ? 'Team XP' : 'Impact'}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* User's position if outside top 5 */}
            {currentRank && currentRank > 5 && currentUserScore && (
                <div className="border-t border-border/30 pt-3">
                    <p className="text-xs text-muted-foreground mb-2 px-4">Your {isTeamView ? 'Team Position' : 'Position'}</p>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-primary/10 border-primary/30">
                        <span className="text-sm font-bold text-muted-foreground w-6 text-center shrink-0">#{currentRank}</span>
                        <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="text-xs font-bold bg-primary/30 text-primary">
                                {isTeamView
                                    ? currentUserScore.team_name?.slice(0, 2).toUpperCase()
                                    : currentUserScore.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                                {isTeamView ? currentUserScore.team_name : currentUserScore.name}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-bold">
                                {isTeamView ? currentUserScore.team_xp.toLocaleString() : Math.round(currentUserScore.final_score).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{isTeamView ? 'Team XP' : 'Impact'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
