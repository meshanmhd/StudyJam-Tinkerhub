import { createClient } from '@/utils/supabase/server'
import { WeeklyRitualClient } from './weekly-ritual-client'

export default async function WeeklyRitualPage() {
    const supabase = await createClient()
    const [teamsRes, studentsRes] = await Promise.all([
        supabase.from('teams').select('*').order('team_xp', { ascending: false }),
        supabase.from('user_scores').select('*').order('individual_xp', { ascending: false }).limit(10),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">🎉 Weekly Ritual</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Crown the top team and celebrate individual highlights
                </p>
            </div>
            <WeeklyRitualClient
                teams={teamsRes.data || []}
                topStudents={studentsRes.data || []}
            />
        </div>
    )
}
