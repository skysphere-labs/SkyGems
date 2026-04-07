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
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden px-8 py-10 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_42%)]" />
          <div className="relative flex h-full flex-col">
            <Link to="/" className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  GemStudio
                </p>
                <p className="text-xs text-muted-foreground">Personal design workspace</p>
              </div>
            </Link>

            <div className="mt-16 max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Sign in to load only your design history</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold leading-tight text-foreground">
                  Continue to your
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> jewelry workspace</span>
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
                  Your account determines which projects, generations, and saved designs are loaded from the backend.
                  Sign in first, then the app will scope the gallery and design history to your account.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  ['User-scoped gallery', 'Only your saved design records load by default.'],
                  ['Project restore', 'Your previous work comes back as soon as auth completes.'],
                  ['Same UI system', 'The current GemStudio design stays intact after login.'],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center border-l border-border bg-[#fafafe] px-8 py-10 lg:px-12">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-600">Welcome back</p>
              <h2 className="text-2xl font-semibold text-foreground">Sign in with your email</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                For local development this uses the existing SkyGems bootstrap auth path and restores your scoped workspace.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="gemsdev"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  required
                />
              </div>

              <div className="space-y-2">
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
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
                  required
                />
              </div>

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting ? <ArrowRight className="w-4 h-4" /> : null}
              </button>
            </form>

            <p className="mt-6 text-xs leading-5 text-muted-foreground">
              Local test accounts: <span className="font-medium text-foreground">gemsdev / gemsdev123</span> and <span className="font-medium text-foreground">acegems / acegems123</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
