'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { markAttendanceBulk, markNoClassDay } from '../actions'
import { cn } from '@/lib/utils'
import { ClipboardList, CalendarOff, Loader2, Flame } from 'lucide-react'

type AttendanceStatus = 'present' | 'absent' | 'no_class' | null

interface Student { id: string; name: string; streak_days: number }
interface AttendanceRecord { student_id: string; date: string; status: string }

interface AttendanceClientProps {
    students: Student[]
    attendanceRecords: AttendanceRecord[]
    daysInMonth: number
    year: number
    month: number
}

const STATUS_COLORS: Record<string, string> = {
    present: 'bg-emerald-500/80 border-emerald-500',
    absent: 'bg-red-500/80 border-red-500',
    no_class: 'bg-blue-500/80 border-blue-500',
}

const STATUS_LABELS: Record<string, string> = {
    present: 'P',
    absent: 'A',
    no_class: '—',
}

function buildDateStr(year: number, month: number, day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDateDisplay(dateStr: string) {
    const [y, m, d] = dateStr.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('default', {
        weekday: 'short', day: 'numeric', month: 'short'
    })
}

export function AttendanceClient({
    students,
    attendanceRecords,
    daysInMonth,
    year,
    month,
}: AttendanceClientProps) {
    const router = useRouter()

    // Build status map from server data
    const serverMap: Record<string, AttendanceStatus> = {}
    for (const r of attendanceRecords) {
        serverMap[`${r.student_id}_${r.date}`] = r.status as AttendanceStatus
    }

    const [displayMap, setDisplayMap] = useState<Record<string, AttendanceStatus>>(serverMap)

    // ── Mark Attendance Dialog ──
    const [markOpen, setMarkOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState(() => {
        const t = new Date()
        return buildDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate())
    })
    // checklist: studentId → present (true) | absent (false)
    const [presentMap, setPresentMap] = useState<Record<string, boolean>>({})
    const [saving, setSaving] = useState(false)

    // ── No Class Dialog ──
    const [noClassOpen, setNoClassOpen] = useState(false)
    const [noClassDate, setNoClassDate] = useState(selectedDate)
    const [noClassSaving, setNoClassSaving] = useState(false)

    // Month-specific available day strings for the date select
    const today = new Date()
    const todayStr = buildDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())
    const dayOptions = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1
        const dateStr = buildDateStr(year, month, day)
        return { dateStr, label: formatDateDisplay(dateStr) }
    }).filter(d => d.dateStr <= todayStr)

    function openMarkDialog() {
        // Pre-populate: present by default, or existing status if any
        const init: Record<string, boolean> = {}
        for (const s of students) {
            const existing = displayMap[`${s.id}_${selectedDate}`]
            init[s.id] = existing !== 'absent' // present (or no_class→treat as present tick)
        }
        setPresentMap(init)
        setSearchQuery('')
        setMarkOpen(true)
    }

    function handleDateChange(date: string) {
        setSelectedDate(date)
        const init: Record<string, boolean> = {}
        for (const s of students) {
            const existing = displayMap[`${s.id}_${date}`]
            // if no record yet → default present; if absent → unchecked; else → checked
            init[s.id] = existing !== 'absent'
        }
        setPresentMap(init)
    }

    async function handleSaveAttendance() {
        setSaving(true)
        const records = students.map(s => ({
            studentId: s.id,
            status: (presentMap[s.id] ? 'present' : 'absent') as 'present' | 'absent' | 'no_class'
        }))
        const result = await markAttendanceBulk(selectedDate, records)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`Attendance saved for ${formatDateDisplay(selectedDate)}`)
            // Optimistic update to display map
            const updated = { ...displayMap }
            for (const r of records) {
                updated[`${r.studentId}_${selectedDate}`] = r.status as AttendanceStatus
            }
            setDisplayMap(updated)
            setMarkOpen(false)
            router.refresh()
        }
        setSaving(false)
    }

    async function handleNoClassDay() {
        setNoClassSaving(true)
        const result = await markNoClassDay(noClassDate, students.map(s => s.id))
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`No Class marked for ${formatDateDisplay(noClassDate)}`)
            const updated = { ...displayMap }
            for (const s of students) {
                updated[`${s.id}_${noClassDate}`] = 'no_class'
            }
            setDisplayMap(updated)
            setNoClassOpen(false)
            router.refresh()
        }
        setNoClassSaving(false)
    }

    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year
    const todayDay = today.getDate()

    const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className="space-y-5">
            {/* Action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-4 h-4 rounded-sm bg-emerald-500/80 inline-block" /> Present
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-4 h-4 rounded-sm bg-red-500/80 inline-block" /> Absent
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-4 h-4 rounded-sm bg-blue-500/80 inline-block" /> No Class
                    </span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-4 h-4 rounded-sm bg-muted/30 border border-border/40 inline-block" /> Unmarked
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setNoClassOpen(true)}
                        className="gap-2 text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                    >
                        <CalendarOff size={14} />
                        No Class Day
                    </Button>
                    <Button
                        size="sm"
                        onClick={openMarkDialog}
                        className="gap-2"
                    >
                        <ClipboardList size={14} />
                        Mark Attendance
                    </Button>
                </div>
            </div>

            {/* View-only grid */}
            <div className="rounded-xl border border-border/40 overflow-x-auto bg-card/60 relative">
                <table className="w-full min-w-[max-content] text-sm text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border/30 bg-muted/20">
                            <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[140px] max-w-[180px] shadow-[1px_0_0_0_rgba(255,255,255,0.1)]">Student</th>
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                                <th
                                    key={day}
                                    className={cn(
                                        'text-center px-0.5 py-3 text-[11px] font-medium text-muted-foreground w-7',
                                        isCurrentMonth && day === todayDay && 'text-primary font-bold'
                                    )}
                                >
                                    {day}
                                </th>
                            ))}
                            <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground w-16">Streak</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {students.map(student => (
                            <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                <td className="sticky left-0 z-10 bg-card px-4 py-2.5 shadow-[1px_0_0_0_rgba(255,255,255,0.1)] truncate max-w-[180px]">
                                    <p className="text-sm font-medium truncate">{student.name}</p>
                                </td>
                                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                    const dateStr = buildDateStr(year, month, day)
                                    const status = displayMap[`${student.id}_${dateStr}`] ?? null
                                    const isFuture = isCurrentMonth && day > todayDay

                                    return (
                                        <td key={day} className="px-0.5 py-2 text-center">
                                            <div
                                                className={cn(
                                                    'w-6 h-6 rounded-sm text-[9px] font-bold border flex items-center justify-center mx-auto',
                                                    status
                                                        ? STATUS_COLORS[status] + ' text-white'
                                                        : 'bg-muted/20 border-border/20 text-muted-foreground/30',
                                                    isFuture && 'opacity-20'
                                                )}
                                                title={status ? status.replace('_', ' ') : 'Unmarked'}
                                            >
                                                {status ? STATUS_LABELS[status] : ''}
                                            </div>
                                        </td>
                                    )
                                })}
                                <td className="px-3 py-2 text-center">
                                    {student.streak_days > 0 ? (
                                        <div className="inline-flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded text-orange-400">
                                            <Flame size={12} />
                                            <span className="text-xs font-bold">{student.streak_days}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">0</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={daysInMonth + 2} className="text-center py-12 text-muted-foreground text-sm">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Mark Attendance Dialog ── */}
            <Dialog open={markOpen} onOpenChange={setMarkOpen}>
                <DialogContent className="max-w-md bg-card border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Mark Attendance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        {/* Date selector */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                            <Select value={selectedDate} onValueChange={handleDateChange}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                    {dayOptions.map(({ dateStr, label }) => (
                                        <SelectItem key={dateStr} value={dateStr}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Student checklist */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Students</Label>
                                <div className="flex gap-2">
                                    <button
                                        className="text-[11px] text-primary hover:underline"
                                        onClick={() => {
                                            const all: Record<string, boolean> = {}
                                            students.forEach(s => { all[s.id] = true })
                                            setPresentMap(all)
                                        }}
                                    >All Present</button>
                                    <span className="text-muted-foreground/40">·</span>
                                    <button
                                        className="text-[11px] text-muted-foreground hover:underline"
                                        onClick={() => {
                                            const all: Record<string, boolean> = {}
                                            students.forEach(s => { all[s.id] = false })
                                            setPresentMap(all)
                                        }}
                                    >All Absent</button>
                                </div>
                            </div>
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <div className="max-h-72 overflow-y-auto rounded-lg border border-border/40 divide-y divide-border/20">
                                {filteredStudents.map(student => {
                                    const isPresent = presentMap[student.id] !== false
                                    return (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors"
                                        >
                                            <div
                                                className={cn(
                                                    'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                                                    isPresent
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-border/60 bg-transparent'
                                                )}
                                            >
                                                {isPresent && (
                                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={isPresent}
                                                onChange={() => setPresentMap(prev => ({ ...prev, [student.id]: !isPresent }))}
                                            />
                                            <span className="text-sm flex-1">{student.name}</span>
                                            <span className={cn(
                                                'text-[11px] font-medium px-2 py-0.5 rounded-full',
                                                isPresent
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-red-500/15 text-red-400'
                                            )}>
                                                {isPresent ? 'Present' : 'Absent'}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {Object.values(presentMap).filter(Boolean).length} present · {Object.values(presentMap).filter(v => !v).length} absent
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMarkOpen(false)}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveAttendance} disabled={saving} className="min-w-24">
                            {saving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Save Attendance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── No Class Day Dialog ── */}
            <Dialog open={noClassOpen} onOpenChange={setNoClassOpen}>
                <DialogContent className="max-w-sm bg-card border border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">Mark No Class Day</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <p className="text-sm text-muted-foreground">
                            This will mark all students as <span className="text-blue-400 font-medium">No Class</span> for the selected date. Their streaks will not be affected.
                        </p>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                            <Select value={noClassDate} onValueChange={setNoClassDate}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border">
                                    {dayOptions.map(({ dateStr, label }) => (
                                        <SelectItem key={dateStr} value={dateStr}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setNoClassOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            onClick={handleNoClassDay}
                            disabled={noClassSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-28"
                        >
                            {noClassSaving ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
                            Mark No Class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
