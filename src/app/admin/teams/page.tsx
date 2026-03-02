import { createClient } from '@/utils/supabase/server'
import { TeamAssignClient } from './team-assign-client'

export default async function TeamAssignPage() {
    const supabase = await createClient()

    const [studentsRes, teamsRes] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, individual_xp, team_id, team:teams(id, team_name)')
            .eq('role', 'student')
            .order('name'),
        supabase.from('teams').select('id, team_name, team_xp').order('team_name'),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">👥 Team Assignment</h1>
                <p className="text-muted-foreground text-sm mt-1">Assign students to teams and manage group memberships</p>
            </div>
            <TeamAssignClient
                students={studentsRes.data || []}
                teams={teamsRes.data || []}
            />
        </div>
    )
}
