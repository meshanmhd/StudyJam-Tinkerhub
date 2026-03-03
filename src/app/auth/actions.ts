'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        return { error: error.message }
    }

    // Get user profile to determine role-based redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Authentication failed' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'admin') {
        return { success: true, redirectTo: '/admin' }
    } else {
        return { success: true, redirectTo: '/dashboard' }
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function register(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Sign up user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            }
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user account' }
    }

    // 2. Upsert into public.users table (upsert handles the case where a
    //    database trigger may have already created a row with an email-derived name)
    const { error: dbError } = await supabase
        .from('users')
        .upsert({
            id: authData.user.id,
            name,
            email,
            role: 'student',
        }, { onConflict: 'id' })

    if (dbError) {
        console.error('Failed to create public user record:', dbError)
        return { error: 'Failed to complete registration profile' }
    }

    // With email confirmation disabled, the user is already logged in after signUp
    return { success: true, redirectTo: '/dashboard' }
}
