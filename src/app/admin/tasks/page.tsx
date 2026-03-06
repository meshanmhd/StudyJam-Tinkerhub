import { createClient } from '@/utils/supabase/server'
import { TaskManagerClient } from './task-manager-client'

export default async function TaskManagerPage() {
    const supabase = await createClient()

    // Fetch Tasks with their submissions
    const { data: tasks } = await supabase.from('tasks').select('*, submissions:task_submissions(status)').order('created_at', { ascending: false })

    // Fetch Global Stats for the Dashboard Cards
    const [usersRes, pendingRes, tasksRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student'),
        supabase.from('task_submissions').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('tasks').select('id', { count: 'exact' }).gte('deadline', new Date().toISOString()),
    ])

    const stats = {
        totalStudents: usersRes.count || 0,
        pendingReviews: pendingRes.count || 0,
        activeTasks: tasksRes.count || 0
    }

    return (
        <div className="space-y-6">
            <TaskManagerClient tasks={tasks || []} stats={stats} />
        </div>
    )
}
