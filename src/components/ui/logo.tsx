import * as React from 'react'

export function Logo({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="2" y="2" width="12" height="4" rx="1" fill="currentColor" />
            <rect x="18" y="2" width="4" height="4" rx="1" fill="currentColor" />
            <rect x="2" y="10" width="20" height="4" rx="1" fill="currentColor" />
            <rect x="2" y="18" width="7" height="4" rx="1" fill="currentColor" />
            <rect x="13" y="18" width="4" height="4" rx="1" fill="currentColor" />
            <rect x="18" y="18" width="4" height="4" rx="1" fill="currentColor" />
        </svg>
    )
}
