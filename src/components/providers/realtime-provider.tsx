'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to changes across key tables
        const scoresSubscription = supabase
            .channel('public:user_scores')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_scores' }, () => {
                router.refresh()
            })
            .subscribe()

        const teamsSubscription = supabase
            .channel('public:teams')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
                router.refresh()
            })
            .subscribe()

        const tasksSubscription = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                router.refresh()
            })
            .subscribe()

        const subSubscription = supabase
            .channel('public:task_submissions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'task_submissions' }, () => {
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(scoresSubscription)
            supabase.removeChannel(teamsSubscription)
            supabase.removeChannel(tasksSubscription)
            supabase.removeChannel(subSubscription)
        }
    }, [router, supabase])

    return <>{children}</>
}
