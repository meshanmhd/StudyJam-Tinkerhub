import { createClient } from '@/utils/supabase/server'
import { BadgeManagerClient } from './badge-manager-client'

export default async function BadgesPage() {
    const supabase = await createClient()

    const [studentsRes, badgesRes, userBadgesRes] = await Promise.all([
        supabase.from('users').select('id, name').eq('role', 'student').order('name'),
        supabase.from('badges').select('*').order('name'),
        supabase.from('user_badges').select('*, badge:badges(*)').order('awarded_at', { ascending: false }),
    ])

    const students = studentsRes.data || []
    const badges = badgesRes.data || []
    const userBadges = userBadgesRes.data || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Badge Manager</h1>
                <p className="text-muted-foreground text-sm mt-1">Create badges and assign them to students</p>
            </div>
            <BadgeManagerClient
                students={students}
                badges={badges}
                userBadges={userBadges}
            />
        </div>
    )
}
