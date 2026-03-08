'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── XP ──────────────────────────────────────────────────────────────────────

export async function addXpToUser(userId: string, teamId: string | null, xpValue: number, reason: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('xp_logs').insert({
        user_id: userId || null,
        team_id: teamId || null,
        category: 'other', // Default category for manual XP
        xp_value: xpValue,
        reason,
    })
    if (error) return { error: error.message }
    revalidatePath('/admin')
    revalidatePath('/admin/xp')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    revalidatePath('/team')
    return { success: true }
}

// Note: Delete XP Log is handled in @/app/admin/students/actions.ts to ensure sync with totals.

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase.from('tasks').insert({
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || null,
        xp_reward: parseInt(formData.get('xp_reward') as string),
        task_type: (formData.get('task_type') as string) || 'individual',
        level: (formData.get('level') as string) || null,
        deadline: (formData.get('deadline') as string) || null,
        created_by: user.id,
    }).select().single()

    if (error) return { error: error.message }
    revalidatePath('/admin/tasks')
    revalidatePath('/dashboard')
    return { success: true, task: data }
}

export async function updateTask(taskId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase.from('tasks').update({
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        xp_reward: parseInt(formData.get('xp_reward') as string),
        task_type: (formData.get('task_type') as string) || 'individual',
        deadline: formData.get('deadline') as string || null,
    }).eq('id', taskId).select().single()

    if (error) return { error: error.message }
    revalidatePath('/admin/tasks')
    revalidatePath(`/admin/tasks/${taskId}`)
    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    return { success: true, task: data }
}

export async function endTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('tasks').update({
        deadline: new Date().toISOString()
    }).eq('id', taskId)

    if (error) return { error: error.message }
    revalidatePath('/admin/tasks')
    revalidatePath(`/admin/tasks/${taskId}`)
    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    return { success: true }
}

export async function deleteTask(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) return { error: error.message }

    // We navigate to /admin/tasks from client, but we will revalidate here.
    revalidatePath('/admin/tasks')
    revalidatePath('/dashboard')
    revalidatePath('/tasks')
    return { success: true }
}


export async function reviewSubmission(
    submissionId: string,
    action: 'approved' | 'rejected',
    xpGiven: number,
    taskId: string,
    userId: string,
    adminComment?: string,
    allowResubmission: boolean = true
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const updates: Record<string, unknown> = {
        status: action,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        admin_comment: adminComment || null,
        allow_resubmission: action === 'rejected' ? allowResubmission : true
    }
    if (action === 'approved') updates.xp_given = xpGiven

    const { error } = await supabase.from('task_submissions').update(updates).eq('id', submissionId)
    if (error) return { error: error.message }

    if (action === 'approved') {
        const { data: task } = await supabase.from('tasks').select('title, task_type').eq('id', taskId).single()
        const { data: userProfile } = await supabase.from('users').select('team_id').eq('id', userId).single()

        const isTeamTask = task?.task_type === 'team'
        const autoReason = `${task?.title || 'Task'} — done`

        await supabase.from('xp_logs').insert({
            // Individual task: award to user only (no team_id — avoids triggering team XP)
            // Team task: award to team only (no user_id — avoids triggering individual XP)
            user_id: isTeamTask ? null : userId,
            team_id: isTeamTask ? (userProfile?.team_id || null) : null,
            category: 'task',
            xp_value: xpGiven,
            reason: autoReason,
        })
    }

    revalidatePath('/admin')
    revalidatePath('/admin/tasks')
    revalidatePath(`/admin/tasks/${taskId}`)
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    revalidatePath('/team')
    return { success: true }
}



// ─── Teams ────────────────────────────────────────────────────────────────────

export async function assignTeam(userId: string, teamId: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('users')
        .update({ team_id: teamId || null })
        .eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin/teams')
    revalidatePath('/dashboard')
    revalidatePath('/team')
    return { success: true }
}

export async function createTeam(name: string, memberIds: string[]) {
    const supabase = await createClient()
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ team_name: name })
        .select()
        .single()
    if (teamError) return { error: teamError.message }

    if (memberIds.length > 0) {
        const { error: assignError } = await supabase
            .from('users')
            .update({ team_id: team.id })
            .in('id', memberIds)
        if (assignError) return { error: assignError.message }
    }

    revalidatePath('/admin/teams')
    revalidatePath('/dashboard')
    revalidatePath('/team')
    return { success: true, team }
}

