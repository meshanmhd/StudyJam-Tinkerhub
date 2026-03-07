import { createClient } from '@/utils/supabase/server'
import { TaskManagerClient } from './task-manager-client'

export default async function TaskManagerPage() {
    const supabase = await createClient()

    // Fetch Tasks with their submissions
    const { data: tasks } = await supabase.from('tasks').select('*, submissions:task_submissions(status)').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <TaskManagerClient tasks={tasks || []} />
        </div>
    )
}
