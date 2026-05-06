import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';

export default function TeacherSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
  });
  const [form, setForm] = useState({
    bankName: '', accountName: '', accountNumber: '', branch: '', whatsapp: '', instructions: '',
  });

  useEffect(() => {
    if (data?.settings?.bankDetails) setForm({ ...form, ...data.settings.bankDetails });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.put('/settings', form),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings'] }); },
  });

  return (
    <div>
      <PageHeader
        title="Bank Settings"
        subtitle="These details are shown to students on the payment instruction modal."
      />

      <div className="card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Bank Name</label>
            <input className="input" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} />
          </div>
          <div>
            <label className="label">Branch</label>
            <input className="input" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
          </div>
          <div>
            <label className="label">Account Name</label>
            <input className="input" value={form.accountName} onChange={e => setForm({...form, accountName: e.target.value})} />
          </div>
          <div>
            <label className="label">Account Number</label>
            <input className="input" value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">WhatsApp Number (for slip submission)</label>
            <input className="input" placeholder="+9477XXXXXXX" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Additional Instructions</label>
            <textarea rows={4} className="input" value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
            <p className="text-xs text-midnight-500 mt-1">Shown verbatim to students on the payment page.</p>
          </div>
        </div>
        <div className="pt-2">
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-gold">
            <Save size={16} /> {save.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
