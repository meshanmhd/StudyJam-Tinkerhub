import { createClient } from '@/utils/supabase/server'
import { TaskManagerClient } from './task-manager-client'

export default async function TaskManagerPage() {
    const supabase = await createClient()
    const [tasksRes, submissionsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase
            .from('task_submissions')
            .select('*, task:tasks(title, xp_reward), user:users(name, team:teams(team_name))')
            .order('submitted_at', { ascending: false }),
    ])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">📋 Task Manager</h1>
                <p className="text-muted-foreground text-sm mt-1">Create tasks and review student submissions</p>
            </div>
            <TaskManagerClient
                tasks={tasksRes.data || []}
                submissions={submissionsRes.data || []}
            />
        </div>
    )
}
