import React from 'react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

import {
  readDevBootstrapState,
  signInWithDevBootstrap,
} from '../services/skygemsApi';

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const bootstrapState = useMemo(() => readDevBootstrapState(), []);
  const [username, setUsername] = useState(bootstrapState.username);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signInWithDevBootstrap({ username, password });
      const destination =
        typeof location.state?.from === 'string' && location.state.from.startsWith('/app')
          ? location.state.from
          : '/app';
      navigate(destination, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-white">
      <div className="relative min-h-screen">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.06),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-6 py-10 lg:py-16">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                GemStudio
              </p>
              <p className="text-[10px] text-muted-foreground">Personal design workspace</p>
            </div>
          </Link>

          {/* Main content — centered card layout */}
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Secure workspace login</span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold leading-tight text-foreground lg:text-4xl">
              Sign in to your
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> workspace</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your account scopes all projects, generations, and saved designs. Sign in to load your gallery and design history.
            </p>
          </div>

          {/* Sign-in card */}
          <div className="mx-auto mt-8 w-full max-w-sm">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="username">
                    Email or Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                    required
                  />
                </div>

                {errorMessage ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                  {!isSubmitting ? <ArrowRight className="w-4 h-4" /> : null}
                </button>
              </form>

              <p className="mt-4 text-[11px] leading-4 text-muted-foreground">
                Fixture accounts: <span className="font-medium text-foreground">gemsdev / gemsdev123</span> or <span className="font-medium text-foreground">acegems / acegems123</span>
              </p>
            </div>
          </div>

          {/* Feature cards */}
          <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {[
              ['User-scoped gallery', 'Only your saved designs load by default.'],
              ['Project restore', 'Previous work comes back after auth.'],
              ['Same UI system', 'GemStudio design stays intact.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-border bg-white/80 px-4 py-3 text-center shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
