'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addXpToUser(userId: string, teamId: string | null, xpValue: number, reason: string, category: string) {
    const supabase = await createClient()

    // Insert XP log
    const { error } = await supabase.from('xp_logs').insert({
        user_id: userId || null,
        team_id: teamId || null,
        category,
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
    revalidatePath('/leaderboard')
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

    // If approved, log XP — DB triggers will auto-update user & team XP
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

export async function setWeeklyTitle(teamId: string, title: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('teams').update({ weekly_title: title }).eq('id', teamId)
    if (error) return { error: error.message }
    revalidatePath('/admin/weekly')
    revalidatePath('/team')
    return { success: true }
}

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
