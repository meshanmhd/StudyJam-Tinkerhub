import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { StudentsClient } from '@/app/admin/students/students-client'
import type { DBStudent, DBXPLog } from '@/app/admin/students/students-client'

export const dynamic = 'force-dynamic'

export default async function AdminStudentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin') redirect('/dashboard')

    const { data: students, error: studentsError } = await supabase
        .from('users')
        .select(`
            id,
            name,
            email,
            role,
            individual_xp,
            streak_days,
            longest_streak,
            last_activity_date,
            team_id,
            team:teams(id, team_name)
        `)
        .eq('role', 'student')
        .order('name')

    if (studentsError) {
        console.error('Error fetching students:', studentsError)
        return <div className="p-6 text-red-500">Failed to load students</div>
    }

    // Fetch total impact for students
    // Assuming impact is related to tasks/submissions or just xp. In the previous reference, total impact was a float.
    // If there is no specific total_impact column, we could derive it or just show 0 for now.
    // Based on database schema fetched implicitly, let's pass down students and fetch their XP logs.
    const { data: xpLogs } = await supabase
        .from('xp_logs')
        .select('*')
        .order('created_at', { ascending: false })

    // Fetch scores from the view
    const { data: userScores } = await supabase.from('user_scores').select('*')

    const { data: teams } = await supabase.from('teams').select('id, team_name').order('team_name')

    const formattedStudents: DBStudent[] = (students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        individual_xp: s.individual_xp,
        streak_days: s.streak_days,
        longest_streak: s.longest_streak,
        last_activity_date: s.last_activity_date,
        team_id: s.team_id,
        team: Array.isArray(s.team) ? s.team[0] || null : s.team || null,
    }))

    return (
        <StudentsClient
            students={formattedStudents}
            xpLogs={(xpLogs as any) || []}
            teams={(teams as any) || []}
            userScores={(userScores as any) || []}
        />
    )
}
