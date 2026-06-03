import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, FileDown, Video, ArrowLeft, PlayCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Skeleton from '../../components/ui/Skeleton';
import Countdown from '../../components/student/Countdown';
import SecurePlayer from '../../components/student/SecurePlayer';
import { monthName } from '../../utils/format';

export default function MonthLearn() {
  const { id, year, month } = useParams();
  const qc = useQueryClient();
  const [active, setActive] = useState(0);
  // Track local view-state overrides so the UI lock fires immediately after a play
  // even before the next query refetch.
  const [localViews, setLocalViews] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['month-content', id, year, month],
    queryFn: async () => (await api.get(`/classes/${id}/months/${year}/${month}/content`)).data,
    retry: false,
  });

  useEffect(() => { setActive(0); setLocalViews({}); }, [id, year, month]);

  if (isLoading) return <Skeleton className="h-96" />;

  if (error) {
    const code = error.response?.data?.code;
    const msg = error.response?.data?.message;
    return (
      <div className="card p-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="text-amber-700" size={28} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-midnight-900 mb-2">Content locked</h2>
        <p className="text-midnight-600 mb-6">{msg}</p>
        {code === 'PAYMENT_REQUIRED' && (
          <Link
            to={`/payments?classId=${id}&month=${month}&year=${year}`}
            className="btn-gold inline-flex"
          >
            Pay for {monthName(Number(month))} {year}
          </Link>
        )}
        {code === 'NOT_ENROLLED' && (
          <Link to={`/classes/${id}`} className="btn-gold inline-flex">Go to Enrolment</Link>
        )}
      </div>
    );
  }

  const cls = data.class;
  const m = data.month;
  const video = m.videos[active];
  const viewState = video ? (localViews[video._id] || video.viewState || {}) : {};

  const recordView = async () => {
    if (!video) return;
    try {
      const { data: r } = await api.post(
        `/classes/${id}/months/${year}/${month}/videos/${video._id}/view`
      );
      setLocalViews(prev => ({ ...prev, [video._id]: r.viewState }));
    } catch (e) {
      if (e.response?.status === 403 && e.response?.data?.viewState) {
        setLocalViews(prev => ({ ...prev, [video._id]: e.response.data.viewState }));
      }
      toast.error(e.response?.data?.message || 'Could not record view');
    } finally {
      // Refresh the server's authoritative state for next render
      qc.invalidateQueries({ queryKey: ['month-content', id, year, month] });
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/classes/${id}`} className="inline-flex items-center gap-2 text-midnight-600 hover:text-midnight-900">
        <ArrowLeft size={16} /> Back to class
      </Link>
      <div>
        <p className="text-sm text-gold-700 font-medium uppercase tracking-wider">{monthName(m.month)} {m.year}</p>
        <h1 className="font-serif text-3xl font-bold text-midnight-900">{cls.title}</h1>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="card p-4 lg:sticky lg:top-6">
            <h3 className="font-serif text-lg font-bold text-midnight-900 mb-3">Lessons</h3>
            {m.videos.length === 0 ? (
              <p className="text-sm text-midnight-500">No videos yet.</p>
            ) : (
              <ul className="space-y-1">
                {m.videos.map((v, i) => {
                  const vs = localViews[v._id] || v.viewState || {};
                  return (
                    <li key={v._id}>
                      <button
                        onClick={() => setActive(i)}
                        className={`w-full text-left flex items-start gap-2 p-2.5 rounded-lg text-sm transition
                          ${i === active ? 'bg-midnight-900 text-gold-400' : 'hover:bg-midnight-50 text-midnight-700'}`}
                      >
                        {vs.locked
                          ? <Lock size={16} className="mt-0.5 shrink-0 text-rose-500" />
                          : <PlayCircle size={18} className="mt-0.5 shrink-0" />}
                        <span className="flex-1 leading-snug">
                          {v.title}
                          {v.maxViews ? (
                            <span className="block text-[11px] opacity-70 mt-0.5 inline-flex items-center gap-1">
                              <Eye size={10}/>
                              {vs.remaining != null ? `${vs.remaining} of ${v.maxViews} views left` : `${v.maxViews} views max`}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="lg:col-span-2">
          {video ? (
            <div className="card overflow-hidden">
              <SecurePlayer
                platform={video.platform}
                embedId={video.embedId}
                videoKey={video._id}
                locked={viewState.locked}
                maxViews={video.maxViews}
                remaining={viewState.remaining}
                onFirstPlay={recordView}
              />
              <div className="p-5">
                <h2 className="font-serif text-xl font-bold text-midnight-900">{video.title}</h2>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-center text-midnight-500">
              <Video size={36} className="mx-auto mb-3 text-midnight-300" />
              No video selected.
            </div>
          )}

          <div className="card p-5 mt-6">
            <h3 className="font-serif text-xl font-bold text-midnight-900 mb-4">Downloadable Materials</h3>
            {m.materials.length === 0 ? (
              <p className="text-midnight-500 text-sm">No materials uploaded yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {m.materials.map(mat => (
                  <a
                    key={mat._id}
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-midnight-100 hover:border-gold-500 hover:bg-gold-50 transition"
                  >
                    <FileDown className="text-gold-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-midnight-900 truncate">{mat.title}</p>
                      <p className="text-xs text-midnight-500">
                        {mat.fileType} {mat.fileSize ? `· ${(mat.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="lg:col-span-1 space-y-4">
          <h3 className="font-serif text-lg font-bold text-midnight-900">Live Sessions</h3>
          {m.zoomLinks.length === 0 ? (
            <div className="card p-5 text-center text-sm text-midnight-500">
              No live sessions scheduled.
            </div>
          ) : (
            m.zoomLinks.map(z => <Countdown key={z._id} session={z} />)
          )}
        </aside>
      </div>
    </div>
  );
}
