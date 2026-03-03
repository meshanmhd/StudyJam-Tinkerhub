import { createClient } from '@/utils/supabase/server'
import { WeeklyRitualClient } from './weekly-ritual-client'

export default async function WeeklyRitualPage() {
    const supabase = await createClient()

    const [teamsRes, studentsRes] = await Promise.all([
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('user_scores').select('*, user:users(id, weekly_highlight)').eq('role', 'student').order('final_score', { ascending: false }),
    ])

    // Filter out admins from user_scores
    const allStudents = studentsRes.data || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Weekly Ritual</h1>
                <p className="text-muted-foreground text-sm mt-1">Crown the team of the week and highlight individual students</p>
            </div>
            <WeeklyRitualClient
                teams={teamsRes.data || []}
                students={allStudents}
            />
        </div>
    )
}
