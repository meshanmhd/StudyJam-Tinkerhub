'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

export function RegisterForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)
        const result = await register(fd)
        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
        } else if (result?.success) {
            toast.success('Account created successfully!')
            router.push(result.redirectTo)
        }
    }

    return (
        <Card className="bg-black border-zinc-900 border text-white rounded-xl">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                <CardDescription className="text-zinc-400">
                    Enter your details below to join StudyJam
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-white font-medium">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            required
                            className="bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-white font-medium">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@gmail.com"
                            required
                            className="bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-white font-medium">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="bg-black border-zinc-800 text-white focus-visible:ring-1 focus-visible:ring-white rounded-lg px-4 h-10"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-zinc-200 mt-2 font-medium">
                        {loading ? 'Creating account…' : 'Sign Up'}
                    </Button>
                </form>
                <div className="text-center text-sm text-zinc-400 mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-white hover:underline underline-offset-4">
                        Log in
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
