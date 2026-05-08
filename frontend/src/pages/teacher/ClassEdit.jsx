import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Plus, Trash2, Video, FileText, Calendar, Users,
  Settings as SettingsIcon, Layers, ArrowRight, Eye, EyeOff,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { formatLKR, monthName } from '../../utils/format';
import VideosEditor from '../../components/teacher/VideosEditor';
import MaterialsEditor from '../../components/teacher/MaterialsEditor';
import ZoomEditor from '../../components/teacher/ZoomEditor';

export default function ClassEdit() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');

  // The list endpoint returns full nested docs (including months) for teachers.
  const { data: list } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const cls = list?.classes.find(c => c._id === id);
  const { data: enr } = useQuery({
    queryKey: ['t-class-enrollments', id],
    queryFn: async () => (await api.get(`/enrollments/class/${id}`)).data,
    enabled: tab === 'students',
  });

  const update = useMutation({
    mutationFn: (patch) => api.put(`/classes/${id}`, patch),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });

  // Onetime root content mutations
  const addVideo = useMutation({
    mutationFn: (body) => api.post(`/classes/${id}/videos`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const delVideo = useMutation({
    mutationFn: (vid) => api.delete(`/classes/${id}/videos/${vid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const reorderVideos = useMutation({
    mutationFn: (order) => api.put(`/classes/${id}/videos/reorder`, { order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const addMaterial = useMutation({
    mutationFn: (body) => api.post(`/classes/${id}/materials`, body),
    onSuccess: () => { toast.success('Material uploaded'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });
  const delMaterial = useMutation({
    mutationFn: (mid) => api.delete(`/classes/${id}/materials/${mid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const addZoom = useMutation({
    mutationFn: (body) => api.post(`/classes/${id}/zoom`, body),
    onSuccess: () => { toast.success('Session added'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });
  const delZoom = useMutation({
    mutationFn: (zid) => api.delete(`/classes/${id}/zoom/${zid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });

  if (!list) return <Skeleton className="h-96" />;
  if (!cls) return <div className="card p-8 text-center">Class not found.</div>;

  const isSubscription = cls.type === 'subscription';

  const TABS = isSubscription
    ? [
        { id: 'details', label: 'Details', icon: SettingsIcon },
        { id: 'months', label: 'Months', icon: Layers },
        { id: 'students', label: 'Students', icon: Users },
      ]
    : [
        { id: 'details', label: 'Details', icon: SettingsIcon },
        { id: 'videos', label: 'Videos', icon: Video },
        { id: 'materials', label: 'Materials', icon: FileText },
        { id: 'zoom', label: 'Zoom Links', icon: Calendar },
        { id: 'students', label: 'Students', icon: Users },
      ];

  return (
    <div className="space-y-6">
      <Link to="/teacher/classes" className="inline-flex items-center gap-2 text-midnight-600 hover:text-midnight-900">
        <ArrowLeft size={16} /> Back to classes
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-midnight-900">{cls.title}</h1>
          <p className="text-midnight-500 mt-1 capitalize">
            {cls.type === 'subscription' ? 'Monthly Subscription' : 'One-Time'}
            {cls.type === 'onetime' && ` · ${formatLKR(cls.price, cls.currency)}`}
            {' · '}{cls.isPublished ? 'Published' : 'Draft'}
          </p>
        </div>
      </div>

      <div className="border-b border-midnight-200 flex gap-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              tab === t.id ? 'border-gold-500 text-midnight-900' : 'border-transparent text-midnight-500 hover:text-midnight-800'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'details' && <DetailsTab cls={cls} onSave={update.mutate} saving={update.isPending} />}

      {tab === 'months' && isSubscription && <MonthsTab cls={cls} />}

      {tab === 'videos' && !isSubscription && (
        <VideosEditor
          videos={cls.videos || []}
          onAdd={(p) => addVideo.mutateAsync(p)}
          onRemove={(vid) => delVideo.mutateAsync(vid)}
          onReorder={(order) => reorderVideos.mutateAsync(order)}
        />
      )}

      {tab === 'materials' && !isSubscription && (
        <MaterialsEditor
          materials={cls.materials || []}
          onAdd={(p) => addMaterial.mutateAsync(p)}
          onRemove={(mid) => delMaterial.mutateAsync(mid)}
        />
      )}

      {tab === 'zoom' && !isSubscription && (
        <ZoomEditor
          zoomLinks={cls.zoomLinks || []}
          onAdd={(p) => addZoom.mutateAsync(p)}
          onRemove={(zid) => delZoom.mutateAsync(zid)}
        />
      )}

      {tab === 'students' && <StudentsTab enrollments={enr?.enrollments || []} />}
    </div>
  );
}

function DetailsTab({ cls, onSave, saving }) {
  const [form, setForm] = useState({
    title: cls.title, description: cls.description, thumbnail: cls.thumbnail,
    price: cls.price, currency: cls.currency, isPublished: cls.isPublished,
  });
  const isSubscription = cls.type === 'subscription';
  return (
    <div className="card p-6 space-y-4 max-w-3xl">
      <div>
        <label className="label">Title</label>
        <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea rows={4} className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>
      <div>
        <label className="label">Thumbnail URL</label>
        <input className="input" value={form.thumbnail} onChange={e => setForm({...form, thumbnail: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{isSubscription ? 'Default month price' : 'Price'}</label>
          <input type="number" className="input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
          {isSubscription && (
            <p className="text-xs text-midnight-500 mt-1">Used as the default for newly created months. Each month can override it.</p>
          )}
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="rounded" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} />
        Published (visible to students)
      </label>
      <button onClick={() => onSave({ ...form, price: Number(form.price) })} disabled={saving} className="btn-gold">
        <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

function MonthsTab({ cls }) {
  const qc = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);

  const months = [...(cls.months || [])].sort((a, b) => (a.year - b.year) || (a.month - b.month));

  const addMonth = useMutation({
    mutationFn: (body) => api.post(`/classes/${cls._id}/months`, body),
    onSuccess: () => { toast.success('Month added'); qc.invalidateQueries({ queryKey: ['t-classes'] }); setOpenAdd(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const bulk = useMutation({
    mutationFn: (body) => api.post(`/classes/${cls._id}/months/bulk`, body),
    onSuccess: ({ data }) => { toast.success(`${data.added} months created`); qc.invalidateQueries({ queryKey: ['t-classes'] }); setOpenBulk(false); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const togglePub = useMutation({
    mutationFn: ({ year, month, isPublished }) =>
      api.put(`/classes/${cls._id}/months/${year}/${month}`, { isPublished }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const updPrice = useMutation({
    mutationFn: ({ year, month, price }) =>
      api.put(`/classes/${cls._id}/months/${year}/${month}`, { price }),
    onSuccess: () => { toast.success('Price updated'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });
  const remove = useMutation({
    mutationFn: ({ year, month }) => api.delete(`/classes/${cls._id}/months/${year}/${month}`),
    onSuccess: () => { toast.success('Month deleted'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setOpenAdd(true)} className="btn-gold"><Plus size={16}/> Add Month</button>
        <button onClick={() => setOpenBulk(true)} className="btn-outline"><Layers size={16}/> Pre-create Year</button>
      </div>

      {months.length === 0 ? (
        <div className="card p-10 text-center text-midnight-500">
          No months yet. Use "Pre-create Year" to add Jan–Dec for a year, or add months individually.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-midnight-50 text-midnight-700">
              <tr>
                <th className="text-left p-3">Month</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Content</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => (
                <MonthRow
                  key={`${m.year}-${m.month}`}
                  classId={cls._id}
                  m={m}
                  onTogglePublish={() => togglePub.mutate({ year: m.year, month: m.month, isPublished: !m.isPublished })}
                  onSavePrice={(p) => updPrice.mutate({ year: m.year, month: m.month, price: p })}
                  onRemove={() => {
                    if (confirm(`Delete ${monthName(m.month)} ${m.year}? Months with paid students cannot be deleted.`)) {
                      remove.mutate({ year: m.year, month: m.month });
                    }
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddMonthModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        defaultPrice={cls.price}
        existing={months}
        onSave={(payload) => addMonth.mutate(payload)}
        saving={addMonth.isPending}
      />
      <BulkYearModal
        open={openBulk}
        onClose={() => setOpenBulk(false)}
        defaultPrice={cls.price}
        onSave={(payload) => bulk.mutate(payload)}
        saving={bulk.isPending}
      />
    </div>
  );
}

function MonthRow({ classId, m, onTogglePublish, onSavePrice, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(m.price);
  const total = (m.videoCount ?? m.videos?.length ?? 0)
    + (m.materialCount ?? m.materials?.length ?? 0)
    + (m.zoomCount ?? m.zoomLinks?.length ?? 0);
  return (
    <tr className="border-t border-midnight-100">
      <td className="p-3 font-medium text-midnight-900">
        <p>{monthName(m.month)} {m.year}</p>
      </td>
      <td className="p-3">
        {editing ? (
          <div className="flex gap-1">
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input w-28 py-1" />
            <button onClick={() => { onSavePrice(Number(price)); setEditing(false); }} className="btn-success py-1 px-2 text-xs">Save</button>
            <button onClick={() => { setPrice(m.price); setEditing(false); }} className="btn-outline py-1 px-2 text-xs">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-left hover:underline">
            {formatLKR(m.price)}
          </button>
        )}
      </td>
      <td className="p-3 text-xs text-midnight-600">
        <span title="videos">{m.videoCount ?? m.videos?.length ?? 0} videos</span>
        {' · '}
        <span title="materials">{m.materialCount ?? m.materials?.length ?? 0} files</span>
        {' · '}
        <span title="zoom">{m.zoomCount ?? m.zoomLinks?.length ?? 0} zoom</span>
        {total === 0 && <span className="text-amber-600 ml-2">(empty)</span>}
      </td>
      <td className="p-3">
        <button onClick={onTogglePublish} className={m.isPublished ? 'badge-emerald' : 'badge-amber'}>
          {m.isPublished ? <><Eye size={12} className="inline mr-1"/>Published</> : <><EyeOff size={12} className="inline mr-1"/>Draft</>}
        </button>
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <Link
            to={`/teacher/classes/${classId}/months/${m.year}/${m.month}/edit`}
            className="btn-primary py-1 px-2 text-xs"
          >
            Edit content <ArrowRight size={12}/>
          </Link>
          <button onClick={onRemove} className="btn-danger py-1 px-2 text-xs"><Trash2 size={12}/></button>
        </div>
      </td>
    </tr>
  );
}

function AddMonthModal({ open, onClose, defaultPrice, existing, onSave, saving }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [price, setPrice] = useState(defaultPrice);
  const exists = existing.some(m => m.month === Number(month) && m.year === Number(year));
  return (
    <Modal open={open} onClose={onClose} title="Add Month">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Month</label>
            <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{monthName(i+1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" className="input" value={year} onChange={e => setYear(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Price (LKR)</label>
          <input type="number" className="input" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        {exists && <p className="text-xs text-rose-600">A month for {monthName(month)} {year} already exists.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button
            onClick={() => onSave({ month: Number(month), year: Number(year), price: Number(price) })}
            disabled={saving || exists}
            className="btn-gold"
          >
            {saving ? 'Adding…' : 'Add Month'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BulkYearModal({ open, onClose, defaultPrice, onSave, saving }) {
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [price, setPrice] = useState(defaultPrice);
  return (
    <Modal open={open} onClose={onClose} title="Pre-create months for a year">
      <div className="space-y-3">
        <p className="text-sm text-midnight-600">
          Creates Jan–Dec at the same default price. Months that already exist are skipped.
          You can change individual prices afterwards.
        </p>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" value={year} onChange={e => setYear(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Default price (LKR)</label>
          <input type="number" className="input" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button
            onClick={() => onSave({ year, defaultPrice: Number(price) })}
            disabled={saving}
            className="btn-gold"
          >
            {saving ? 'Creating…' : 'Create months'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StudentsTab({ enrollments }) {
  return (
    <div className="card p-5 max-w-5xl">
      <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Enrolled Students ({enrollments.length})</h3>
      {enrollments.length === 0 ? (
        <p className="text-midnight-500 text-sm text-center py-6">No students enrolled yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-midnight-50 text-midnight-700">
              <tr>
                <th className="text-left p-3">Student ID</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">School</th>
                <th className="text-left p-3">District</th>
                <th className="text-left p-3">WhatsApp</th>
                <th className="text-left p-3">Enrolled</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(e => (
                <tr key={e._id} className="border-t border-midnight-100">
                  <td className="p-3 font-mono">{e.studentId?.studentId}</td>
                  <td className="p-3">{e.studentId?.firstName} {e.studentId?.lastName}</td>
                  <td className="p-3">{e.studentId?.school}</td>
                  <td className="p-3">{e.studentId?.district}</td>
                  <td className="p-3">{e.studentId?.whatsapp}</td>
                  <td className="p-3">{format(new Date(e.enrolledAt), 'PP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
