import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { RegisterForm } from './register-form'
import Image from 'next/image'

export default async function RegisterPage() {
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
        <main className="flex min-h-screen w-full font-sans bg-black">
            {/* Left side mock/branding */}
            <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-zinc-950 border-r border-zinc-900">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-black z-0 pointer-events-none" />

                <div className="z-10 w-full max-w-[90%] px-6 relative">
                    <Image
                        src="/mockup.png"
                        alt="StudyJam Dashboard Mockup"
                        width={1200}
                        height={900}
                        className="w-full h-auto drop-shadow-2xl rounded-xl object-contain"
                        priority
                    />
                </div>

                {/* Decorative abstract elements */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Right side form */}
            <div className="flex-1 flex items-center justify-center p-5 lg:p-10 relative">
                <div className="w-full max-w-[380px] relative z-10">
                    <RegisterForm />
                </div>
            </div>
        </main>
    )
}
