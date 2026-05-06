import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, accent = 'gold' }) {
  const accents = {
    gold: 'bg-gold-500/10 text-gold-700',
    navy: 'bg-midnight-800/10 text-midnight-800',
    emerald: 'bg-emerald-500/10 text-emerald-700',
    rose: 'bg-rose-500/10 text-rose-700',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex items-center gap-4"
    >
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accents[accent]}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-midnight-500">{label}</p>
        <p className="font-serif text-2xl font-bold text-midnight-900 mt-0.5 truncate">{value}</p>
      </div>
    </motion.div>
  );
}
