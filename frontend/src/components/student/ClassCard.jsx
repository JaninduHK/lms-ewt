import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, ArrowRight } from 'lucide-react';
import { formatLKR } from '../../utils/format';

export default function ClassCard({ cls }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card overflow-hidden flex flex-col"
    >
      <div className="aspect-video bg-midnight-900 relative overflow-hidden">
        {cls.thumbnail ? (
          <img src={cls.thumbnail} alt={cls.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gold-400">
            <BookOpen size={48} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={cls.type === 'subscription' ? 'badge bg-midnight-900 text-gold-400 border border-gold-500/30' : 'badge bg-gold-500 text-midnight-900'}>
            {cls.type === 'subscription' ? 'Subscription' : 'One-Time'}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-serif text-lg font-bold text-midnight-900 leading-snug">{cls.title}</h3>
        <p className="text-sm text-midnight-500 mt-2 line-clamp-2 flex-1">{cls.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="font-serif text-xl font-bold text-midnight-900">{formatLKR(cls.price, cls.currency)}</p>
            <p className="text-xs text-midnight-500">{cls.type === 'subscription' ? 'per month' : 'one-time'}</p>
          </div>
          <Link to={`/classes/${cls._id}`} className="btn-primary">
            View <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
