import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const dashHref = user?.role === 'teacher' ? '/teacher/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-midnight-900 text-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-midnight-700/40 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="group">
            <p className="font-serif text-xl sm:text-2xl font-bold leading-none">
              Econ With <span className="text-gold-400">Thusitha</span>
            </p>
          </Link>

          <nav className="hidden sm:flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link to={dashHref} className="btn-gold">
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium text-white/90 hover:text-white hover:bg-white/5 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold bg-gold-500 text-midnight-900 hover:bg-gold-400 transition shadow-gold-glow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-16 sm:pt-24 lg:pt-32 pb-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
            >
              <Sparkles size={14} className="text-gold-400" />
              <span className="text-xs sm:text-sm text-midnight-100">
                Live classes · Recordings · Past papers · Revision packs
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            >
              Master A/L Economics<br />
              with <span className="text-gold-400 italic">precision</span> &amp; <span className="text-gold-400 italic">clarity</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6 text-lg sm:text-xl text-midnight-200 max-w-2xl leading-relaxed"
            >
              Structured theory and revision programmes guided by Thusitha Liyanage —
              with weekly Zoom sessions, downloadable notes, and full past-paper coverage,
              all in one premium learning console built for serious A/L students.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              {user ? (
                <Link to={dashHref} className="btn-gold text-base px-7 py-3.5">
                  Go to Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-gold text-base px-7 py-3.5">
                    Create Your Account <ArrowRight size={18} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg font-medium text-white border border-white/15 hover:bg-white/5 transition"
                  >
                    I already have an account
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-14 flex items-center gap-8 text-sm text-midnight-300"
            >
              <div>
                <p className="text-2xl font-serif font-bold text-white">2025–2027</p>
                <p>Theory &amp; Revision streams</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-serif font-bold text-white">Live + Recorded</p>
                <p>Learn at your own pace</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
