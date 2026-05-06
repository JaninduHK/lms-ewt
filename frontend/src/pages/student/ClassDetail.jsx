import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Video, Users, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatLKR } from '../../utils/format';
import Skeleton from '../../components/ui/Skeleton';

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
              <span className={cls.type === 'subscription' ? 'badge bg-gold-500 text-midnight-900' : 'badge bg-white text-midnight-900'}>
                {cls.type === 'subscription' ? 'Subscription' : 'One-Time'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">{cls.title}</h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-midnight-900 mb-3">About this class</h2>
            <p className="text-midnight-700 whitespace-pre-line leading-relaxed">{cls.description}</p>

            <h3 className="font-serif text-xl font-bold text-midnight-900 mt-8 mb-4">What's included</h3>
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

            {cls.zoomPreview?.length > 0 && (
              <>
                <h3 className="font-serif text-xl font-bold text-midnight-900 mt-8 mb-4">Upcoming Live Sessions</h3>
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
              </>
            )}
          </div>

          <aside>
            <div className="card p-6 sticky top-6 border-2 border-midnight-100">
              <p className="text-sm text-midnight-500">Price</p>
              <p className="font-serif text-3xl font-bold text-midnight-900 mt-1">
                {formatLKR(cls.price, cls.currency)}
              </p>
              <p className="text-sm text-midnight-500 mt-1">
                {cls.type === 'subscription' ? 'per month' : 'one-time payment · lifetime access'}
              </p>

              <div className="my-5 h-px bg-midnight-100" />

              {data.enrolled ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-700 mb-4">
                    <CheckCircle2 size={20} />
                    <span className="font-medium">You're enrolled</span>
                  </div>
                  {data.hasAccess ? (
                    <Link to={`/classes/${cls._id}/learn`} className="btn-gold w-full">
                      Go to Class <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <p className="text-sm text-midnight-600 mb-3">
                        {cls.type === 'subscription'
                          ? 'Payment required for the current month to unlock content.'
                          : 'Purchase required to unlock content.'}
                      </p>
                      <button onClick={() => navigate('/payments?classId=' + cls._id)} className="btn-primary w-full">
                        Pay Now
                      </button>
                      <Link to={`/classes/${cls._id}/learn`} className="btn-outline w-full mt-2">
                        View Locked Page
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <button
                  onClick={() => enroll.mutate()}
                  disabled={enroll.isPending}
                  className="btn-gold w-full"
                >
                  {enroll.isPending ? 'Enrolling…' : 'Enrol Now (Free)'}
                </button>
              )}

              <p className="text-xs text-midnight-500 mt-4 text-center">
                Enrolment is free. Payment is required separately to access content.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
