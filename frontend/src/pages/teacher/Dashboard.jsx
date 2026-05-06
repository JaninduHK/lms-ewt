import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Wallet, Hourglass, Plus, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import { formatLKR } from '../../utils/format';

export default function TeacherDashboard() {
  const { data: classes } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const { data: students } = useQuery({
    queryKey: ['t-students-overview'],
    queryFn: async () => (await api.get('/students?limit=1')).data,
  });
  const { data: payments } = useQuery({
    queryKey: ['t-payments-overview'],
    queryFn: async () => (await api.get('/payments?limit=5')).data,
  });

  const loading = !classes || !students || !payments;
  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        subtitle="A snapshot of your classes, students and revenue."
        actions={
          <Link to="/teacher/classes" className="btn-gold"><Plus size={16} /> New Class</Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={students.pagination.total} icon={Users} accent="navy" />
        <StatCard label="Total Classes" value={classes.classes.length} icon={BookOpen} accent="gold" />
        <StatCard label="Pending Payments" value={payments.stats.pendingCount} icon={Hourglass} accent="rose" />
        <StatCard label="Revenue This Month" value={formatLKR(payments.stats.revenueThisMonth)} icon={Wallet} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-midnight-900">Recent Payments</h2>
            <Link to="/teacher/payments" className="text-sm text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {payments.payments.length === 0 ? (
            <p className="text-center py-8 text-midnight-500">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {payments.payments.slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-lg border border-midnight-100">
                  <div className="min-w-0">
                    <p className="font-medium text-midnight-900 truncate">
                      {p.studentId?.firstName} {p.studentId?.lastName}
                      <span className="ml-2 text-xs font-mono text-midnight-500">{p.studentId?.studentId}</span>
                    </p>
                    <p className="text-xs text-midnight-500 truncate">{p.classId?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatLKR(p.amount, p.currency)}</p>
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl font-bold text-midnight-900">Your Classes</h2>
            <Link to="/teacher/classes" className="text-sm text-gold-700 font-medium hover:underline inline-flex items-center gap-1">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {classes.classes.length === 0 ? (
            <p className="text-center py-8 text-midnight-500">No classes created yet.</p>
          ) : (
            <div className="space-y-2">
              {classes.classes.slice(0, 5).map(c => (
                <Link
                  key={c._id}
                  to={`/teacher/classes/${c._id}/edit`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100 hover:border-gold-500 transition"
                >
                  <div className="w-10 h-10 rounded-lg bg-midnight-900 flex items-center justify-center text-gold-400">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-midnight-900 truncate">{c.title}</p>
                    <p className="text-xs text-midnight-500">
                      {c.enrollmentCount} enrolled · {c.isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatLKR(c.price, c.currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
