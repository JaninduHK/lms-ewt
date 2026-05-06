import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Upload, MessageCircle, Building2, Hash, ReceiptText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { formatLKR, monthName } from '../../utils/format';

export default function Payments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedClassId = searchParams.get('classId');
  const preMonth = parseInt(searchParams.get('month')) || (new Date().getMonth() + 1);
  const preYear = parseInt(searchParams.get('year')) || new Date().getFullYear();

  const [submitOpen, setSubmitOpen] = useState(!!preselectedClassId);
  const [classId, setClassId] = useState(preselectedClassId || '');
  const [month, setMonth] = useState(preMonth);
  const [year, setYear] = useState(preYear);
  const [method, setMethod] = useState('bank_transfer');
  const [slipFile, setSlipFile] = useState(null);

  const { data: payData, isLoading } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => (await api.get('/payments/my')).data,
  });
  const { data: enrolData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await api.get('/enrollments/my')).data,
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });

  const enrolledClasses = enrolData?.enrollments?.map(e => e.classId).filter(Boolean) || [];
  const selectedClass = useMemo(
    () => enrolledClasses.find(c => c._id === classId),
    [enrolledClasses, classId]
  );

  const submitBank = useMutation({
    mutationFn: async () => {
      if (!slipFile) throw new Error('Please upload your payment slip');
      const fd = new FormData();
      fd.append('classId', classId);
      fd.append('slip', slipFile);
      if (selectedClass?.type === 'subscription') {
        fd.append('month', month);
        fd.append('year', year);
      }
      const { data } = await api.post('/payments/bank-transfer', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Payment submitted! Your teacher will verify within 24 hours.');
      setSubmitOpen(false);
      setSlipFile(null);
      qc.invalidateQueries({ queryKey: ['my-payments'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || e.message),
  });

  const initPayHere = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/payments/payhere/init', {
        classId,
        ...(selectedClass?.type === 'subscription' ? { month, year } : {}),
      });
      return data;
    },
    onSuccess: ({ checkout }) => {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkout.sandbox
        ? 'https://sandbox.payhere.lk/pay/checkout'
        : 'https://www.payhere.lk/pay/checkout';
      Object.entries(checkout).forEach(([k, v]) => {
        if (k === 'sandbox') return;
        if (v == null) return;
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = v;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to start checkout'),
  });

  const bd = settings?.settings?.bankDetails || {};
  const waMessage = encodeURIComponent(
    `Hi, I am ${user?.firstName} ${user?.lastName} (${user?.studentId}), sending payment slip for ${selectedClass?.title || ''}`
  );

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Submit payments for your enrolled classes and track approval status."
        actions={
          <button onClick={() => setSubmitOpen(true)} className="btn-gold">
            <CreditCard size={16} /> New Payment
          </button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : payData?.payments.length === 0 ? (
        <div className="card p-10 text-center text-midnight-500">No payments yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-midnight-50 text-midnight-700">
              <tr>
                <th className="text-left p-4">Class</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Period</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Submitted</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Slip</th>
              </tr>
            </thead>
            <tbody>
              {payData.payments.map(p => (
                <tr key={p._id} className="border-t border-midnight-100">
                  <td className="p-4 font-medium text-midnight-900">{p.classId?.title}</td>
                  <td className="p-4 capitalize">{p.paymentType.replace('_', ' ')}</td>
                  <td className="p-4">{p.month ? `${monthName(p.month)} ${p.year}` : '—'}</td>
                  <td className="p-4 font-semibold">{formatLKR(p.amount, p.currency)}</td>
                  <td className="p-4">{format(new Date(p.createdAt), 'PP')}</td>
                  <td className="p-4">
                    <span className={
                      p.status === 'approved' ? 'badge-emerald'
                      : p.status === 'rejected' ? 'badge-rose'
                      : 'badge-amber'
                    }>{p.status}</span>
                    {p.teacherNote && <p className="text-xs text-rose-600 mt-1">{p.teacherNote}</p>}
                  </td>
                  <td className="p-4">
                    {p.slipUrl ? (
                      <a href={p.slipUrl} target="_blank" rel="noreferrer" className="text-gold-700 hover:underline">View</a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit modal */}
      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit Payment" size="lg">
        <div className="space-y-5">
          <div>
            <label className="label">Class</label>
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">-- Select a class --</option>
              {enrolledClasses.map(c => (
                <option key={c._id} value={c._id}>{c.title} — {formatLKR(c.price, c.currency)}</option>
              ))}
            </select>
          </div>

          {selectedClass?.type === 'subscription' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select className="input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{monthName(i+1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" className="input" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
              </div>
            </div>
          )}

          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('bank_transfer')}
                className={`p-4 rounded-lg border-2 text-left transition ${method === 'bank_transfer' ? 'border-gold-500 bg-gold-50' : 'border-midnight-100 hover:border-midnight-300'}`}
              >
                <Building2 className="mb-2 text-midnight-700" />
                <p className="font-semibold text-midnight-900">Bank Transfer</p>
                <p className="text-xs text-midnight-500 mt-0.5">Upload a bank slip for verification</p>
              </button>
              <button
                type="button"
                onClick={() => setMethod('payhere')}
                className={`p-4 rounded-lg border-2 text-left transition ${method === 'payhere' ? 'border-gold-500 bg-gold-50' : 'border-midnight-100 hover:border-midnight-300'}`}
              >
                <CreditCard className="mb-2 text-midnight-700" />
                <p className="font-semibold text-midnight-900">PayHere</p>
                <p className="text-xs text-midnight-500 mt-0.5">Card / online — instant approval</p>
              </button>
            </div>
          </div>

          {method === 'bank_transfer' && classId && (
            <div className="rounded-xl bg-midnight-900 text-white p-5 space-y-3">
              <h4 className="font-serif text-lg font-bold text-gold-400">Bank Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-midnight-300 text-xs">Bank</p><p>{bd.bankName || '—'}</p></div>
                <div><p className="text-midnight-300 text-xs">Branch</p><p>{bd.branch || '—'}</p></div>
                <div><p className="text-midnight-300 text-xs">Account Name</p><p>{bd.accountName || '—'}</p></div>
                <div><p className="text-midnight-300 text-xs">Account Number</p><p className="font-mono">{bd.accountNumber || '—'}</p></div>
                <div className="col-span-2 p-3 rounded-lg bg-midnight-800">
                  <p className="text-midnight-300 text-xs">Amount to transfer</p>
                  <p className="font-serif text-2xl font-bold text-gold-400">{formatLKR(selectedClass?.price, selectedClass?.currency)}</p>
                </div>
                <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg bg-midnight-800">
                  <Hash size={16} className="text-gold-400" />
                  <div>
                    <p className="text-midnight-300 text-xs">Use as Reference</p>
                    <p className="font-mono font-semibold text-gold-400">{user?.studentId}</p>
                  </div>
                </div>
              </div>
              {bd.instructions && <p className="text-xs text-midnight-200 italic">{bd.instructions}</p>}
              {bd.whatsapp && (
                <a
                  href={`https://wa.me/${bd.whatsapp.replace(/\D/g, '')}?text=${waMessage}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition w-full justify-center"
                >
                  <MessageCircle size={16} /> Send slip via WhatsApp
                </a>
              )}
            </div>
          )}

          {method === 'bank_transfer' && (
            <div>
              <label className="label">Upload Bank Slip (JPG/PNG/PDF, max 5MB)</label>
              <div className="rounded-lg border-2 border-dashed border-midnight-200 p-5 text-center hover:border-gold-500 transition">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setSlipFile(e.target.files?.[0])}
                  className="block mx-auto text-sm"
                />
                {slipFile && <p className="mt-2 text-sm text-emerald-700">Selected: {slipFile.name}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => setSubmitOpen(false)} className="btn-outline">Cancel</button>
            {method === 'bank_transfer' ? (
              <button
                onClick={() => submitBank.mutate()}
                disabled={!classId || !slipFile || submitBank.isPending}
                className="btn-gold"
              >
                <Upload size={16} /> {submitBank.isPending ? 'Submitting…' : 'Submit Payment'}
              </button>
            ) : (
              <button
                onClick={() => initPayHere.mutate()}
                disabled={!classId || initPayHere.isPending}
                className="btn-gold"
              >
                <ReceiptText size={16} /> {initPayHere.isPending ? 'Redirecting…' : 'Pay with PayHere'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
