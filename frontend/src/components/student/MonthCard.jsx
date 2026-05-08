import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Clock, ArrowRight, Video, FileText, Calendar } from 'lucide-react';
import { formatLKR, monthName } from '../../utils/format';

export default function MonthCard({ classId, month, onPay }) {
  const status = month.paymentStatus;
  const paid = month.hasAccess;
  const pending = status === 'pending';
  const rejected = status === 'rejected';

  let badge;
  if (paid) badge = <span className="badge-emerald inline-flex items-center gap-1"><CheckCircle2 size={12} /> Paid</span>;
  else if (pending) badge = <span className="badge-amber inline-flex items-center gap-1"><Clock size={12} /> Awaiting approval</span>;
  else if (rejected) badge = <span className="badge-rose">Payment rejected</span>;
  else badge = <span className="badge bg-midnight-100 text-midnight-600 inline-flex items-center gap-1"><Lock size={12} /> Locked</span>;

  return (
    <motion.div whileHover={{ y: -3 }} className="card overflow-hidden flex flex-col">
      <div className={`h-2 ${paid ? 'bg-emerald-500' : pending ? 'bg-amber-400' : 'bg-midnight-200'}`} />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-midnight-500">{month.year}</p>
            <h3 className="font-serif text-xl font-bold text-midnight-900 leading-tight">{monthName(month.month)}</h3>
          </div>
          {badge}
        </div>

        <div className="flex items-center gap-3 text-xs text-midnight-500">
          <span className="inline-flex items-center gap-1"><Video size={12} /> {month.videoCount}</span>
          <span className="inline-flex items-center gap-1"><FileText size={12} /> {month.materialCount}</span>
          <span className="inline-flex items-center gap-1"><Calendar size={12} /> {month.zoomCount}</span>
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            <p className="font-serif text-lg font-bold text-midnight-900">{formatLKR(month.price)}</p>
          </div>
          {paid ? (
            <Link
              to={`/classes/${classId}/months/${month.year}/${month.month}/learn`}
              className="btn-gold text-sm py-2 px-3"
            >
              Go to Class <ArrowRight size={14} />
            </Link>
          ) : pending ? (
            <button disabled className="btn-outline text-sm py-2 px-3 opacity-70 cursor-not-allowed">
              Pending
            </button>
          ) : (
            <button onClick={() => onPay(month)} className="btn-primary text-sm py-2 px-3">
              Buy month
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