export async function addStudentsToTeam(teamId: string, memberIds: string[]) {
    if (memberIds.length === 0) return { success: true }
    const supabase = await createClient()
    const { error } = await supabase
        .from('users')
        .update({ team_id: teamId })
        .in('id', memberIds)
    if (error) return { error: error.message }

    revalidatePath('/admin/teams')
    revalidatePath('/dashboard')
    revalidatePath('/team')
    return { success: true }
}

export async function removeStudentFromTeam(userId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('users')
        .update({ team_id: null })
        .eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin/teams')
    revalidatePath('/dashboard')
    revalidatePath('/team')
    return { success: true }
}

export async function deleteTeam(teamId: string) {
    const supabase = await createClient()
    await supabase.from('users').update({ team_id: null }).eq('team_id', teamId)
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) return { error: error.message }
    revalidatePath('/admin/teams')
    revalidatePath('/dashboard')
    revalidatePath('/team')
    return { success: true }
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function createBadge(name: string, icon: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('badges')
        .insert({ name, icon, type: 'permanent' })
        .select()
        .single()
    if (error) return { error: error.message }
    revalidatePath('/admin/badges')
    return { success: true, badge: data }
}

export async function assignBadge(userId: string, badgeId: string) {
    const supabase = await createClient()
    const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', badgeId)
        .single()
    if (existing) return { error: 'This badge is already assigned to this student.' }

    const { data, error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId })
        .select()
        .single()
    if (error) return { error: error.message }
    revalidatePath('/admin/badges')
    revalidatePath('/dashboard')
    revalidatePath('/achievements')
    return { success: true, userBadge: data }
}

export async function removeBadge(userBadgeId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('user_badges').delete().eq('id', userBadgeId)
    if (error) return { error: error.message }
    revalidatePath('/admin/badges')
    revalidatePath('/dashboard')
    revalidatePath('/achievements')
    return { success: true }
}

// ─── Attendance ───────────────────────────────────────────────────────────────

async function recalculateStreak(
    supabase: Awaited<ReturnType<typeof createClient>>,
    studentId: string
) {
    const { data: records } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .order('date', { ascending: true })

    if (!records) return

    let currentStreak = 0
    let longestStreak = 0
    let lastActivityDate: string | null = null
    let lastValidDate: Date | null = null

    const msPerDay = 1000 * 60 * 60 * 24

    for (const record of records) {
        // Parse date reliably as UTC midnight
        const [y, m, d] = record.date.split('-').map(Number)
        const recordDate = new Date(Date.UTC(y, m - 1, d))

        if (record.status === 'absent') {
            currentStreak = 0
            lastValidDate = null
            continue
        }

        if (record.status === 'present') {
            if (!lastValidDate) {
                currentStreak = 1
            } else {
                const diffDays = Math.round((recordDate.getTime() - lastValidDate.getTime()) / msPerDay)
                if (diffDays === 1) {
                    currentStreak += 1
                } else {
                    currentStreak = 1 // Gap means streak broken
                }
            }
            lastActivityDate = record.date
            longestStreak = Math.max(longestStreak, currentStreak)
            lastValidDate = recordDate
        } else if (record.status === 'no_class') {
            if (lastValidDate) {
                const diffDays = Math.round((recordDate.getTime() - lastValidDate.getTime()) / msPerDay)
                if (diffDays === 1) {
                    lastValidDate = recordDate // bridge the gap
                } else {
                    currentStreak = 0 // broken before no_class
                    lastValidDate = recordDate
                }
            } else {
                lastValidDate = recordDate
            }
        }
    }

    const newState = currentStreak > 0 ? 'active' : 'reset'

    await supabase.from('users').update({
        streak_days: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: lastActivityDate,
        streak_state: newState,
    }).eq('id', studentId)
}

