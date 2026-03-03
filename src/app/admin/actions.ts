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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase.from('tasks').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        xp_reward: parseInt(formData.get('xp_reward') as string),
        deadline: formData.get('deadline') as string || null,
        created_by: user.id,
    }).select().single()

    if (error) return { error: error.message }
    revalidatePath('/admin/tasks')
    revalidatePath('/dashboard')
    return { success: true, task: data }
}

export async function reviewSubmission(submissionId: string, action: 'approved' | 'rejected', xpGiven: number, taskId: string, userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const updates: Record<string, unknown> = {
        status: action,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
    }
    if (action === 'approved') updates.xp_given = xpGiven

    const { error } = await supabase.from('task_submissions').update(updates).eq('id', submissionId)
    if (error) return { error: error.message }

    if (action === 'approved') {
        const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).single()
        const { data: userProfile } = await supabase.from('users').select('team_id').eq('id', userId).single()

        await supabase.from('xp_logs').insert({
            user_id: userId,
            team_id: userProfile?.team_id || null,
            category: 'task',
            xp_value: xpGiven,
            reason: `Task approved: ${task?.title || taskId}`,
        })
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    revalidatePath('/team')
    return { success: true }
}

// ─── Weekly ───────────────────────────────────────────────────────────────────

export async function setWeeklyTitle(teamId: string, title: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('teams').update({ weekly_title: title }).eq('id', teamId)
    if (error) return { error: error.message }
    revalidatePath('/admin/weekly')
    revalidatePath('/team')
    revalidatePath('/achievements')
    return { success: true }
}

export async function setStudentWeeklyHighlight(userId: string, highlight: string | null) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('users')
        .update({ weekly_highlight: highlight })
        .eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin/weekly')
    revalidatePath('/achievements')
    revalidatePath('/dashboard')
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

async function recalculateStreak(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string) {
    const today = new Date().toISOString().split('T')[0]
    const { data: records } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentId)
        .lte('date', today)
        .order('date', { ascending: false })

    if (!records) return

    let streak = 0
    let longest = 0
    let current = 0

    for (const r of records) {
        if (r.status === 'no_class') continue
        if (r.status === 'present') { streak++ } else { break }
    }

    for (const r of [...records].reverse()) {
        if (r.status === 'no_class') continue
        if (r.status === 'present') { current++; if (current > longest) longest = current }
        else { current = 0 }
    }

    await supabase
        .from('users')
        .update({ streak_days: streak, longest_streak: Math.max(longest, streak) })
        .eq('id', studentId)
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

    // Recalculate streaks in parallel
    await Promise.all(
        records
            .filter(r => r.status !== 'no_class')
            .map(r => recalculateStreak(supabase, r.studentId))
    )

    revalidatePath('/admin/attendance')
    revalidatePath('/dashboard')
    revalidatePath('/achievements')
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

    // No streak recalculation needed — no_class doesn't affect streak

    revalidatePath('/admin/attendance')
    return { success: true }
}
