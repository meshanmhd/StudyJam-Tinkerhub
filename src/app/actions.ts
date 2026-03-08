'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Level } from '@/types'

export async function getStudyJamLevels(): Promise<Level[]> {
    const supabase = await createClient()
    const { data } = await supabase.from('study_jam_levels').select('*').order('level', { ascending: true })
    if (!data) return []
    return data.map(dbLevel => ({
        id: dbLevel.id,
        level: dbLevel.level,
        title: dbLevel.title,
        minImpact: dbLevel.min_impact,
        maxImpact: dbLevel.max_impact,
    }))
}

export async function updateProfileName(newName: string) {
    if (!newName || newName.trim().length < 2) {
        return { error: 'Name must be at least 2 characters long' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('users')
        .update({ name: newName.trim() })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating name:', error)
        return { error: 'Failed to update name' }
    }

    // Also update Supabase Auth User Metadata to ensure it persists over logins
    const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName.trim(), name: newName.trim() }
    })

    if (authError) {
        console.error('Error updating auth metadata:', authError)
    }

    revalidatePath('/', 'layout')
    revalidatePath('/dashboard', 'page')
    return { success: true }
}
