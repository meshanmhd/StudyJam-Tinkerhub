import { createClient } from '@/utils/supabase/server'
import { TeamManagerClient } from './team-manager-client'

export default async function TeamsPage() {
    const supabase = await createClient()

    const [studentsRes, teamsRes, xpLogsRes] = await Promise.all([
        supabase
            .from('users')
            .select('id, name, email, individual_xp, team_id, team:teams(id, team_name)')
            .eq('role', 'student')
            .order('name'),
        supabase.from('teams').select('id, team_name, team_xp').order('team_name'),
        supabase.from('xp_logs').select(`
            id,
            xp_value,
            reason,
            created_at,
            category,
            team_id,
            user_id
        `).not('team_id', 'is', null).order('created_at', { ascending: false }),
    ])

    type DBStudent = {
        id: string;
        name: string;
        email: string;
        individual_xp: number;
        team_id: string | null;
        team: { id: string; team_name: string } | { id: string; team_name: string }[] | null;
    }

    const students = (studentsRes.data || []).map((s: DBStudent) => ({
        ...s,
        team: Array.isArray(s.team) ? s.team[0] || null : s.team || null,
    }))
    const teams = teamsRes.data || []
    const teamXpLogs = xpLogsRes.data || []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Team Management</h1>
                <p className="text-muted-foreground text-sm mt-1">Create teams and manage team memberships</p>
            </div>
            <TeamManagerClient students={students} teams={teams} teamXpLogs={teamXpLogs} />
        </div>
    )
}
