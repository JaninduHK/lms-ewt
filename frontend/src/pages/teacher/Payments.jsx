import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, X, Image as ImageIcon, Hourglass, Wallet, TrendingUp, Layers } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import { formatLKR, monthName } from '../../utils/format';

export default function TeacherPayments() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all', paymentType: 'all', classId: '', month: '', year: '', search: '',
  });
  const [page, setPage] = useState(1);
  const [slipUrl, setSlipUrl] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data: classes } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const params = new URLSearchParams({
    ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '' && v !== 'all')),
    page, limit: 20,
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['t-payments', filters, page],
    queryFn: async () => (await api.get(`/payments?${params}`)).data,
    keepPreviousData: true,
  });

  const approve = useMutation({
    mutationFn: (id) => api.put(`/payments/${id}/approve`),
    onSuccess: () => { toast.success('Payment approved'); qc.invalidateQueries({ queryKey: ['t-payments'] }); },
  });
  const reject = useMutation({
    mutationFn: ({ id, note }) => api.put(`/payments/${id}/reject`, { teacherNote: note }),
    onSuccess: () => {
      toast.success('Payment rejected');
      setRejectId(null); setRejectNote('');
      qc.invalidateQueries({ queryKey: ['t-payments'] });
    },
  });

  const updateFilter = (k, v) => { setFilters({ ...filters, [k]: v }); setPage(1); };

  const stats = data?.stats || {};
  const split = stats.split || {};

  return (
    <div>
      <PageHeader title="Payments" subtitle="Approve, reject and review every payment." />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={stats.pendingCount ?? 0} icon={Hourglass} accent="rose" />
        <StatCard label="Approved (this month)" value={stats.approvedThisMonth ?? 0} icon={TrendingUp} accent="emerald" />
        <StatCard label="Revenue (this month)" value={formatLKR(stats.revenueThisMonth ?? 0)} icon={Wallet} accent="gold" />
        <StatCard
          label="Bank vs PayHere"
          value={`${split.bank_transfer?.count || 0} / ${split.payhere?.count || 0}`}
          icon={Layers}
          accent="navy"
        />
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-400" />
            <input className="input pl-9" placeholder="Search by Student ID or name" value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
          </div>
          <select className="input" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="input" value={filters.paymentType} onChange={e => updateFilter('paymentType', e.target.value)}>
            <option value="all">All types</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="payhere">PayHere</option>
            <option value="manual">Manual Grant</option>
          </select>
          <select className="input" value={filters.classId} onChange={e => updateFilter('classId', e.target.value)}>
            <option value="">All classes</option>
            {classes?.classes.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <div className="flex gap-2">
            <select className="input" value={filters.month} onChange={e => updateFilter('month', e.target.value)}>
              <option value="">Month</option>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{monthName(i+1)}</option>)}
            </select>
            <input className="input w-24" placeholder="Year" type="number" value={filters.year} onChange={e => updateFilter('year', e.target.value)} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : data?.payments.length === 0 ? (
        <div className="card p-10 text-center text-midnight-500">No payments match your filters.</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-midnight-50 text-midnight-700">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Student</th>
                  <th className="text-left p-3">Class</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Period</th>
                  <th className="text-left p-3">Submitted</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Slip</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p, i) => (
                  <tr key={p._id} className="border-t border-midnight-100">
                    <td className="p-3 text-midnight-500">{(page - 1) * 20 + i + 1}</td>
                    <td className="p-3">
                      <p className="font-medium">{p.studentId?.firstName} {p.studentId?.lastName}</p>
                      <p className="text-xs font-mono text-midnight-500">{p.studentId?.studentId}</p>
                    </td>
                    <td className="p-3">{p.classId?.title}</td>
                    <td className="p-3 capitalize text-xs">{p.paymentType.replace('_', ' ')}</td>
                    <td className="p-3 font-semibold">{formatLKR(p.amount, p.currency)}</td>
                    <td className="p-3">{p.month ? `${monthName(p.month)} ${p.year}` : '—'}</td>
                    <td className="p-3 text-xs">{format(new Date(p.createdAt), 'PP')}</td>
                    <td className="p-3">
                      <span className={
                        p.status === 'approved' ? 'badge-emerald'
                        : p.status === 'rejected' ? 'badge-rose'
                        : 'badge-amber'
                      }>{p.status}</span>
                      {p.teacherNote && <p className="text-xs text-rose-600 mt-1 max-w-[12rem] truncate" title={p.teacherNote}>{p.teacherNote}</p>}
                    </td>
                    <td className="p-3">
                      {p.slipUrl ? (
                        <button onClick={() => setSlipUrl(p.slipUrl)} className="text-gold-700 hover:underline inline-flex items-center gap-1">
                          <ImageIcon size={14} /> View
                        </button>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      {p.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => approve.mutate(p._id)} className="btn-success py-1 px-2 text-xs"><Check size={14}/></button>
                          <button onClick={() => setRejectId(p._id)} className="btn-danger py-1 px-2 text-xs"><X size={14}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-midnight-500">
              Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} payments
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline disabled:opacity-50">Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-outline disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}

      {/* Slip lightbox */}
      <Modal open={!!slipUrl} onClose={() => setSlipUrl(null)} title="Payment Slip" size="lg">
        {slipUrl?.endsWith('.pdf') ? (
          <iframe src={slipUrl} className="w-full h-[70vh]" title="Slip PDF" />
        ) : (
          <img src={slipUrl} alt="Payment slip" className="w-full max-h-[70vh] object-contain" />
        )}
        <a href={slipUrl} target="_blank" rel="noreferrer" className="btn-outline mt-4 inline-flex">Open in new tab</a>
      </Modal>

      {/* Reject modal */}
      <Modal open={!!rejectId} onClose={() => { setRejectId(null); setRejectNote(''); }} title="Reject Payment">
        <p className="text-sm text-midnight-600 mb-4">Provide a reason — the student will see this note.</p>
        <textarea
          rows={4}
          className="input"
          placeholder="e.g. Slip is unclear / amount mismatch / wrong reference"
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => { setRejectId(null); setRejectNote(''); }} className="btn-outline">Cancel</button>
          <button
            onClick={() => reject.mutate({ id: rejectId, note: rejectNote })}
            disabled={!rejectNote.trim() || reject.isPending}
            className="btn-danger"
          >
            {reject.isPending ? 'Rejecting…' : 'Reject Payment'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
