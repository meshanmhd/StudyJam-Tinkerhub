'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Level } from '@/types'

export async function updateStudyJamLevel(id: string, updates: Partial<Level>) {
    const supabase = await createClient()

    // basic validation
    if (updates.title && updates.title.trim().length === 0) {
        return { error: 'Title cannot be empty' }
    }

    const dbUpdates = {
        title: updates.title,
        min_impact: updates.minImpact,
        max_impact: updates.maxImpact === undefined ? null : updates.maxImpact
    }

    // Explicitly remove undefined
    const cleanUpdates = Object.fromEntries(
        Object.entries(dbUpdates).filter(([_, v]) => v !== undefined)
    )

    const { error } = await supabase
        .from('study_jam_levels')
        .update(cleanUpdates)
        .eq('id', id)

    if (error) {
        console.error('Error updating level:', error)
        return { error: 'Failed to update level' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function createStudyJamLevel(level: number, title: string, minImpact: number, maxImpact: number | null) {
    const supabase = await createClient()

    if (!title.trim()) {
        return { error: 'Title cannot be empty' }
    }

    const { error } = await supabase
        .from('study_jam_levels')
        .insert({
            level,
            title,
            min_impact: minImpact,
            max_impact: maxImpact
        })

    if (error) {
        console.error('Error creating level:', error)
        return { error: 'Failed to create level' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function deleteStudyJamLevel(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('study_jam_levels')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting level:', error)
        return { error: 'Failed to delete level' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
