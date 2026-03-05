import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('id', user.id)
        .single()

    if (!profile) redirect('/login')

    return (
        <div className="min-h-svh bg-background w-full overflow-x-hidden">
            <Sidebar role={profile.role} userName={profile.name} userEmail={profile.email} />
            <main className="lg:pl-64 min-h-svh w-full overflow-x-hidden">
                <div className="p-4 lg:p-6 max-w-6xl mx-auto pt-16 lg:pt-6 pb-24 lg:pb-6 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
