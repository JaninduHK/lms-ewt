import { useState } from 'react';
import { Plus, Trash2, Video, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

export default function VideosEditor({ videos = [], onAdd, onRemove, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

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
    await onAdd({ title, url });
    setTitle(''); setUrl('');
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Add Video</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="input sm:col-span-1" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="input sm:col-span-2" placeholder="YouTube or Vimeo URL" value={url} onChange={e => setUrl(e.target.value)} />
        </div>
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
                  <SortableVideoItem key={v._id} video={v} onRemove={() => onRemove(v._id)} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
