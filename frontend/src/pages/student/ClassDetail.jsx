import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, FileText, Video, Users, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatLKR } from '../../utils/format';
import Skeleton from '../../components/ui/Skeleton';
import MonthCard from '../../components/student/MonthCard';

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['class', id],
    queryFn: async () => (await api.get(`/classes/${id}`)).data,
  });

  const enroll = useMutation({
    mutationFn: () => api.post('/enrollments', { classId: id }),
    onSuccess: () => {
      toast.success('Enrolled successfully!');
      qc.invalidateQueries({ queryKey: ['class', id] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to enrol'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-44" />
      </div>
    );
  }

  const cls = data?.class;
  if (!cls) return <div className="card p-8 text-center">Class not found.</div>;

  const isSubscription = cls.type === 'subscription';

  const handlePayMonth = (month) => {
    if (!data.enrolled) {
      toast.error('Please enrol in the class first');
      return;
    }
    navigate(`/payments?classId=${cls._id}&month=${month.month}&year=${month.year}`);
  };

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="aspect-[3/1] bg-midnight-900 relative">
          {cls.thumbnail ? (
            <img src={cls.thumbnail} alt={cls.title} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-400">
              <BookOpen size={64} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-900 via-midnight-900/40 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className={isSubscription ? 'badge bg-gold-500 text-midnight-900' : 'badge bg-white text-midnight-900'}>
                {isSubscription ? 'Monthly Subscription' : 'One-Time'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">{cls.title}</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold text-midnight-900 mb-3">About this class</h2>
              <p className="text-midnight-700 whitespace-pre-line leading-relaxed">{cls.description}</p>
              <div className="mt-6 inline-flex items-center gap-3 text-sm text-midnight-600">
                <Users size={16} className="text-gold-600" />
                <span>{cls.enrollmentCount} enrolled</span>
              </div>
            </div>

            {/* Enrollment / onetime price card */}
            <aside>
              <div className="card p-6 sticky top-6 border-2 border-midnight-100">
                {isSubscription ? (
                  <>
                    <p className="text-sm text-midnight-500">Monthly Programme</p>
                    <p className="font-serif text-2xl font-bold text-midnight-900 mt-1">
                      Buy each month separately
                    </p>
                    <p className="text-sm text-midnight-500 mt-1">
                      Permanent access to each month you purchase.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-midnight-500">Price</p>
                    <p className="font-serif text-3xl font-bold text-midnight-900 mt-1">
                      {formatLKR(cls.price, cls.currency)}
                    </p>
                    <p className="text-sm text-midnight-500 mt-1">one-time payment · lifetime access</p>
                  </>
                )}

                <div className="my-5 h-px bg-midnight-100" />

                {data.enrolled ? (
                  <div className="flex items-center gap-2 text-emerald-700 mb-4">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">You're enrolled</span>
                  </div>
                ) : (
                  <button
                    onClick={() => enroll.mutate()}
                    disabled={enroll.isPending}
                    className="btn-gold w-full"
                  >
                    {enroll.isPending ? 'Enrolling…' : 'Enrol Now (Free)'}
                  </button>
                )}

                {/* Onetime quick action when enrolled */}
                {!isSubscription && data.enrolled && (
                  data.hasAccess ? (
                    <Link to={`/classes/${cls._id}/learn`} className="btn-gold w-full mt-2">
                      Go to Class <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => navigate(`/payments?classId=${cls._id}`)}
                      className="btn-primary w-full mt-2"
                    >
                      Purchase access
                    </button>
                  )
                )}

                <p className="text-xs text-midnight-500 mt-4 text-center">
                  Enrolment is free. {isSubscription ? 'Each month is purchased separately.' : 'Payment unlocks the full class.'}
                </p>
              </div>
            </aside>
          </div>

          {/* Subscription: months grid */}
          {isSubscription && (
            <div className="mt-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-midnight-900">Monthly Content</h2>
                  <p className="text-midnight-500 text-sm">Buy any month independently. Paid months stay unlocked permanently.</p>
                </div>
              </div>
              {!cls.months?.length ? (
                <div className="card p-10 text-center text-midnight-500">No months published yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cls.months.map(m => (
                    <MonthCard key={`${m.year}-${m.month}`} classId={cls._id} month={m} onPay={handlePayMonth} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Onetime upcoming sessions preview */}
          {!isSubscription && cls.zoomPreview?.length > 0 && (
            <div className="mt-10">
              <h3 className="font-serif text-xl font-bold text-midnight-900 mb-4">Upcoming Live Sessions</h3>
              <div className="space-y-2">
                {cls.zoomPreview.map(z => (
                  <div key={z._id} className="flex items-center gap-3 p-4 rounded-xl border border-midnight-100">
                    <Calendar className="text-gold-600" size={18} />
                    <div className="flex-1">
                      <p className="font-medium text-midnight-900">{z.title}</p>
                      <p className="text-xs text-midnight-500">{format(new Date(z.scheduledAt), 'PPPp')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSubscription && (
            <div className="mt-10">
              <h3 className="font-serif text-xl font-bold text-midnight-900 mb-4">What's included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-midnight-50">
                  <Video className="text-gold-600" />
                  <div>
                    <p className="font-semibold text-midnight-900">{cls.videoCount}</p>
                    <p className="text-xs text-midnight-500">Recorded videos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-midnight-50">
                  <FileText className="text-gold-600" />
                  <div>
                    <p className="font-semibold text-midnight-900">{cls.materialCount}</p>
                    <p className="text-xs text-midnight-500">Downloadable materials</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-midnight-50">
                  <Users className="text-gold-600" />
                  <div>
                    <p className="font-semibold text-midnight-900">{cls.enrollmentCount}</p>
                    <p className="text-xs text-midnight-500">Enrolled students</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
