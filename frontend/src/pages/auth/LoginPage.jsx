import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  identifier: z.string().min(3, 'Enter your email or username'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const user = await login(data.identifier, data.password);
      toast.success('Welcome back!');
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-midnight-900 text-white relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold-500/10 blur-3xl" />
        <Link to="/" className="relative z-10 block">
          <p className="font-serif text-xl font-bold">Econ With <span className="text-gold-400">Thusitha</span></p>
          <p className="text-xs text-midnight-300 uppercase tracking-wider mt-1">Premium Tuition Console</p>
        </Link>
        <div className="relative z-10">
          <h2 className="font-serif text-4xl xl:text-5xl font-bold leading-tight">
            Welcome back, scholar.
          </h2>
          <p className="mt-4 text-lg text-midnight-200 max-w-md">
            Pick up where you left off — your classes, materials and live sessions are waiting.
          </p>
        </div>
        <p className="relative z-10 text-sm text-midnight-300">© Econ With Thusitha</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-midnight-50">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <Link to="/" className="font-serif text-2xl font-bold text-midnight-900">
              Econ With <span className="text-gold-600">Thusitha</span>
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-bold text-midnight-900">Sign In</h1>
          <p className="text-midnight-500 mt-2">Welcome back. Enter your credentials below.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="label">Email or Username</label>
              <input className="input" autoComplete="username" {...register('identifier')} />
              {errors.identifier && <p className="text-rose-600 text-xs mt-1">{errors.identifier.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-rose-600 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-sm text-midnight-600 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold-700 font-medium hover:underline">Register here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
