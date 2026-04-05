import { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn, signUp } from '../lib/auth-client';
import { useNavigate } from 'react-router-dom';
import { pageVariants } from '../hooks/usePageTransition';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const { error } = await signIn.email({ email, password });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await signUp.email({ email, password, name });
        if (error) throw new Error(error.message);
      }
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex min-h-screen items-center justify-center p-4"
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-accent">Task</span>
            <span className="text-txt-primary">Flow</span>
          </h1>
          <p className="mt-1.5 text-sm text-txt-muted">
            Your workspace, simplified.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-xl bg-surface p-6 space-y-4 border border-white/[0.06]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-surface-hover border border-white/[0.06] py-2.5 text-sm font-medium text-txt-secondary hover:text-txt-primary hover:bg-surface-elevated transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-txt-muted">or</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                type="text"
                placeholder="Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg bg-base border border-white/[0.06] px-3.5 py-2.5 text-sm text-txt-primary placeholder-txt-muted outline-none focus:border-accent/40 transition-colors"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg bg-base border border-white/[0.06] px-3.5 py-2.5 text-sm text-txt-primary placeholder-txt-muted outline-none focus:border-accent/40 transition-colors"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg bg-base border border-white/[0.06] px-3.5 py-2.5 text-sm text-txt-primary placeholder-txt-muted outline-none focus:border-accent/40 transition-colors"
              required
            />
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400"
              >
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Loading...
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-txt-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
