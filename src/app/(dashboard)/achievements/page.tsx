import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getUserLevel, getLevelProgress } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function AchievementsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [profileRes, scoreRes, badgesRes, submissionsRes, attendanceRes] = await Promise.all([
        supabase.from('users').select('*, team:teams(id, team_name, team_xp, weekly_title)').eq('id', user.id).single(),
        supabase.from('user_scores').select('*').eq('user_id', user.id).single(),
        supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id).order('awarded_at', { ascending: false }),
        supabase.from('task_submissions').select('id, status, xp_given, task:tasks(title), approved_at').eq('user_id', user.id).eq('status', 'approved').order('approved_at', { ascending: false }),
        supabase.from('attendance').select('date, status').eq('student_id', user.id).order('date', { ascending: false }).limit(30),
    ])

    const profile = profileRes.data
    const score = scoreRes.data
    const userBadges = badgesRes.data || []
    const approvedTasks = submissionsRes.data || []
    const recentAttendance = attendanceRes.data || []

    if (!profile || !score) redirect('/dashboard')

    const level = getUserLevel(score.final_score)
    const progress = getLevelProgress(score.final_score)

    const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Achievements</h1>
                <p className="text-muted-foreground text-sm mt-1">Your progress, badges, and highlights</p>
            </div>

            {/* Profile card */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-6 flex items-center gap-5">
                <Avatar className="w-16 h-16 shrink-0">
                    <AvatarFallback className="text-xl font-bold bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <h2 className="text-lg font-bold">{profile.name}</h2>
                            {profile.weekly_highlight && (
                                <span className="inline-block mt-1 text-xs text-primary border border-primary/30 bg-primary/10 px-2.5 py-0.5 rounded-full">
                                    {profile.weekly_highlight}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{Math.round(score.final_score)}</p>
                            <p className="text-xs text-muted-foreground">Impact Score</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Level */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Level Progress</h2>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-bold">Lv.{level.level}</p>
                                <p className="text-sm text-muted-foreground">{level.title}</p>
                            </div>
                            {level.maxImpact !== null && (
                                <p className="text-xs text-muted-foreground text-right">
                                    {Math.round(level.maxImpact - score.final_score)} pts to next level
                                </p>
                            )}
                        </div>
                        <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
                                <p className="text-lg font-bold">{score.individual_xp.toLocaleString()}</p>
                                <p className="text-[11px] text-muted-foreground">Individual XP</p>
                            </div>
                            <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-center">
                                <p className="text-lg font-bold">{score.team_xp.toLocaleString()}</p>
                                <p className="text-[11px] text-muted-foreground">Team XP</p>
                            </div>
                            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                                <p className="text-lg font-bold text-primary">{Math.round(score.final_score)}</p>
                                <p className="text-[11px] text-muted-foreground">Impact</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Streaks */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Attendance Streaks</h2>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-orange-500/8 border border-orange-500/20 p-4 text-center">
                            <p className="text-3xl font-bold text-orange-400">{profile.streak_days ?? 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Current Streak</p>
                        </div>
                        <div className="rounded-lg bg-muted/20 border border-border/30 p-4 text-center">
                            <p className="text-3xl font-bold">{profile.longest_streak ?? 0}</p>
                            <p className="text-xs text-muted-foreground mt-1">Best Streak</p>
                        </div>
                    </div>
                    {/* Recent attendance mini-grid */}
                    {recentAttendance.length > 0 && (
                        <div className="px-5 pb-5">
                            <p className="text-xs text-muted-foreground mb-2">Recent 30 days</p>
                            <div className="flex gap-1 flex-wrap">
                                {recentAttendance.map(r => {
                                    const attColor: Record<string, string> = {
                                        present: 'w-4 h-4 rounded-sm bg-emerald-500/70',
                                        absent: 'w-4 h-4 rounded-sm bg-red-500/70',
                                        no_class: 'w-4 h-4 rounded-sm bg-blue-500/40',
                                    }
                                    return (
                                        <div
                                            key={r.date}
                                            title={r.date + ' · ' + r.status.replace('_', ' ')}
                                            className={attColor[r.status] || 'w-4 h-4 rounded-sm bg-muted/30'}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Badges */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Badges</h2>
                        <span className="text-xs text-muted-foreground">{userBadges.length} earned</span>
                    </div>
                    <div className="p-5">
                        {userBadges.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No badges yet. Keep participating!</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {userBadges.map(ub => (
                                    <div
                                        key={ub.id}
                                        className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-medium"
                                    >
                                        <span className="text-base">{ub.badge?.icon || '🏅'}</span>
                                        <span>{ub.badge?.name || 'Badge'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Team */}
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10">
                        <h2 className="text-sm font-semibold">Team</h2>
                    </div>
                    <div className="p-5">
                        {profile.team ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-base">{profile.team.team_name}</p>
                                    <span className="text-sm font-bold text-amber-400">{profile.team.team_xp.toLocaleString()} XP</span>
                                </div>
                                {profile.team.weekly_title && (
                                    <span className="inline-block text-xs text-primary border border-primary/30 bg-primary/10 px-2.5 py-0.5 rounded-full">
                                        {profile.team.weekly_title}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-6">Not assigned to a team yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Approved task submissions */}
            {approvedTasks.length > 0 && (
                <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                    <div className="px-5 py-4 border-b border-border/30 bg-muted/10 flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Completed Tasks</h2>
                        <span className="text-xs text-muted-foreground">{approvedTasks.length} approved</span>
                    </div>
                    <div className="divide-y divide-border/20">
                        {approvedTasks.slice(0, 10).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between px-5 py-3">
                                <p className="text-sm font-medium">{(sub.task as { title?: string } | null)?.title || 'Task'}</p>
                                <span className="text-sm font-bold text-amber-400 shrink-0">+{sub.xp_given} XP</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
