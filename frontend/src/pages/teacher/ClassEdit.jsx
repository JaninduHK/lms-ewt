import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, Calendar, Users, Settings as SettingsIcon, GripVertical, Upload } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';
import { formatLKR, monthName } from '../../utils/format';

const TABS = [
  { id: 'details', label: 'Details', icon: SettingsIcon },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'zoom', label: 'Zoom Links', icon: Calendar },
  { id: 'students', label: 'Students', icon: Users },
];

function SortableVideoItem({ video, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100 bg-white">
      <button {...attributes} {...listeners} className="cursor-grab text-midnight-400 hover:text-midnight-700">
        <GripVertical size={18} />
      </button>
      <div className="w-12 h-8 rounded bg-midnight-900 flex items-center justify-center text-gold-400 shrink-0">
        <Video size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-midnight-900 truncate">{video.title}</p>
        <p className="text-xs text-midnight-500">{video.platform.toUpperCase()} · {video.embedId}</p>
      </div>
      <button onClick={onRemove} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg">
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ClassEdit() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('details');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data, isLoading } = useQuery({
    queryKey: ['t-class', id],
    queryFn: async () => (await api.get(`/classes/${id}`)).data,
  });
  const { data: enr } = useQuery({
    queryKey: ['t-class-enrollments', id],
    queryFn: async () => (await api.get(`/enrollments/class/${id}`)).data,
    enabled: tab === 'students',
  });

  const update = useMutation({
    mutationFn: (patch) => api.put(`/classes/${id}`, patch),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['t-class', id] }); },
  });

  const addVideo = useMutation({
    mutationFn: (body) => api.post(`/classes/${id}/videos`, body),
    onSuccess: () => { toast.success('Video added'); qc.invalidateQueries({ queryKey: ['t-class', id] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const delVideo = useMutation({
    mutationFn: (vid) => api.delete(`/classes/${id}/videos/${vid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-class', id] }),
  });
  const reorder = useMutation({
    mutationFn: (order) => api.put(`/classes/${id}/videos/reorder`, { order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-class', id] }),
  });

  const addMaterial = useMutation({
    mutationFn: (fd) => api.post(`/classes/${id}/materials`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { toast.success('Material uploaded'); qc.invalidateQueries({ queryKey: ['t-class', id] }); },
  });
  const delMaterial = useMutation({
    mutationFn: (mid) => api.delete(`/classes/${id}/materials/${mid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-class', id] }),
  });

  const addZoom = useMutation({
    mutationFn: (body) => api.post(`/classes/${id}/zoom`, body),
    onSuccess: () => { toast.success('Session added'); qc.invalidateQueries({ queryKey: ['t-class', id] }); },
  });
  const delZoom = useMutation({
    mutationFn: (zid) => api.delete(`/classes/${id}/zoom/${zid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['t-class', id] }),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  // For teacher endpoint, we need full class. The /classes/:id detail returns trimmed public version.
  // Re-fetch as teacher: use /classes (list) as fallback or call via cls editor — but for editing we need full doc.
  // We'll request the full list and find by id.
  const cls = data?.class;
  return (
    <div className="space-y-6">
      <Link to="/teacher/classes" className="inline-flex items-center gap-2 text-midnight-600 hover:text-midnight-900">
        <ArrowLeft size={16} /> Back to classes
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-midnight-900">{cls?.title}</h1>
          <p className="text-midnight-500 mt-1 capitalize">
            {cls?.type} · {formatLKR(cls?.price, cls?.currency)} · {cls?.isPublished ? 'Published' : 'Draft'}
          </p>
        </div>
      </div>

      {/* Tabs */}
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
      {tab === 'videos' && (
        <VideosTab
          videos={cls?.videoCount ? null : null}
          fullCls={cls}
          onAdd={(b) => addVideo.mutate(b)}
          onDel={(vid) => delVideo.mutate(vid)}
          onReorder={(order) => reorder.mutate(order)}
          sensors={sensors}
        />
      )}
      {tab === 'materials' && (
        <MaterialsTab fullCls={cls} onAdd={(fd) => addMaterial.mutate(fd)} onDel={(mid) => delMaterial.mutate(mid)} />
      )}
      {tab === 'zoom' && (
        <ZoomTab fullCls={cls} onAdd={(b) => addZoom.mutate(b)} onDel={(zid) => delZoom.mutate(zid)} />
      )}
      {tab === 'students' && <StudentsTab enrollments={enr?.enrollments || []} />}
    </div>
  );
}

function DetailsTab({ cls, onSave, saving }) {
  const [form, setForm] = useState({
    title: cls.title, description: cls.description, thumbnail: cls.thumbnail,
    type: cls.type, price: cls.price, currency: cls.currency, isPublished: cls.isPublished,
  });
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
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
            <option value="subscription">Subscription</option>
            <option value="onetime">One-Time</option>
          </select>
        </div>
        <div>
          <label className="label">Price</label>
          <input type="number" className="input" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
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

function VideosTab({ fullCls, onAdd, onDel, onReorder, sensors }) {
  // Note: The detail endpoint for teachers actually returns trimmed view.
  // We re-fetch full doc by listing teacher classes and extracting. For simplicity below we use videos prop fed by parent re-fetch via list. Workaround: parent uses /classes list which DOES include full nested docs.
  // For this UI, we'll fetch the list and find this class.
  const { data: list } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const fullDoc = list?.classes.find(c => c._id === fullCls._id) || {};
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const videos = fullDoc.videos || [];

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = videos.map(v => v._id);
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    const newOrder = arrayMove(ids, oldIdx, newIdx);
    onReorder(newOrder);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Add Video</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="input sm:col-span-1" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="input sm:col-span-2" placeholder="YouTube or Vimeo URL" value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <button
          onClick={() => { onAdd({ title, url }); setTitle(''); setUrl(''); }}
          disabled={!title || !url}
          className="btn-gold mt-3"
        ><Plus size={16} /> Add</button>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Videos ({videos.length})</h3>
        {videos.length === 0 ? (
          <p className="text-midnight-500 text-sm text-center py-6">No videos yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={videos.map(v => v._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {videos.map(v => (
                  <SortableVideoItem key={v._id} video={v} onRemove={() => onDel(v._id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

function MaterialsTab({ fullCls, onAdd, onDel }) {
  const { data: list } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const fullDoc = list?.classes.find(c => c._id === fullCls._id) || {};
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');

  const handleUpload = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (title) fd.append('title', title);
    onAdd(fd);
    setFile(null); setTitle('');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Upload Material</h3>
        <div className="space-y-3">
          <input className="input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="file" onChange={e => setFile(e.target.files?.[0])} className="block w-full text-sm" />
          <button onClick={handleUpload} disabled={!file} className="btn-gold">
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Materials ({fullDoc.materials?.length || 0})</h3>
        {!fullDoc.materials?.length ? (
          <p className="text-midnight-500 text-sm text-center py-6">No materials yet.</p>
        ) : (
          <div className="space-y-2">
            {fullDoc.materials.map(m => (
              <div key={m._id} className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100">
                <FileText className="text-gold-600" />
                <div className="flex-1 min-w-0">
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-midnight-900 truncate hover:underline">{m.title}</a>
                  <p className="text-xs text-midnight-500">{m.fileType} · {(m.fileSize / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button onClick={() => onDel(m._id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ZoomTab({ fullCls, onAdd, onDel }) {
  const { data: list } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });
  const fullDoc = list?.classes.find(c => c._id === fullCls._id) || {};
  const [form, setForm] = useState({ title: '', url: '', scheduledAt: '', duration: 60 });

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Add Live Session</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="Session title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <input className="input" placeholder="Zoom URL" value={form.url} onChange={e => setForm({...form, url: e.target.value})} />
          <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => setForm({...form, scheduledAt: e.target.value})} />
          <input type="number" className="input" placeholder="Duration (min)" value={form.duration} onChange={e => setForm({...form, duration: Number(e.target.value)})} />
        </div>
        <button
          onClick={() => { onAdd(form); setForm({ title: '', url: '', scheduledAt: '', duration: 60 }); }}
          disabled={!form.title || !form.url || !form.scheduledAt}
          className="btn-gold mt-3"
        ><Plus size={16} /> Add Session</button>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Sessions ({fullDoc.zoomLinks?.length || 0})</h3>
        {!fullDoc.zoomLinks?.length ? (
          <p className="text-midnight-500 text-sm text-center py-6">No sessions scheduled.</p>
        ) : (
          <div className="space-y-2">
            {fullDoc.zoomLinks
              .slice()
              .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
              .map(z => {
                const past = new Date(z.scheduledAt).getTime() < Date.now();
                return (
                  <div key={z._id} className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100">
                    <Calendar className={past ? 'text-midnight-400' : 'text-gold-600'} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-midnight-900 truncate">{z.title}</p>
                      <p className="text-xs text-midnight-500">
                        {format(new Date(z.scheduledAt), 'PPPp')} · {z.duration} min · {past ? 'past' : 'upcoming'}
                      </p>
                    </div>
                    <a href={z.url} target="_blank" rel="noreferrer" className="text-gold-700 text-sm hover:underline">Open</a>
                    <button onClick={() => onDel(z._id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
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
