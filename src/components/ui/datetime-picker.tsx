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
        <div className={cn("grid grid-cols-2 gap-3", className)}>
            {name && <input type="hidden" name={name} id={id} value={finalValue} required={required} />}

            <div className='flex flex-col gap-2'>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant='outline'
                            className={cn(
                                "justify-between font-normal w-full h-11 bg-[#111] border-[#222] hover:bg-[#1A1A1A] hover:border-zinc-700 transition-all text-sm",
                                !date ? "text-zinc-500" : "text-white"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <CalendarIcon size={14} className={date ? "text-zinc-400 shrink-0" : "text-zinc-500 shrink-0"} />
                                <span className="truncate">{date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pick date'}</span>
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto overflow-hidden p-0 border-[#1F1F1F] bg-[#0A0A0A] text-white shadow-xl' align='start'>
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

            <div className='flex flex-col gap-2'>
                <div 
                    className="relative w-full h-11 bg-[#111] border border-[#222] rounded-lg hover:bg-[#1A1A1A] hover:border-zinc-700 transition-all overflow-hidden flex items-center px-4 focus-within:ring-2 focus-within:ring-white/20 focus-within:border-white/20 cursor-pointer"
                    onClick={() => {
                        const input = document.getElementById(id ? `${id}-time` : 'time-picker') as HTMLInputElement
                        if (input && 'showPicker' in input) {
                            try { input.showPicker() } catch (e) {}
                        }
                    }}
                >
                    <Clock size={14} className="text-zinc-500 shrink-0 mr-2" />
                    <Input
                        id={id ? `${id}-time` : 'time-picker'}
                        type='time'
                        step='60'
                        value={time}
                        required={required}
                        onChange={(e) => setTime(e.target.value)}
                        onClick={(e) => {
                            if ('showPicker' in e.currentTarget) {
                                try { e.currentTarget.showPicker() } catch (err) {}
                            }
                        }}
                        className='bg-transparent border-0 h-full w-full p-0 text-white text-sm focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer'
                    />
                </div>
            </div>
        </div>
    )
}
