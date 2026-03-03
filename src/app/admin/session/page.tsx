import { createClient } from '@/utils/supabase/server'
import { SessionModeClient } from './session-mode-client'

export default async function SessionModePage() {
    const supabase = await createClient()

    const [studentsRes, teamsRes, logsRes] = await Promise.all([
        supabase.from('users').select('id, name, team_id').eq('role', 'student').order('name'),
        supabase.from('teams').select('id, team_name'),
        supabase.from('xp_logs').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Session Mode</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Quickly award XP during live study sessions
                </p>
            </div>
            <SessionModeClient
                students={studentsRes.data || []}
                teams={teamsRes.data || []}
                recentLogs={logsRes.data || []}
            />
        </div>
    )
}
