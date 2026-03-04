import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') redirect('/dashboard')

    return (
        <div className="min-h-svh bg-background">
            <Sidebar role="admin" userName={profile.name} userEmail={profile.email} />
            <main className="lg:pl-64 min-h-svh">
                <div className="p-4 lg:p-6 max-w-6xl mx-auto pt-16 lg:pt-6 pb-24 lg:pb-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
