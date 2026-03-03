export type UserRole = 'admin' | 'student'

export type XpCategory = 'task' | 'attendance' | 'presentation' | 'help' | 'other'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type BadgeType = 'weekly' | 'permanent'

export type WeeklyRole = 'Lead' | 'Builder' | 'Debugger' | 'Tester' | 'Presenter'

export type AttendanceStatus = 'present' | 'absent' | 'no_class'

export interface Attendance {
    id: string
    student_id: string
    date: string
    status: AttendanceStatus
    marked_by?: string
    created_at: string
}

export interface Team {
    id: string
    team_name: string
    team_xp: number
    weekly_title?: string
    created_at: string
}

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    team_id?: string
    individual_xp: number
    streak_days: number
    longest_streak: number
    last_activity_date?: string
    streak_state: 'active' | 'frozen' | 'reset'
    created_at: string
    team?: Team
}

export interface UserScore {
    user_id: string
    name: string
    role: UserRole
    team_id?: string
    team_name?: string
    individual_xp: number
    team_xp: number
    final_score: number
}

export interface XpLog {
    id: string
    user_id?: string
    team_id?: string
    category: XpCategory
    xp_value: number
    reason?: string
    session_id?: string
    created_at: string
    user?: { name: string }
    team?: { team_name: string }
}

export interface Task {
    id: string
    title: string
    description?: string
    xp_reward: number
    task_type: 'individual' | 'team'
    deadline?: string
    created_by?: string
    created_at: string
}

export interface TaskSubmission {
    id: string
    task_id: string
    user_id: string
    submitted_at: string
    status: SubmissionStatus
    approved_by?: string
    approved_at?: string
    xp_given?: number
    task?: Task
    user?: { name: string; team?: { team_name: string } }
}

export interface Badge {
    id: string
    name: string
    description?: string
    icon?: string
    type: BadgeType
}

export interface UserBadge {
    id: string
    user_id: string
    badge_id: string
    awarded_at: string
    badge?: Badge
}

export interface Level {
    level: number
    title: string
    minImpact: number
    maxImpact: number | null
}

// Impact score thresholds (impact = 0.6 × team_xp + 0.4 × individual_xp)
// Adjusted to reflect real-world combined score ranges
export const LEVELS: Level[] = [
    { level: 1, title: 'Explorer', minImpact: 0, maxImpact: 149 },
    { level: 2, title: 'Builder', minImpact: 150, maxImpact: 349 },
    { level: 3, title: 'Creator', minImpact: 350, maxImpact: 599 },
    { level: 4, title: 'Architect', minImpact: 600, maxImpact: 899 },
    { level: 5, title: 'Lab Legend', minImpact: 900, maxImpact: null },
]

export function getUserLevel(impact: number): Level {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (impact >= LEVELS[i].minImpact) return LEVELS[i]
    }
    return LEVELS[0]
}

export function getLevelProgress(impact: number): number {
    const level = getUserLevel(impact)
    if (!level.maxImpact) return 100 // Max level
    const range = level.maxImpact - level.minImpact + 1
    const progress = impact - level.minImpact
    return Math.min(100, Math.round((progress / range) * 100))
}

export function getNextLevel(impact: number): Level | null {
    const current = getUserLevel(impact)
    const next = LEVELS.find(l => l.level === current.level + 1)
    return next || null
}
