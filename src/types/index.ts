export type UserRole = 'admin' | 'student'

export type XpCategory = 'task' | 'attendance' | 'presentation' | 'help' | 'other'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export type BadgeType = 'weekly' | 'permanent'

export type WeeklyRole = 'Lead' | 'Builder' | 'Debugger' | 'Tester' | 'Presenter'

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
    minXp: number
    maxXp: number | null
}

export const LEVELS: Level[] = [
    { level: 1, title: 'Explorer', minXp: 0, maxXp: 99 },
    { level: 2, title: 'Builder', minXp: 100, maxXp: 199 },
    { level: 3, title: 'Creator', minXp: 200, maxXp: 349 },
    { level: 4, title: 'Architect', minXp: 350, maxXp: 499 },
    { level: 5, title: 'Lab Legend', minXp: 500, maxXp: null },
]

export function getUserLevel(xp: number): Level {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].minXp) return LEVELS[i]
    }
    return LEVELS[0]
}

export function getLevelProgress(xp: number): number {
    const level = getUserLevel(xp)
    if (!level.maxXp) return 100 // Max level
    const range = level.maxXp - level.minXp + 1
    const progress = xp - level.minXp
    return Math.min(100, Math.round((progress / range) * 100))
}

export function getNextLevel(xp: number): Level | null {
    const current = getUserLevel(xp)
    const next = LEVELS.find(l => l.level === current.level + 1)
    return next || null
}
