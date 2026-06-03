import { useState } from 'react';
import { Plus, Trash2, Video, GripVertical, Eye, Save, X, Pencil } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableVideoItem({ video, onRemove, onUpdate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: video._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [maxViews, setMaxViews] = useState(video.maxViews ?? '');

  const save = async () => {
    await onUpdate({
      title,
      maxViews: maxViews === '' ? null : Number(maxViews),
    });
    setEditing(false);
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
        {editing ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input className="input py-1.5 flex-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
            <input
              className="input py-1.5 w-32"
              type="number"
              min="0"
              value={maxViews}
              onChange={e => setMaxViews(e.target.value)}
              placeholder="∞ views"
            />
          </div>
        ) : (
          <>
            <p className="font-medium text-midnight-900 truncate">{video.title}</p>
            <p className="text-xs text-midnight-500">
              {video.platform.toUpperCase()} · {video.embedId}
              {' · '}
              <span className="inline-flex items-center gap-1 text-midnight-600">
                <Eye size={11} />
                {video.maxViews ? `${video.maxViews} views per student` : 'unlimited views'}
              </span>
            </p>
          </>
        )}
      </div>
      {editing ? (
        <>
          <button onClick={save} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg" title="Save">
            <Save size={16} />
          </button>
          <button
            onClick={() => { setEditing(false); setTitle(video.title); setMaxViews(video.maxViews ?? ''); }}
            className="text-midnight-500 hover:bg-midnight-50 p-2 rounded-lg"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)} className="text-midnight-600 hover:bg-midnight-50 p-2 rounded-lg" title="Edit">
            <Pencil size={16} />
          </button>
          <button onClick={onRemove} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg">
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export default function VideosEditor({ videos = [], onAdd, onRemove, onReorder, onUpdate }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [maxViews, setMaxViews] = useState('');

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = videos.map(v => v._id);
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    onReorder(arrayMove(ids, oldIdx, newIdx));
  };

  const handleAdd = async () => {
    if (!title || !url) return;
    await onAdd({
      title, url,
      maxViews: maxViews === '' ? null : Number(maxViews),
    });
    setTitle(''); setUrl(''); setMaxViews('');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Add Video</h3>
        <div className="grid sm:grid-cols-6 gap-3">
          <input className="input sm:col-span-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="input sm:col-span-3" placeholder="YouTube or Vimeo URL" value={url} onChange={e => setUrl(e.target.value)} />
          <input
            className="input sm:col-span-1"
            type="number"
            min="0"
            placeholder="Max views"
            value={maxViews}
            onChange={e => setMaxViews(e.target.value)}
            title="Max times a student can watch this video. Leave blank for unlimited."
          />
        </div>
        <p className="text-xs text-midnight-500 mt-2">
          Max views: maximum number of times each student can watch this video. Leave blank for unlimited.
        </p>
        <button onClick={handleAdd} disabled={!title || !url} className="btn-gold mt-3">
          <Plus size={16} /> Add
        </button>
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
                  <SortableVideoItem
                    key={v._id}
                    video={v}
                    onRemove={() => onRemove(v._id)}
                    onUpdate={(patch) => onUpdate ? onUpdate(v._id, patch) : Promise.resolve()}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
