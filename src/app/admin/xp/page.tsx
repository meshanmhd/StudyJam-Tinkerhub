import { createClient } from '@/utils/supabase/server'
import { XpManagerClient } from './xp-manager-client'

export default async function XpManagerPage() {
    const supabase = await createClient()
    const [studentsRes, teamsRes, logsRes] = await Promise.all([
        supabase.from('users').select('id, name, individual_xp, team_id').eq('role', 'student').order('name'),
        supabase.from('teams').select('id, team_name, team_xp'),
        supabase.from('xp_logs').select('*, user:users(name), team:teams(team_name)').order('created_at', { ascending: false }).limit(50),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">⚡ XP Manager</h1>
                <p className="text-muted-foreground text-sm mt-1">Manually add XP and view the full XP audit log</p>
            </div>
            <XpManagerClient
                students={studentsRes.data || []}
                teams={teamsRes.data || []}
                logs={logsRes.data || []}
            />
        </div>
    )
}
