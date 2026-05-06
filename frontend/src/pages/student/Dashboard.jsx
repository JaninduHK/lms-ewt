import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, FileDown, Sparkles, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import { formatLKR } from '../../utils/format';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await api.get('/enrollments/my')).data,
  });
  const { data: pay } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => (await api.get('/payments/my')).data,
  });

  const enrollments = data?.enrollments || [];
  const activeSubs = enrollments.filter(e => e.classId?.type === 'subscription').length;
  const totalMaterials = enrollments.reduce((s, e) => s + (e.classId?.materials?.length || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-midnight-900 to-midnight-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-luxury"
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gold-500/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs mb-4">
            <Sparkles size={12} className="text-gold-400" />
            <span className="text-midnight-100">Student ID</span>
            <span className="font-mono text-gold-400">{user?.studentId}</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            Welcome back, {user?.firstName}.
          </h1>
          <p className="mt-2 text-midnight-200 max-w-xl">
            Your A/L Economics console — classes, recordings, materials and live sessions in one place.
          </p>
          {user?.course && (
            <div className="mt-5">
              <span className="badge bg-gold-500 text-midnight-900 font-semibold">
                Enrolled course: {user.course}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Classes Enrolled" value={enrollments.length} icon={BookOpen} accent="navy" />
        <StatCard label="Active Subscriptions" value={activeSubs} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Materials Available" value={totalMaterials} icon={FileDown} accent="gold" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-midnight-900">My Enrollments</h2>
            <Link to="/enrollments" className="text-sm text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-midnight-500">You haven't enrolled in any class yet.</p>
              <Link to="/classes" className="btn-gold mt-4">Browse Classes</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.slice(0, 4).map(e => (
                <Link
                  key={e._id}
                  to={`/classes/${e.classId?._id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-midnight-50 transition border border-transparent hover:border-midnight-100"
                >
                  <div className="w-10 h-10 rounded-lg bg-midnight-900 flex items-center justify-center text-gold-400">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-midnight-900 truncate">{e.classId?.title}</p>
                    <p className="text-xs text-midnight-500">{e.classId?.type === 'subscription' ? 'Subscription' : 'One-Time'} · {formatLKR(e.classId?.price, e.classId?.currency)}</p>
                  </div>
                  <ArrowRight size={16} className="text-midnight-400" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-midnight-900">Recent Payments</h2>
            <Link to="/payments" className="text-sm text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {!pay ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : pay.payments.length === 0 ? (
            <p className="text-center py-8 text-midnight-500">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {pay.payments.slice(0, 4).map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border border-midnight-100">
                  <div className="min-w-0">
                    <p className="font-medium text-midnight-900 truncate">{p.classId?.title}</p>
                    <p className="text-xs text-midnight-500">{format(new Date(p.createdAt), 'PPP')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-midnight-900">{formatLKR(p.amount, p.currency)}</p>
                    <span className={
                      p.status === 'approved' ? 'badge-emerald'
                      : p.status === 'rejected' ? 'badge-rose'
                      : 'badge-amber'
                    }>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
