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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl glass cyber-border animate-pulse-cyber">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M4 14h20M14 4v20M6 6l16 16M22 6L6 22" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-gradient">Task</span>
            <span className="text-white/80">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-white/30 font-mono tracking-widest uppercase">
            productivity ecosystem
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="glass cyber-border rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Google */}
          <motion.button
            onClick={handleGoogle}
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-3 rounded-xl glass border border-white/10 py-2.5 text-sm font-medium text-white/70 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs text-white/20 font-mono">OR</span>
            <div className="h-px flex-1 bg-white/5" />
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
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/20 transition-all"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/20 transition-all"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-cyber-400/40 focus:ring-1 focus:ring-cyber-400/20 transition-all"
              required
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400/80"
              >
                {error}
              </motion.p>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full overflow-hidden rounded-xl bg-cyber-400 py-2.5 text-sm font-semibold text-dark-400 transition-all hover:bg-cyber-300 disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-dark-400/30 border-t-dark-400 animate-spin" />
                  Loading...
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-xs text-white/25">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-cyber-400/80 hover:text-cyber-400 transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center font-mono text-[10px] text-white/10 tracking-widest uppercase"
        >
          v1.0.0 — taskflow.app
        </motion.p>
      </div>
    </motion.div>
  );
}
