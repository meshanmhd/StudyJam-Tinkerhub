'use client'

import { useState } from 'react'
import { forgotPassword } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)
        const result = await forgotPassword(fd)
        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        } else {
            setSent(true)
            setLoading(false)
        }
    }

    return (
        <Card className="bg-black border-zinc-900 border text-white rounded-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                <CardDescription className="text-zinc-400">
                    Enter your email and we&apos;ll send you a reset link
                </CardDescription>
            </CardHeader>
            <CardContent>
                {sent ? (
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <CheckCircle size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Check your email</p>
                            <p className="text-xs text-zinc-400 mt-1">
                                A password reset link has been sent to your inbox.
                            </p>
                        </div>
                        <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors mt-2">
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@gmail.com"
                                required
                                className="bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10"
                            />
                        </div>
                        <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 mt-2 font-medium">
                            {loading ? 'Sending…' : 'Send Reset Link'}
                        </Button>
                        <div className="text-center text-sm text-zinc-400">
                            <Link href="/login" className="text-white hover:underline underline-offset-4">
                                Back to login
                            </Link>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
