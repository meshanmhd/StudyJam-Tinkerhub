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

    // Update individual XP on users table
    if (userId) {
        const { error: userErr } = await supabase.rpc('increment_user_xp', {
            p_user_id: userId,
            p_xp: xpValue,
        })
        if (userErr) {
            // Fallback: manual update if RPC doesn't exist
            const { data: curr } = await supabase.from('users').select('individual_xp').eq('id', userId).single()
            if (curr) {
                await supabase.from('users').update({ individual_xp: (curr.individual_xp || 0) + xpValue }).eq('id', userId)
            }
        }
    }

    // Update team XP on teams table
    if (teamId) {
        const { error: teamErr } = await supabase.rpc('increment_team_xp', {
            p_team_id: teamId,
            p_xp: xpValue,
        })
        if (teamErr) {
            // Fallback: manual update if RPC doesn't exist
            const { data: curr } = await supabase.from('teams').select('team_xp').eq('id', teamId).single()
            if (curr) {
                await supabase.from('teams').update({ team_xp: (curr.team_xp || 0) + xpValue }).eq('id', teamId)
            }
        }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/xp')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
    return { success: true }
}

export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('tasks').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        xp_reward: parseInt(formData.get('xp_reward') as string),
        deadline: formData.get('deadline') as string || null,
        created_by: user.id,
    })
    if (error) return { error: error.message }
    revalidatePath('/admin/tasks')
    return { success: true }
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

    // Log XP and update user's individual_xp if approved
    if (action === 'approved') {
        const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).single()
        await supabase.from('xp_logs').insert({
            user_id: userId,
            category: 'task',
            xp_value: xpGiven,
            reason: `Task approved: ${task?.title || taskId}`,
        })

        // Update the student's individual_xp in the users table
        const { data: curr } = await supabase.from('users').select('individual_xp').eq('id', userId).single()
        if (curr) {
            await supabase.from('users').update({ individual_xp: (curr.individual_xp || 0) + xpGiven }).eq('id', userId)
        }

        // Also update team XP if the user is on a team
        const { data: userProfile } = await supabase.from('users').select('team_id').eq('id', userId).single()
        if (userProfile?.team_id) {
            const { data: team } = await supabase.from('teams').select('team_xp').eq('id', userProfile.team_id).single()
            if (team) {
                await supabase.from('teams').update({ team_xp: (team.team_xp || 0) + xpGiven }).eq('id', userProfile.team_id)
            }
        }
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/dashboard')
    revalidatePath('/leaderboard')
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
