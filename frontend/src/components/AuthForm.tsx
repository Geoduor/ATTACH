'use client';

import { useState } from 'react';

export function AuthForm({
  mode,
  demoMode,
}: {
  mode: 'login' | 'signup';
  demoMode: boolean;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const payload =
      mode === 'signup'
        ? { action: 'signup', email, password, fullName }
        : { action: 'login', email, password };

    try {
      const res = await fetch('/auth/handler', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
      if (body.needsConfirmation) {
        setNotice('Check your email to confirm your account, then sign in.');
        setBusy(false);
        return;
      }

      window.location.href = body.redirect ?? '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  if (demoMode) {
    return (
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-slate-900">Demo mode</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          No Supabase credentials are configured, so there is no real signup. This button
          creates a fully working demo session with in-memory data so you can try every
          feature. It resets when you restart the dev server.
        </p>
        <form action="/auth/demo" method="post" className="mt-6">
          <button type="submit" className="btn-primary w-full">
            Continue as demo student
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Want real accounts? Create a Supabase project, add the two{' '}
          <code className="text-[11px]">NEXT_PUBLIC_SUPABASE_*</code> variables to{' '}
          <code className="text-[11px]">.env.local</code>, and reload.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8">
      <h1 className="text-2xl font-bold text-slate-900">
        {mode === 'signup' ? 'Create your account' : 'Sign in'}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {mode === 'signup'
          ? 'Then add your course and skills to start getting scored matches.'
          : 'Welcome back.'}
      </p>

      {error ? (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="mt-6 space-y-5">
        {mode === 'signup' ? (
          <div>
            <label htmlFor="full_name" className="label">
              Full name
            </label>
            <input
              id="full_name"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              This is the name recruiters see on your cover letters.
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
          {mode === 'signup' ? (
            <p className="mt-1 text-xs text-slate-400">
              At least 8 characters.
            </p>
          ) : null}
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn-primary mt-7 w-full">
        {busy
          ? 'Please wait…'
          : mode === 'signup'
            ? 'Create account'
            : 'Sign in'}
      </button>

      <p className="mt-5 text-center text-sm text-slate-500">
        {mode === 'signup' ? 'Already have an account? ' : 'No account yet? '}
        <a
          href={mode === 'signup' ? '/auth/login' : '/auth/signup'}
          className="font-semibold text-brand-700 hover:underline"
        >
          {mode === 'signup' ? 'Sign in' : 'Create one'}
        </a>
      </p>
    </form>
  );
}