'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Level } from '@/types'
import { getStudyJamLevels } from '@/app/actions'
import { updateStudyJamLevel, createStudyJamLevel, deleteStudyJamLevel } from './actions'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Loader2, Settings, ListOrdered } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

export default function StudyJamSettingsPage() {
    const [levels, setLevels] = useState<Level[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Add Level Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [newLevel, setNewLevel] = useState({
        level: 1,
        title: '',
        minImpact: 0,
        maxImpact: '' as string | number
    })

    useEffect(() => {
        loadLevels()
    }, [])

    async function loadLevels() {
        try {
            const data = await getStudyJamLevels()
            // Sort levels sequentially
            setLevels(data.sort((a, b) => a.level - b.level))
            setHasChanges(false)
        } catch (error) {
            toast.error('Failed to load study jam levels')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLevelChange = (levelValue: number, field: keyof Level, value: string | number | null) => {
        setLevels(prev => prev.map(l => {
            if (l.level === levelValue) {
                return { ...l, [field]: value }
            }
            return l
        }))
        setHasChanges(true)
    }

    const handleSaveAll = async () => {
        setIsSaving(true)
        try {
            // Update all levels sequentially
            for (const level of levels) {
                if (level.id) {
                    const res = await updateStudyJamLevel(level.id, {
                        title: level.title,
                        minImpact: Number(level.minImpact),
                        maxImpact: level.maxImpact ? Number(level.maxImpact) : null
                    })
                    if (res.error) throw new Error(`Failed to update Level ${level.level}: ${res.error}`)
                }
            }
            toast.success('All levels saved successfully')
            setHasChanges(false)
            await loadLevels()
        } catch (error: any) {
            toast.error(error.message || 'Failed to save levels')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (level: Level) => {
        if (!confirm(`Are you sure you want to delete Level ${level.level}: ${level.title}?`)) return
        try {
            if (level.id) {
                const res = await deleteStudyJamLevel(level.id)
                if (res.error) throw new Error(res.error)
            }
            toast.success(`Level ${level.level} deleted`)
            setLevels(prev => prev.filter(l => l.level !== level.level))
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete level')
        }
    }

    const handleOpenAddDialog = () => {
        const nextLevelNum = levels.length > 0 ? Math.max(...levels.map(l => l.level)) + 1 : 1
        const minImpactSuggestion = levels.length > 0 ? (levels[levels.length - 1]?.maxImpact || 0) + 1 : 0
        setNewLevel({
            level: nextLevelNum,
            title: '',
            minImpact: minImpactSuggestion,
            maxImpact: ''
        })
        setIsAddOpen(true)
    }

    const handleAddNewLevel = async () => {
        if (!newLevel.title.trim()) return toast.error('Level title is required')

        // Validation: Existing Level
        if (levels.some(l => l.level === newLevel.level)) {
            return toast.error(`Level ${newLevel.level} already exists`)
        }

        // Validation: Sequence Order
        const sorted = [...levels].sort((a, b) => a.level - b.level)
        const prevLevel = sorted.reverse().find(l => l.level < newLevel.level)

        if (prevLevel) {
            if (prevLevel.maxImpact === null || prevLevel.maxImpact === undefined) {
                return toast.error(`Level ${prevLevel.level} has no max impact limit`)
            }
            if (Number(newLevel.minImpact) <= prevLevel.maxImpact) {
                return toast.error(`Min impact must start after Level ${prevLevel.level} max impact (${prevLevel.maxImpact})`)
            }
        }

        setIsAdding(true)
        try {
            const res = await createStudyJamLevel(
                newLevel.level,
                newLevel.title.trim(),
                Number(newLevel.minImpact),
                newLevel.maxImpact ? Number(newLevel.maxImpact) : null
            )
            if (res.error) throw new Error(res.error)
            toast.success(`Level ${newLevel.level} created successfully`)
            setIsAddOpen(false)
            await loadLevels()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create level')
        } finally {
            setIsAdding(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Configure platform parameters and settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

                {/* Settings Sidebar / Navigation (for future scale) */}
                <div className="glass rounded-2xl p-4 border border-border/20 sticky top-6">
                    <nav className="space-y-1">
                        <button className="flex items-center gap-3 w-full px-3 py-2 bg-primary/10 text-primary font-medium rounded-xl text-sm transition-colors">
                            <ListOrdered size={16} />
                            Study Jam Levels
                        </button>
                        <button disabled className="flex items-center gap-3 w-full px-3 py-2 text-muted-foreground/50 font-medium rounded-xl text-sm justify-start opacity-70 cursor-not-allowed">
                            <Settings size={16} />
                            General Settings
                        </button>
                    </nav>
                </div>

                {/* Main Settings Area */}
                <div className="md:col-span-3 space-y-6">
                    {/* Levels Section */}
                    <div className="glass rounded-2xl border border-border/20 overflow-hidden">
                        <div className="px-6 py-5 border-b border-border/10 flex items-center justify-between bg-muted/5">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Study Jam Levels</h2>
                                <p className="text-xs text-muted-foreground mt-1">Define progression tiers based on impact score points.</p>
                            </div>
                            <Button onClick={handleOpenAddDialog} size="sm" className="gap-2 shrink-0">
                                <Plus size={14} /> Add new level
                            </Button>
                        </div>

                        <div className="p-6">
                            {levels.length === 0 ? (
                                <div className="text-center py-10 bg-muted/5 rounded-xl border border-dashed border-border/30">
                                    <p className="text-sm text-muted-foreground">No levels configured yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/10">
                                        <div className="col-span-1">Lv</div>
                                        <div className="col-span-4">Title</div>
                                        <div className="col-span-3">Min Impact</div>
                                        <div className="col-span-3">Max Impact</div>
                                        <div className="col-span-1 text-right">Action</div>
                                    </div>

                                    <div className="space-y-3">
                                        {levels.map((level) => (
                                            <div key={level.id || level.level} className="grid grid-cols-12 gap-4 items-center px-2 py-1 group">
                                                <div className="col-span-1 font-bold text-sm bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center">
                                                    {level.level}
                                                </div>
                                                <div className="col-span-4">
                                                    <Input
                                                        value={level.title}
                                                        onChange={(e) => handleLevelChange(level.level, 'title', e.target.value)}
                                                        className="h-9 bg-muted/20 border-border/30 focus-visible:ring-1"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={level.minImpact}
                                                        onChange={(e) => handleLevelChange(level.level, 'minImpact', parseInt(e.target.value))}
                                                        className="h-9 bg-muted/20 border-border/30 focus-visible:ring-1"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={level.maxImpact === null ? '' : level.maxImpact}
                                                        placeholder="Unlimited"
                                                        onChange={(e) => {
                                                            const val = e.target.value
                                                            handleLevelChange(level.level, 'maxImpact', val === '' ? null : parseInt(val))
                                                        }}
                                                        className="h-9 bg-muted/20 border-border/30 focus-visible:ring-1"
                                                    />
                                                </div>
                                                <div className="col-span-1 text-right opacity-40 group-hover:opacity-100 transition-opacity flex justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(level)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Save Section Action Bar */}
                        <div className="px-6 py-4 border-t border-border/10 bg-muted/5 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                {hasChanges ? 'You have unsaved changes.' : 'Everything is up to date.'}
                            </p>
                            <Button
                                onClick={handleSaveAll}
                                disabled={!hasChanges || isSaving}
                                className="gap-2 min-w-[120px]"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Level Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-[#1F1F1F] text-foreground">
                    <DialogHeader>
                        <DialogTitle>Add New Level</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs uppercase tracking-wider text-muted-foreground">Level</Label>
                            <Input
                                type="number"
                                value={newLevel.level}
                                onChange={(e) => setNewLevel({ ...newLevel, level: parseInt(e.target.value) })}
                                className="col-span-3 bg-muted/20 border-border/30"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
                            <Input
                                value={newLevel.title}
                                placeholder="e.g. Master"
                                onChange={(e) => setNewLevel({ ...newLevel, title: e.target.value })}
                                className="col-span-3 bg-muted/20 border-border/30"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs uppercase tracking-wider text-muted-foreground">Min XP</Label>
                            <Input
                                type="number"
                                value={newLevel.minImpact}
                                onChange={(e) => setNewLevel({ ...newLevel, minImpact: parseInt(e.target.value) })}
                                className="col-span-3 bg-muted/20 border-border/30"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right text-xs uppercase tracking-wider text-muted-foreground pt-3">Max XP</Label>
                            <div className="col-span-3 space-y-1.5">
                                <Input
                                    type="number"
                                    value={newLevel.maxImpact}
                                    onChange={(e) => setNewLevel({ ...newLevel, maxImpact: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    placeholder="Leave blank for unlimited"
                                    className="bg-muted/20 border-border/30"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddNewLevel} disabled={isAdding} className="gap-2">
                            {isAdding ? <Loader2 size={14} className="animate-spin" /> : null}
                            Add to Database
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
