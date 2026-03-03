'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
    const router = useRouter()
    const [refreshing, setRefreshing] = useState(false)

    function handleRefresh() {
        setRefreshing(true)
        router.refresh()
        // Give a brief visual feedback then reset
        setTimeout(() => setRefreshing(false), 800)
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 text-xs h-8"
        >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
        </Button>
    )
}
