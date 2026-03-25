'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

// By the time the user lands here, the auth/callback route has already
// exchanged the PKCE code for a valid session. We just need to update the password.
export function ResetPasswordForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [confirmError, setConfirmError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const password = fd.get('password') as string
        const confirm = fd.get('confirm_password') as string

        if (password !== confirm) {
            setConfirmError('Passwords do not match.')
            return
        }
        setConfirmError('')
        setLoading(true)

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Password updated successfully!')
            router.push('/login')
        }
    }

    return (
        <Card className="bg-black border-zinc-900 border text-white rounded-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription className="text-zinc-400">
                    Enter your new password below
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white font-medium">New Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password" className="text-white font-medium">Confirm New Password</Label>
                        <Input
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            onChange={() => setConfirmError('')}
                            className={`bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10 ${confirmError ? 'border-rose-500' : ''}`}
                        />
                        {confirmError && (
                            <p className="text-xs text-rose-400 mt-1">{confirmError}</p>
                        )}
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 mt-2 font-medium">
                        {loading ? 'Updating…' : 'Update Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
