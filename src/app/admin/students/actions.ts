'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// This creates an admin client with service_role bypassed RLS, specifically for auth ops
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

const getServiceRoleClient = () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return null; // Don't throw to prevent crashing if unconfigured, let caller handle
    }
    return createSupabaseAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}


export async function updateStudentProfile(userId: string, name: string, email: string, teamId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase.from('users').update({ name, email, team_id: teamId }).eq('id', userId)

    if (error) return { error: error.message }
    revalidatePath('/admin/students')
    revalidatePath('/admin/teams')
    return { success: true }
}

export async function assignXpToStudent(userId: string, amount: number, reason: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('users').select('team_id').eq('id', userId).single()

    const { error } = await supabase.from('xp_logs').insert({
        user_id: userId,
        team_id: profile?.team_id || null, // Optional, can log it to track team xp contextually, or leave null for manual
        category: 'manual',
        xp_value: amount,
        reason: reason
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/students')
    revalidatePath('/admin/xp')
    revalidatePath('/leaderboard')
    return { success: true }
}

export async function deleteXpLog(logId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Logic is now handled by DB triggers (update_user_individual_xp and update_team_xp)
    const { error } = await supabase.from('xp_logs').delete().eq('id', logId)
    if (error) return { error: error.message }

    revalidatePath('/admin/students')
    revalidatePath('/admin/xp')
    revalidatePath('/leaderboard')
    return { success: true }
}

export async function changeStudentPassword(userId: string, newPassword: string) {
    const adminAuthClient = getServiceRoleClient()
    if (!adminAuthClient) {
        return { error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY environment variable. Cannot update passwords.' }
    }

    const { error } = await adminAuthClient.auth.admin.updateUserById(userId, { password: newPassword })

    if (error) return { error: error.message }
    return { success: true }
}
