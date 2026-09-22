'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { signIn, signUp } from '@/lib/auth-client'

function GoogleMark() {
  return <svg aria-hidden="true" className="google-mark" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"/><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.48-4.03H3.27v2.53A9.74 9.74 0 0 0 12 21.75Z"/><path fill="#FBBC05" d="M6.52 13.84A5.86 5.86 0 0 1 6.21 12c0-.64.11-1.26.31-1.84V7.63H3.27A9.74 9.74 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.37l3.25-2.53Z"/><path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.24 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.73 5.38l3.25 2.53c.78-2.31 2.94-4.03 5.48-4.03Z"/></svg>
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [googlePending, setGooglePending] = useState(false)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (isSignUp && !name.trim()) { setError('Please enter your full name.'); return }
    if (isSignUp && password !== confirmPassword) { setError('Passwords do not match.'); return }
    setPending(true)
    try {
      const result = isSignUp
        ? await signUp.email({ name: name.trim(), email: email.trim(), password })
        : await signIn.email({ email: email.trim(), password })
      setPending(false)
      if (result.error) { setError(isSignUp ? 'Unable to create the account. Check your details or use a different email.' : 'Incorrect email or password. Please try again.'); return }
    } catch {
      setPending(false)
      setError('Authentication is temporarily unavailable. Please try again.')
      return
    }
    router.push('/officer')
    router.refresh()
  }

  async function continueWithGoogle() {
    setError('')
    setGooglePending(true)
    try {
      const result = await signIn.social({ provider: 'google', callbackURL: '/officer' })
      if (result.error) { setGooglePending(false); setError('Google sign-in was not completed. Please try again.') }
    } catch {
      setGooglePending(false)
      setError('Google sign-in is temporarily unavailable. Please try again.')
    }
  }

  return <main className="auth-page"><div className="auth-card"><Link href="/" className="auth-brand"><span><ShieldCheck size={20} /></span><strong>NETRA</strong><small>SECURE INVESTIGATION PLATFORM</small></Link><div className="auth-heading"><p className="portal-eyebrow">Officer access</p><h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1><p>{isSignUp ? 'Set up secure access to the investigation workspace.' : 'Sign in to continue to your investigation workspace.'}</p></div><form onSubmit={submit} className="auth-form">{isSignUp && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>{isSignUp && <label>Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></label>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="portal-primary auth-submit" disabled={pending || googlePending}>{pending ? 'Authenticating…' : isSignUp ? 'Create account' : 'Sign in'}</button></form><div className="auth-divider"><span>or</span></div><button type="button" className="auth-google" onClick={continueWithGoogle} disabled={pending || googlePending}><GoogleMark /><span>{googlePending ? 'Connecting…' : 'Continue with Google'}</span></button><p className="auth-switch">{isSignUp ? 'Already have an account?' : 'Need an account?'} <Link href={isSignUp ? '/sign-in' : '/sign-up'}>{isSignUp ? 'Sign in' : 'Create one'}</Link></p></div></main>
}
