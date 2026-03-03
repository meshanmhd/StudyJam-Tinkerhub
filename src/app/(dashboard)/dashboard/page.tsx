import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LevelCard } from '@/components/dashboard/level-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { TaskCard } from '@/components/dashboard/task-card'
import { BadgeGrid } from '@/components/dashboard/badge-grid'
import { RealtimeLeaderboard } from '@/components/dashboard/realtime-leaderboard'
import { RefreshButton } from '@/components/ui/refresh-button'
import type { Task, TaskSubmission, UserBadge, UserScore } from '@/types'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Parallel data fetching
    const [profileRes, scoresRes, tasksRes, submissionsRes, badgesRes] = await Promise.all([
        supabase.from('users').select('*, team:teams(*)').eq('id', user.id).single(),
        supabase.from('user_scores').select('*').order('final_score', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_submissions').select('*').eq('user_id', user.id),
        supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id),
    ])

    const profile = profileRes.data
    if (!profile) redirect('/login')
    if (profile.role === 'admin') redirect('/admin')

    const scoresResData: UserScore[] = scoresRes.data || []
    const scores = scoresResData.filter(s => s.role !== 'admin')
    const tasks: Task[] = tasksRes.data || []
    const submissions: TaskSubmission[] = submissionsRes.data || []
    const userBadges: UserBadge[] = badgesRes.data || []

    const currentUserScore = scores.find(s => s.user_id === user.id)
    const submissionMap = Object.fromEntries(submissions.map(s => [s.task_id, s]))

    // Impact score for level system
    const impactScore = currentUserScore ? currentUserScore.final_score : 0

    // 1-hour grace period for students
    const now = new Date()
    const ONE_HOUR = 60 * 60 * 1000

    // Active tasks: no deadline OR (deadline + 1 hour > now) OR they already submitted it
    const activeTasks = tasks.filter(t => {
        if (!t.deadline) return true
        const hasSubmitted = !!submissionMap[t.id]
        if (hasSubmitted) return true
        const deadlinePlusGrace = new Date(new Date(t.deadline).getTime() + ONE_HOUR)
        return deadlinePlusGrace > now
    })

    // Past tasks: has deadline AND deadline + 1 hour <= now AND not submitted
    const pastTasks = tasks.filter(t => {
        if (!t.deadline) return false
        const hasSubmitted = !!submissionMap[t.id]
        if (hasSubmitted) return false
        const deadlinePlusGrace = new Date(new Date(t.deadline).getTime() + ONE_HOUR)
        return deadlinePlusGrace <= now
    })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back</p>
                    <h1 className="text-4xl font-bold mt-0.5">
                        {profile.name.split(' ')[0]}
                    </h1>
                    {profile.team?.team_name && (
                        <p className="text-muted-foreground text-sm mt-1">
                            Team: {profile.team.team_name}
                        </p>
                    )}
                </div>
                <RefreshButton />
            </div>

            {/* Main Layout: Left 60% (col-span-7) / Right 40% (col-span-5) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (60%) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Level card — now driven by impact score */}
                    <div>
                        <LevelCard impact={impactScore} />
                    </div>

                    {/* Streak cards */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Current Streak — three states: active / frozen / reset */}
                        {(() => {
                            const state = (profile as { streak_state?: string }).streak_state || 'active'
                            const days = profile.streak_days

                            if (state === 'frozen') return (
                                <div className="glass rounded-2xl p-4 border border-blue-500/30 flex flex-col justify-center items-center h-full">
                                    <p className="text-3xl text-center mb-1">❄️</p>
                                    <p className="text-2xl font-bold text-blue-400 text-center">{days}</p>
                                    <p className="text-xs text-center text-blue-400 font-medium mt-0.5">Streak Frozen</p>
                                    <p className="text-[10px] text-center text-muted-foreground/60 mt-0.5">Attend today to keep it!</p>
                                </div>
                            )
                            if (state === 'reset' || days === 0) return (
                                <div className="glass rounded-2xl p-4 border border-rose-500/20 flex flex-col justify-center items-center h-full">
                                    <p className="text-3xl text-center mb-1">💀</p>
                                    <p className="text-2xl font-bold text-rose-400 text-center">0</p>
                                    <p className="text-xs text-center text-rose-400 font-medium mt-0.5">Streak Reset</p>
                                    <p className="text-[10px] text-center text-muted-foreground/60 mt-0.5">Start fresh today!</p>
                                </div>
                            )
                            return (
                                <div className="glass rounded-2xl p-4 border border-orange-500/20 flex flex-col justify-center items-center h-full">
                                    <p className="text-3xl text-center streak-glow mb-1">🔥</p>
                                    <p className="text-2xl font-bold text-orange-400 text-center">{days}</p>
                                    <p className="text-xs text-center text-orange-400/70 mt-0.5">Days in a row</p>
                                    <p className="text-[10px] text-center text-muted-foreground/60 mt-0.5">Your Current Streak</p>
                                </div>
                            )
                        })()}

                        {/* Longest Streak */}
                        <div className="glass rounded-2xl p-4 border border-amber-500/20 flex flex-col justify-center items-center h-full">
                            <p className="text-3xl text-center mb-1">🏆</p>
                            <p className="text-2xl font-bold text-amber-400 text-center">{profile.longest_streak}</p>
                            <p className="text-xs text-center text-amber-400/70 mt-0.5">Personal Best</p>
                            <p className="text-[10px] text-center text-muted-foreground/60 mt-0.5">Your Overall Best</p>
                        </div>
                    </div>

                    {/* Active Tasks below */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">
                                Active Tasks
                            </h2>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                +1hr Grace Period
                            </span>
                        </div>

                        {activeTasks.length === 0 ? (
                            <div className="glass rounded-2xl p-8 text-center border border-border/20">
                                <p className="text-2xl mb-2">✨</p>
                                <p className="text-muted-foreground text-sm font-medium">No active tasks right now.</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">Check back later for new challenges!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        submission={submissionMap[task.id] as TaskSubmission | undefined}
                                        userId={user.id}
                                    />
                                ))}
                            </div>
                        )}

                        {pastTasks.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                                    Past Tasks ({pastTasks.length})
                                </h2>
                                <div className="space-y-3 opacity-60 grayscale-[0.5] pointer-events-none">
                                    {pastTasks.map(task => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            submission={submissionMap[task.id] as TaskSubmission | undefined}
                                            userId={user.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (40%) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* XP cards at top */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            title="Individual XP"
                            value={profile.individual_xp.toLocaleString()}
                            subtitle="Personal"
                            color="blue"
                        />
                        <StatCard
                            title="Team XP"
                            value={(profile.team?.team_xp || 0).toLocaleString()}
                            subtitle={profile.team?.team_name || 'No team'}
                            color="purple"
                        />
                    </div>

                    {/* Leaderboard below XP */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Leaderboard
                        </h2>
                        <RealtimeLeaderboard
                            initialScores={scores}
                            currentUserId={user.id}
                        />


                    </div>

                    {/* Badges below everything */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Your Badges
                        </h2>
                        <BadgeGrid userBadges={userBadges} />
                    </div>
                </div>
            </div>
        </div>
    )
}
