import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import ClassCard from '../../components/student/ClassCard';
import Skeleton from '../../components/ui/Skeleton';

export default function MyEnrollments() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => (await api.get('/enrollments/my')).data,
  });

  return (
    <div>
      <PageHeader title="My Enrollments" subtitle="The classes you've enrolled in." />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : data?.enrollments?.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-midnight-500 mb-4">You haven't enrolled in any class yet.</p>
          <Link to="/classes" className="btn-gold inline-flex">Browse Classes</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.enrollments.filter(e => e.classId).map(e => (
            <ClassCard key={e._id} cls={e.classId} />
          ))}
        </div>
      )}
    </div>
  );
}
