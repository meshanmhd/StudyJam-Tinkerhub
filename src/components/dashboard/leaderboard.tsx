'use client'

import { UserScore } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getUserLevel } from '@/types'

const getRankDisplay = (rank: number) => {
    if (rank === 1) return { label: '🥇', style: 'text-amber-400 text-lg' }
    if (rank === 2) return { label: '🥈', style: 'text-slate-300 text-lg' }
    if (rank === 3) return { label: '🥉', style: 'text-amber-600 text-lg' }
    return { label: `#${rank}`, style: 'text-muted-foreground text-sm' }
}

interface LeaderboardProps {
    students: UserScore[]
    currentUserId: string
    currentUserScore?: UserScore
    viewMode?: 'individual' | 'team'
    limit?: number
}

export function Leaderboard({ students, currentUserId, currentUserScore, viewMode = 'individual', limit }: LeaderboardProps) {
    const isTeamView = viewMode === 'team'

    // In team view, deduplicate by team_id and sort by team_xp
    const uniqueTeams = Array.from(new Map(students.filter(s => s.team_id).map(s => [s.team_id, s])).values())
        .sort((a, b) => b.team_xp - a.team_xp)

    const listToRender = isTeamView ? uniqueTeams : students

    // Create sorted array of unique rounded scores (for dense ranking)
    const allUniqueScores = Array.from(
        new Set(
            listToRender.map(s => Math.round(isTeamView ? s.team_xp : s.final_score))
        )
    ).sort((a, b) => b - a)

    const rankedList = listToRender.map((student) => {
        const score = Math.round(isTeamView ? student.team_xp : student.final_score);
        const rank = allUniqueScores.indexOf(score) + 1;
        return { ...student, rank };
    });

    const displayList = limit ? rankedList.slice(0, limit) : rankedList

    // Find current user's rank
    let currentRank: number | null = null;
    let rankObj = null;
    if (currentUserScore) {
        if (isTeamView && currentUserScore.team_id) {
            rankObj = rankedList.find(s => s.team_id === currentUserScore.team_id);
        } else if (!isTeamView) {
            rankObj = rankedList.find(s => s.user_id === currentUserId);
        }
    }
    if (rankObj) currentRank = rankObj.rank;

    return (
        <div className="space-y-4">
            {/* Top 5 */}
            <div className="space-y-2">
                {displayList.map((student, i) => {
                    const isMe = isTeamView
                        ? student.team_id === currentUserScore?.team_id
                        : student.user_id === currentUserId

                    const displayName = isTeamView ? student.team_name || 'Unknown Team' : student.name
                    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

                    // For individual view: level is based on impact score (final_score)
                    const level = !isTeamView ? getUserLevel(student.final_score) : null
                    const { label, style } = getRankDisplay(student.rank)

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
                            <span className={cn('w-6 text-center font-bold shrink-0', style)}>
                                {label}
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
                                        ? Math.round(student.team_xp).toLocaleString()
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

            {/* User's position if outside the limit */}
            {limit && currentRank && currentRank > limit && currentUserScore && (
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
                                {isTeamView ? Math.round(currentUserScore.team_xp).toLocaleString() : Math.round(currentUserScore.final_score).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{isTeamView ? 'Team XP' : 'Impact'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
