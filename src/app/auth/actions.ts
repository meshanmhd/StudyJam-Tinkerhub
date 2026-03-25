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

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name }
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Failed to create user account' }
    }

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

    return { success: true, redirectTo: '/dashboard' }
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    // Check the email exists in our users table before sending a reset link
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (!existingUser) {
        return { error: 'No account found with this email address.' }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
