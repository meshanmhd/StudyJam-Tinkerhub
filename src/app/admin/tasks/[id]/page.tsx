import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { TaskDetailClient } from './task-detail-client'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: task } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

    if (!task) {
        notFound()
    }

    const { data: submissions } = await supabase
        .from('task_submissions')
        .select('*, user:users(name, team:teams(team_name))')
        .eq('task_id', id)
        .order('submitted_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <Link href="/admin/tasks" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-4 transition-colors">
                    <ChevronLeft size={14} /> Back to Tasks
                </Link>
            </div>
            <TaskDetailClient task={task} submissions={submissions || []} />
        </div>
    )
}
