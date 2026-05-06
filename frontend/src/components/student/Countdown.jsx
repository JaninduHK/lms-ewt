import { useEffect, useState } from 'react';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const pad = (n) => String(n).padStart(2, '0');

const compute = (target) => {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { diff, d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return { diff, d, h, m, s };
};

export default function Countdown({ session }) {
  const [t, setT] = useState(() => compute(session.scheduledAt));
  useEffect(() => {
    const id = setInterval(() => setT(compute(session.scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [session.scheduledAt]);

  const { diff, d, h, m, s } = t;
  const startMs = new Date(session.scheduledAt).getTime();
  const endMs = startMs + (session.duration || 60) * 60 * 1000;
  const now = Date.now();
  const within15min = diff > 0 && diff <= 15 * 60 * 1000;
  const live = now >= startMs && now <= endMs;
  const ended = now > endMs + 2 * 60 * 60 * 1000;
  const recent = now > endMs && now <= endMs + 2 * 60 * 60 * 1000;

  let badge;
  if (ended) {
    badge = <span className="badge bg-midnight-200 text-midnight-700">Session Ended</span>;
  } else if (live || recent) {
    badge = <span className="badge bg-emerald-500 text-white">Class in Progress</span>;
  } else if (within15min) {
    badge = <span className="badge bg-emerald-500 text-white">Starting Soon</span>;
  } else {
    badge = <span className="badge-gold">Upcoming</span>;
  }

  const canJoin = (live || recent || within15min);
  const joinClass = within15min || live
    ? 'btn-success animate-pulse-soft'
    : 'btn-success';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-serif text-lg font-semibold text-midnight-900 leading-tight">
          {session.title}
        </h4>
        {badge}
      </div>
      <div className="flex items-center gap-3 text-sm text-midnight-600 mb-4">
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} />
          {format(new Date(session.scheduledAt), 'PPP')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {format(new Date(session.scheduledAt), 'p')}
        </span>
      </div>

      {!ended && diff > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { v: d, l: 'Days' },
            { v: pad(h), l: 'Hours' },
            { v: pad(m), l: 'Min' },
            { v: pad(s), l: 'Sec' },
          ].map((x, i) => (
            <div
              key={i}
              className={`rounded-lg py-3 text-center ${within15min ? 'bg-emerald-500 text-white' : 'bg-midnight-900 text-white'}`}
            >
              <p className="font-serif text-xl font-bold tabular-nums">{x.v}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{x.l}</p>
            </div>
          ))}
        </div>
      )}

      {canJoin ? (
        <a href={session.url} target="_blank" rel="noreferrer" className={`${joinClass} w-full`}>
          <ExternalLink size={16} /> JOIN NOW
        </a>
      ) : ended ? null : (
        <button disabled className="btn-outline w-full opacity-60 cursor-not-allowed">
          Not yet started
        </button>
      )}
    </div>
  );
}
