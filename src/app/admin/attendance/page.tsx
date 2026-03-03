import { createClient } from '@/utils/supabase/server'
import { AttendanceClient } from './attendance-client'

export default async function AttendancePage() {
    const supabase = await createClient()

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from('users').select('id, name, streak_days').eq('role', 'student').order('name'),
        supabase
            .from('attendance')
            .select('student_id, date, status')
            .gte('date', firstDay)
            .lte('date', lastDay),
    ])

    const students = studentsRes.data || []
    const attendance = attendanceRes.data || []
    const daysInMonth = new Date(year, month, 0).getDate()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Attendance</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })} · {students.length} students
                </p>
            </div>
            <AttendanceClient
                students={students}
                attendanceRecords={attendance}
                daysInMonth={daysInMonth}
                year={year}
                month={month}
            />
        </div>
    )
}
