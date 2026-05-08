import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const empty = { title: '', url: '', scheduledAt: '', duration: 60 };

export default function ZoomEditor({ zoomLinks = [], onAdd, onRemove }) {
  const [form, setForm] = useState(empty);

  const handleAdd = async () => {
    if (!form.title || !form.url || !form.scheduledAt) return;
    await onAdd(form);
    setForm(empty);
  };

  const sorted = [...zoomLinks].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

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
        <button onClick={handleAdd} disabled={!form.title || !form.url || !form.scheduledAt} className="btn-gold mt-3">
          <Plus size={16} /> Add Session
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Sessions ({zoomLinks.length})</h3>
        {zoomLinks.length === 0 ? (
          <p className="text-midnight-500 text-sm text-center py-6">No sessions scheduled.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map(z => {
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
                  <button onClick={() => onRemove(z._id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
