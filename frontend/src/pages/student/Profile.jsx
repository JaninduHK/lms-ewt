import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { initials } from '../../utils/format';

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs text-midnight-500 uppercase tracking-wider">{label}</p>
    <p className="font-medium text-midnight-900 mt-1">{value || '—'}</p>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div>
      <PageHeader title="Profile" subtitle="Your registration details and Student ID." />
      <div className="card p-8 max-w-3xl">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-midnight-900 text-gold-400 flex items-center justify-center font-serif text-3xl font-bold">
            {initials(user.firstName, user.lastName)}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-midnight-900">{user.firstName} {user.lastName}</h2>
            <p className="text-midnight-500">{user.email}</p>
            <span className="badge bg-midnight-900 text-gold-400 mt-2 font-mono">{user.studentId}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Course" value={user.course} />
          <Field label="WhatsApp" value={user.whatsapp} />
          <Field label="School" value={user.school} />
          <Field label="District" value={user.district} />
        </div>
      </div>
    </div>
  );
}
