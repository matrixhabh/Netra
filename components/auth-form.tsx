'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { signIn, signUp } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const result = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password })
    setPending(false)
    if (result.error) { setError('Unable to authenticate with those details. Please try again.'); return }
    router.push('/officer')
    router.refresh()
  }

  return <main className="auth-page"><div className="auth-card"><div className="auth-brand"><span><ShieldCheck size={20} /></span><strong>NETRA</strong><small>SECURE INVESTIGATION PLATFORM</small></div><div className="auth-heading"><p className="portal-eyebrow">Officer access</p><h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1><p>{isSignUp ? 'Set up secure access to the investigation workspace.' : 'Sign in to continue to your investigation workspace.'}</p></div><form onSubmit={submit} className="auth-form">{isSignUp && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>{error && <p className="auth-error" role="alert">{error}</p>}<button className="portal-primary auth-submit" disabled={pending}>{pending ? 'Authenticating…' : isSignUp ? 'Create account' : 'Sign in'}</button></form><p className="auth-switch">{isSignUp ? 'Already have an account?' : 'Need an account?'} <Link href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Create one'}</Link></p></div></main>
}
