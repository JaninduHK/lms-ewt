import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  username: z.string().min(3, 'At least 3 characters').regex(/^[a-zA-Z0-9_.-]+$/, 'Only letters, numbers, _ . -'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'At least 8 characters'),
  passwordConfirm: z.string(),
  course: z.string().min(1, 'Please select a course'),
  whatsapp: z.string().min(7, 'Valid WhatsApp number required'),
  school: z.string().min(1, 'School required'),
  district: z.string().min(1, 'District required'),
}).refine((d) => d.password === d.passwordConfirm, {
  path: ['passwordConfirm'],
  message: 'Passwords do not match',
});

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [opts, setOpts] = useState({ courses: [], districts: [] });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { course: '', district: '' },
  });

  useEffect(() => {
    api.get('/auth/options').then(({ data }) => setOpts(data)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      const user = await registerUser(data);
      toast.success(`Welcome! Your Student ID is ${user.studentId}`, { duration: 5000 });
      navigate('/dashboard');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-5 bg-midnight-50">
      <div className="hidden lg:flex lg:col-span-2 flex-col justify-between p-12 bg-midnight-900 text-white relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold-500/10 blur-3xl" />
        <Link to="/" className="relative z-10 block">
          <p className="font-serif text-xl font-bold">Econ With <span className="text-gold-400">Thusitha</span></p>
          <p className="text-xs text-midnight-300 uppercase tracking-wider mt-1">Join the Programme</p>
        </Link>
        <div className="relative z-10">
          <h2 className="font-serif text-4xl xl:text-5xl font-bold leading-tight">
            Begin your A/L journey.
          </h2>
          <p className="mt-4 text-lg text-midnight-200 max-w-sm">
            Register once and receive your unique Student ID — used across payments,
            slip submissions and your personal class console.
          </p>
        </div>
        <p className="relative z-10 text-sm text-midnight-300">© Econ With Thusitha</p>
      </div>

      <div className="lg:col-span-3 p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto">
          <div className="lg:hidden mb-8">
            <Link to="/" className="font-serif text-2xl font-bold text-midnight-900">
              Econ With <span className="text-gold-600">Thusitha</span>
            </Link>
          </div>
          <h1 className="font-serif text-3xl font-bold text-midnight-900">Create your account</h1>
          <p className="text-midnight-500 mt-2">Fill the form below — you'll receive a unique Student ID (EC######).</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" {...register('firstName')} />
              {errors.firstName && <p className="text-rose-600 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" {...register('lastName')} />
              {errors.lastName && <p className="text-rose-600 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" {...register('username')} />
              {errors.username && <p className="text-rose-600 text-xs mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
              {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" {...register('password')} />
              {errors.password && <p className="text-rose-600 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" {...register('passwordConfirm')} />
              {errors.passwordConfirm && <p className="text-rose-600 text-xs mt-1">{errors.passwordConfirm.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">Select Course</label>
              <select className="input" {...register('course')}>
                <option value="">-- Please Select a Course --</option>
                {opts.courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.course && <p className="text-rose-600 text-xs mt-1">{errors.course.message}</p>}
            </div>
            <div>
              <label className="label">WhatsApp Number</label>
              <input className="input" placeholder="+9477XXXXXXX" {...register('whatsapp')} />
              {errors.whatsapp && <p className="text-rose-600 text-xs mt-1">{errors.whatsapp.message}</p>}
            </div>
            <div>
              <label className="label">School</label>
              <input className="input" {...register('school')} />
              {errors.school && <p className="text-rose-600 text-xs mt-1">{errors.school.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label">District</label>
              <select className="input" {...register('district')}>
                <option value="">-- Select District --</option>
                {opts.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.district && <p className="text-rose-600 text-xs mt-1">{errors.district.message}</p>}
            </div>

            <div className="sm:col-span-2 mt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
              </button>
              <p className="mt-4 text-sm text-midnight-600 text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-gold-700 font-medium hover:underline">Sign In</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
