import { createClient } from '@/utils/supabase/server'
import { TeamManagerClient } from './team-manager-client'

export default async function TeamsPage() {
    const supabase = await createClient()

    const [studentsRes, teamsRes] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, individual_xp, team_id, team:teams(id, team_name)')
            .eq('role', 'student')
            .order('name'),
        supabase.from('teams').select('id, team_name, team_xp').order('team_name'),
    ])

    const students = (studentsRes.data || []).map((s: any) => ({
        ...s,
        team: Array.isArray(s.team) ? s.team[0] || null : s.team || null,
    }))
    const teams = teamsRes.data || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Team Management</h1>
                <p className="text-muted-foreground text-sm mt-1">Create teams and manage team memberships</p>
            </div>
            <TeamManagerClient students={students} teams={teams} />
        </div>
    )
}
