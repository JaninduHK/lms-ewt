import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, BookOpen, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { formatLKR } from '../../utils/format';

export default function TeacherClasses() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', type: 'subscription', price: '', currency: 'LKR',
    thumbnail: '', isPublished: false,
    prefillYear: new Date().getFullYear(), prefillMonths: true,
  });

  const { data } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/classes', {
        title: form.title, description: form.description, type: form.type,
        price: Number(form.price), currency: form.currency,
        thumbnail: form.thumbnail, isPublished: form.isPublished,
      });
      // Optionally pre-create 12 months for subscription classes
      if (form.type === 'subscription' && form.prefillMonths) {
        await api.post(`/classes/${data.class._id}/months/bulk`, {
          year: Number(form.prefillYear),
          defaultPrice: Number(form.price),
        });
      }
      return data;
    },
    onSuccess: ({ class: cls }) => {
      toast.success('Class created');
      setOpenCreate(false);
      qc.invalidateQueries({ queryKey: ['t-classes'] });
      navigate(`/teacher/classes/${cls._id}/edit`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      toast.success('Class deleted');
      qc.invalidateQueries({ queryKey: ['t-classes'] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: ({ id, isPublished }) => api.put(`/classes/${id}`, { isPublished }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Create, publish and manage your courses."
        actions={
          <button onClick={() => setOpenCreate(true)} className="btn-gold">
            <Plus size={16} /> New Class
          </button>
        }
      />

      {!data?.classes?.length ? (
        <div className="card p-10 text-center text-midnight-500">No classes yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.classes.map(c => (
            <div key={c._id} className="card overflow-hidden flex flex-col">
              <div className="aspect-video bg-midnight-900 relative">
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-400"><BookOpen size={40} /></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={c.isPublished ? 'badge-emerald' : 'badge-amber'}>
                    {c.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif font-bold text-midnight-900">{c.title}</h3>
                <p className="text-xs text-midnight-500 mt-1">
                  {c.type === 'subscription'
                    ? `Subscription · ${(c.months?.length || 0)} months`
                    : `One-time · ${formatLKR(c.price, c.currency)}`}
                </p>
                <p className="text-sm text-midnight-600 mt-2 line-clamp-2 flex-1">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/teacher/classes/${c._id}/edit`} className="btn-primary text-sm py-2 px-3"><Pencil size={14} /> Edit</Link>
                  <button
                    onClick={() => togglePublish.mutate({ id: c._id, isPublished: !c.isPublished })}
                    className="btn-outline text-sm py-2 px-3"
                  >
                    {c.isPublished ? <><EyeOff size={14}/> Unpublish</> : <><Eye size={14}/> Publish</>}
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this class? This will remove all enrollments.')) remove.mutate(c._id); }}
                    className="btn-danger text-sm py-2 px-3"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Class">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="subscription">Subscription (per month)</option>
                <option value="onetime">One-Time (lifetime access)</option>
              </select>
            </div>
            <div>
              <label className="label">
                {form.type === 'subscription' ? 'Default month price' : 'Price'} ({form.currency})
              </label>
              <input type="number" className="input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">Thumbnail URL (optional)</label>
            <input className="input" value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})} placeholder="https://…" />
          </div>

          {form.type === 'subscription' && (
            <div className="rounded-lg border border-midnight-100 bg-midnight-50 p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" className="rounded"
                  checked={form.prefillMonths}
                  onChange={e => setForm({...form, prefillMonths: e.target.checked})} />
                Pre-create all 12 months for a year
              </label>
              {form.prefillMonths && (
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input"
                    value={form.prefillYear}
                    onChange={e => setForm({...form, prefillYear: e.target.value})} />
                  <p className="text-xs text-midnight-500 mt-1">
                    Jan–Dec will be created at the default price above. You can edit each month afterwards.
                  </p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded text-midnight-800 border-midnight-200"
              checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} />
            Publish immediately
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpenCreate(false)} className="btn-outline">Cancel</button>
            <button
              onClick={() => create.mutate()}
              disabled={!form.title || !form.price || create.isPending}
              className="btn-gold"
            >
              {create.isPending ? 'Creating…' : 'Create Class'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