export async function markAttendanceBulk(
    date: string,
    records: { studentId: string; status: 'present' | 'absent' | 'no_class' }[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const rows = records.map(r => ({
        student_id: r.studentId,
        date,
        status: r.status,
        marked_by: user.id,
    }))

    const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' })
    if (error) return { error: error.message }

    // Recalculate streaks for all affected students
    const uniqueStudentIds = [...new Set(records.map(r => r.studentId))]
    await Promise.all(uniqueStudentIds.map(id => recalculateStreak(supabase, id)))

    // ── XP Revocation for Absentees ─────────────────────────────────────────────
    const nonPresentIds = records.filter(r => r.status !== 'present').map(r => r.studentId)
    if (nonPresentIds.length > 0) {
        // Find and delete individual attendance XP for these students for this date
        await supabase
            .from('xp_logs')
            .delete()
            .in('user_id', nonPresentIds)
            .eq('session_id', `attendance-${date}`)
            .eq('category', 'attendance')

        // Revoke team XP if applicable
        const { data: nonPresentProfiles } = await supabase
            .from('users')
            .select('team_id')
            .in('id', nonPresentIds)
            .not('team_id', 'is', null)

        if (nonPresentProfiles && nonPresentProfiles.length > 0) {
            const teamIdsToRevoke = [...new Set(nonPresentProfiles.map(p => p.team_id))]
            if (teamIdsToRevoke.length > 0) {
                await supabase
                    .from('xp_logs')
                    .delete()
                    .in('team_id', teamIdsToRevoke)
                    .eq('session_id', `attendance-team-${date}`)
                    .eq('category', 'attendance')
            }
        }
    }

    // ── Attendance XP for Present ─────────────────────────────────────────────
    const presentStudentIds = records.filter(r => r.status === 'present').map(r => r.studentId)

    if (presentStudentIds.length > 0) {
        // Award individual +10 XP per present student (idempotent: check for same date + category)
        for (const studentId of presentStudentIds) {
            const { data: existing } = await supabase
                .from('xp_logs')
                .select('id')
                .eq('user_id', studentId)
                .eq('session_id', `attendance-${date}`)
                .eq('category', 'attendance')
                .maybeSingle()

            if (!existing) {
                await supabase.from('xp_logs').insert({
                    user_id: studentId,
                    team_id: null,
                    category: 'attendance',
                    xp_value: 10,
                    reason: `Attendance streak — ${date}`,
                    session_id: `attendance-${date}`,
                })
            }
        }

        // Award team +10 XP if ALL team members are present
        // Get team_ids for present students
        const { data: presentProfiles } = await supabase
            .from('users')
            .select('id, team_id')
            .in('id', presentStudentIds)

        if (presentProfiles) {
            // Group present students by team
            const teamsPresent = new Map<string, string[]>()
            for (const p of presentProfiles) {
                if (!p.team_id) continue
                const existing = teamsPresent.get(p.team_id) || []
                teamsPresent.set(p.team_id, [...existing, p.id])
            }

            // For each team that has at least one member present, check if ALL members are present
            for (const [teamId, presentMembers] of teamsPresent.entries()) {
                const { data: allTeamMembers } = await supabase
                    .from('users')
                    .select('id')
                    .eq('team_id', teamId)
                    .eq('role', 'student')

                if (!allTeamMembers) continue
                const allIds = allTeamMembers.map(m => m.id)
                const allPresent = allIds.every(id => presentMembers.includes(id))

                if (allPresent && allIds.length > 0) {
                    // Check idempotency for team XP
                    const { data: existingTeamXp } = await supabase
                        .from('xp_logs')
                        .select('id')
                        .eq('team_id', teamId)
                        .eq('session_id', `attendance-team-${date}`)
                        .eq('category', 'attendance')
                        .maybeSingle()

                    if (!existingTeamXp) {
                        await supabase.from('xp_logs').insert({
                            user_id: null,
                            team_id: teamId,
                            category: 'attendance',
                            xp_value: 10,
                            reason: `Full team attendance — ${date}`,
                            session_id: `attendance-team-${date}`,
                        })
                    }
                }
            }
        }
    }

    revalidatePath('/admin/attendance')
    revalidatePath('/dashboard')
    revalidatePath('/achievements')
    return { success: true }
}

// ─── Games ────────────────────────────────────────────────────────────────────

export async function createGame(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const rawWord = (formData.get('target_word') as string || '').trim().toUpperCase()

    const { data, error } = await supabase.from('games').insert({
        title: formData.get('title') as string,
        game_type: 'wordle',
        target_word: rawWord,
        word_list: [rawWord],   // just store the target; validation uses real dictionary
        deadline: formData.get('deadline') as string || null,
        created_by: user.id,
    }).select().single()

    if (error) return { error: error.message }
    revalidatePath('/admin/games')
    return { success: true, game: data }
}

export async function submitGameResult(
    gameId: string,
    solved: boolean,
    guesses: string[],
    timeTakenSeconds: number
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('game_submissions').insert({
        game_id: gameId,
        user_id: user.id,
        solved,
        guesses,
        num_guesses: guesses.length,
        time_taken_seconds: timeTakenSeconds,
    })

    if (error) return { error: error.message }
    revalidatePath('/games')
    revalidatePath(`/games/${gameId}`)
    return { success: true }
}

export async function releaseGameResult(gameId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Mark result as released
    const { error } = await supabase
        .from('games')
        .update({ result_released: true })
        .eq('id', gameId)
    if (error) return { error: error.message }

    // Fetch all solved submissions sorted by submit time (fastest first)
    const { data: solvedSubs } = await supabase
        .from('game_submissions')
        .select('user_id, num_guesses, submitted_at')
        .eq('game_id', gameId)
        .eq('solved', true)
        .order('submitted_at', { ascending: true })

    if (solvedSubs && solvedSubs.length > 0) {
        const sessionPrefix = `game-${gameId}`
        const awardedUserIds = new Set<string>()

        // Award top 3 by submission time
        const xpMap: Record<number, number> = { 0: 20, 1: 10, 2: 5 }
        const placeLabel: Record<number, string> = { 0: '1st', 1: '2nd', 2: '3rd' }

        for (let i = 0; i < Math.min(3, solvedSubs.length); i++) {
            const sub = solvedSubs[i]
            awardedUserIds.add(sub.user_id)
            await supabase.from('xp_logs').insert({
                user_id: sub.user_id,
                team_id: null,
                category: 'game',
                xp_value: xpMap[i],
                reason: `Wordle Game — ${placeLabel[i]} place`,
                session_id: `${sessionPrefix}-place-${i + 1}`,
            })
        }

        // Fewest guesses award (5 XP) — pick from all solved, prefer non-top-3
        const sortedByGuesses = [...solvedSubs].sort((a, b) => a.num_guesses - b.num_guesses)
        const leastGuesser = sortedByGuesses.find(s => !awardedUserIds.has(s.user_id))
            || sortedByGuesses[0]

        if (leastGuesser) {
            // Check not already awarded (top-3 already get enough XP)
            if (!awardedUserIds.has(leastGuesser.user_id)) {
                await supabase.from('xp_logs').insert({
                    user_id: leastGuesser.user_id,
                    team_id: null,
                    category: 'game',
                    xp_value: 5,
                    reason: 'Wordle Game — Fewest guesses',
                    session_id: `${sessionPrefix}-least-guesser`,
                })
            } else {
                // Top-3 is also the least guesser — just log a bonus note (no extra XP to avoid double)
            }
        }
    }

    revalidatePath('/admin/games')
    revalidatePath(`/admin/games/${gameId}`)
    revalidatePath('/games')
    return { success: true }
}

export async function markNoClassDay(date: string, studentIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const rows = studentIds.map(id => ({
        student_id: id,
        date,
        status: 'no_class' as const,
        marked_by: user.id,
    }))

    const { error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'student_id,date' })
    if (error) return { error: error.message }

    await Promise.all(studentIds.map(id => recalculateStreak(supabase, id)))

    if (studentIds.length > 0) {
        await supabase
            .from('xp_logs')
            .delete()
            .in('user_id', studentIds)
            .eq('session_id', `attendance-${date}`)
            .eq('category', 'attendance')

        const { data: nonPresentProfiles } = await supabase
            .from('users')
            .select('team_id')
            .in('id', studentIds)
            .not('team_id', 'is', null)

        if (nonPresentProfiles && nonPresentProfiles.length > 0) {
            const teamIdsToRevoke = [...new Set(nonPresentProfiles.map(p => p.team_id))]
            if (teamIdsToRevoke.length > 0) {
                await supabase
                    .from('xp_logs')
                    .delete()
                    .in('team_id', teamIdsToRevoke)
                    .eq('session_id', `attendance-team-${date}`)
                    .eq('category', 'attendance')
            }
        }
    }

    revalidatePath('/admin/attendance')
    return { success: true }
}
