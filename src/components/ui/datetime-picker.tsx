'use client'

import { useState } from 'react'
import { ChevronDownIcon, CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
    name?: string
    id?: string
    defaultValue?: string // Format: YYYY-MM-DDTHH:mm
    className?: string
    required?: boolean
}

export function DateTimePicker({ name, id, defaultValue, className, required }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(
        defaultValue ? new Date(defaultValue) : undefined
    )
    const [time, setTime] = useState<string>(
        defaultValue && defaultValue.includes('T') ? defaultValue.split('T')[1].substring(0, 5) : '12:00'
    )

    // Compute the final hidden input value: YYYY-MM-DDTHH:mm
    // using local formatting to prevent timezone shifts when piecing them together
    const getFormattedDateContent = () => {
        if (!date) return ''
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${y}-${m}-${d}T${time}`
    }

    const finalValue = getFormattedDateContent()

    return (
        <div className={cn("flex flex-col sm:flex-row gap-2", className)}>
            {name && <input type="hidden" name={name} id={id} value={finalValue} required={required} />}

            <div className='flex flex-col gap-2 flex-1 min-w-0'>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant='outline'
                            className={cn(
                                "justify-between font-normal w-full h-11 bg-muted/5 border-border/30 hover:bg-muted/10 transition-all",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <CalendarIcon size={14} className="text-muted-foreground shrink-0" />
                                <span className="truncate">{date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}</span>
                            </div>
                            <ChevronDownIcon size={14} className="opacity-50 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto overflow-hidden p-0 border-border/10 shadow-xl' align='start'>
                        <Calendar
                            mode='single'
                            selected={date}
                            onSelect={d => {
                                setDate(d)
                                setOpen(false)
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className='flex flex-col gap-2 shrink-0 sm:w-[120px]'>
                <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        type='time'
                        step='60'
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className='pl-8 pr-2 h-11 bg-muted/5 border-border/30 transition-all appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none text-sm w-full'
                    />
                </div>
            </div>
        </div>
    )
}
