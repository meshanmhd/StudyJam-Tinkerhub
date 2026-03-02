import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role === 'admin') redirect('/admin')
        else redirect('/dashboard')
    }

    return (
        <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black text-white font-sans">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </main>
    )
}
