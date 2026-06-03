import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Video, FileText, Calendar, Eye, EyeOff, Save,
  Settings as SettingsIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';
import VideosEditor from '../../components/teacher/VideosEditor';
import MaterialsEditor from '../../components/teacher/MaterialsEditor';
import ZoomEditor from '../../components/teacher/ZoomEditor';
import { formatLKR, monthName } from '../../utils/format';

const TABS = [
  { id: 'details', label: 'Details', icon: SettingsIcon },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'zoom', label: 'Zoom Links', icon: Calendar },
];

export default function MonthEdit() {
  const { id, year, month } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');

  const { data: list } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const cls = list?.classes.find(c => c._id === id);
  const m = cls?.months?.find(x => x.month === Number(month) && x.year === Number(year));

  const base = `/classes/${id}/months/${year}/${month}`;

  const updMonth = useMutation({
    mutationFn: (patch) => api.put(`/classes/${id}/months/${year}/${month}`, patch),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });

  const addVideo = useMutation({
    mutationFn: (body) => api.post(`${base}/videos`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const delVideo = useMutation({
    mutationFn: (vid) => api.delete(`${base}/videos/${vid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const updVideo = useMutation({
    mutationFn: ({ vid, patch }) => api.put(`${base}/videos/${vid}`, patch),
    onSuccess: () => { toast.success('Video updated'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });
  const reorderVideos = useMutation({
    mutationFn: (order) => api.put(`${base}/videos/reorder`, { order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const addMaterial = useMutation({
    mutationFn: (body) => api.post(`${base}/materials`, body),
    onSuccess: () => { toast.success('Material uploaded'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Upload failed'),
  });
  const delMaterial = useMutation({
    mutationFn: (mid) => api.delete(`${base}/materials/${mid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });
  const addZoom = useMutation({
    mutationFn: (body) => api.post(`${base}/zoom`, body),
    onSuccess: () => { toast.success('Session added'); qc.invalidateQueries({ queryKey: ['t-classes'] }); },
  });
  const delZoom = useMutation({
    mutationFn: (zid) => api.delete(`${base}/zoom/${zid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-classes'] }),
  });

  if (!list) return <Skeleton className="h-96" />;
  if (!cls) return <div className="card p-8 text-center">Class not found.</div>;
  if (cls.type !== 'subscription') {
    return <div className="card p-8 text-center">This class isn't a subscription class.</div>;
  }
  if (!m) return <div className="card p-8 text-center">Month not found.</div>;

  return (
    <div className="space-y-6">
      <Link to={`/teacher/classes/${id}/edit`} className="inline-flex items-center gap-2 text-midnight-600 hover:text-midnight-900">
        <ArrowLeft size={16} /> Back to {cls.title}
      </Link>
      <div>
        <p className="text-sm text-gold-700 font-medium uppercase tracking-wider">Editing month</p>
        <h1 className="font-serif text-3xl font-bold text-midnight-900">
          {monthName(m.month)} {m.year}
        </h1>
        <p className="text-midnight-500 mt-1">
          {formatLKR(m.price, cls.currency)} · {m.isPublished ? 'Published' : 'Draft'}
        </p>
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

      {tab === 'details' && <MonthDetails m={m} onSave={updMonth.mutate} saving={updMonth.isPending} />}
      {tab === 'videos' && (
        <VideosEditor
          videos={m.videos || []}
          onAdd={(p) => addVideo.mutateAsync(p)}
          onRemove={(vid) => delVideo.mutateAsync(vid)}
          onReorder={(order) => reorderVideos.mutateAsync(order)}
          onUpdate={(vid, patch) => updVideo.mutateAsync({ vid, patch })}
        />
      )}
      {tab === 'materials' && (
        <MaterialsEditor
          materials={m.materials || []}
          onAdd={(p) => addMaterial.mutateAsync(p)}
          onRemove={(mid) => delMaterial.mutateAsync(mid)}
        />
      )}
      {tab === 'zoom' && (
        <ZoomEditor
          zoomLinks={m.zoomLinks || []}
          onAdd={(p) => addZoom.mutateAsync(p)}
          onRemove={(zid) => delZoom.mutateAsync(zid)}
        />
      )}
    </div>
  );
}

function MonthDetails({ m, onSave, saving }) {
  const [price, setPrice] = useState(m.price);
  const [isPublished, setIsPublished] = useState(m.isPublished);
  return (
    <div className="card p-6 space-y-4 max-w-xl">
      <div>
        <label className="label">Price (LKR)</label>
        <input type="number" className="input" value={price} onChange={e => setPrice(e.target.value)} />
        <p className="text-xs text-midnight-500 mt-1">
          Changing the price affects future payments only. Existing approved payments keep their original amount.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="rounded"
          checked={isPublished}
          onChange={e => setIsPublished(e.target.checked)} />
        {isPublished
          ? <><Eye size={14} className="inline -mt-0.5"/> Published — students can browse and buy</>
          : <><EyeOff size={14} className="inline -mt-0.5"/> Draft — hidden from students (already-paid students keep access)</>}
      </label>
      <button
        onClick={() => onSave({ price: Number(price), isPublished })}
        disabled={saving}
        className="btn-gold"
      >
        <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}
