import { useState } from 'react';
import { Trash2, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function MaterialsEditor({ materials = [], onAdd, onRemove }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setProgress(0);
      const upload = await uploadToCloudinary(file, 'materials', setProgress);
      await onAdd({
        title: title || upload.originalFilename || file.name,
        fileUrl: upload.url,
        fileType: file.type,
        fileSize: upload.bytes,
      });
      setFile(null); setTitle(''); setProgress(0);
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Upload Material</h3>
        <div className="space-y-3">
          <input className="input" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <input type="file" onChange={e => setFile(e.target.files?.[0])} className="block w-full text-sm" />
          {uploading && (
            <div>
              <div className="h-2 rounded-full bg-midnight-100 overflow-hidden">
                <div className="h-full bg-gold-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-midnight-500 mt-1">Uploading… {progress}%</p>
            </div>
          )}
          <button onClick={handleUpload} disabled={!file || uploading} className="btn-gold">
            <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Materials ({materials.length})</h3>
        {materials.length === 0 ? (
          <p className="text-midnight-500 text-sm text-center py-6">No materials yet.</p>
        ) : (
          <div className="space-y-2">
            {materials.map(m => (
              <div key={m._id} className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100">
                <FileText className="text-gold-600" />
                <div className="flex-1 min-w-0">
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-midnight-900 truncate hover:underline">{m.title}</a>
                  <p className="text-xs text-midnight-500">{m.fileType} {m.fileSize ? `· ${(m.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                </div>
                <button onClick={() => onRemove(m._id)} className="text-rose-600 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
