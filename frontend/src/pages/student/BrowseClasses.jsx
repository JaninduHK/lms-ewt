import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import ClassCard from '../../components/student/ClassCard';
import Skeleton from '../../components/ui/Skeleton';

export default function BrowseClasses() {
  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  return (
    <div>
      <PageHeader
        title="Browse Classes"
        subtitle="Explore all available courses and enrol in the ones you'd like to study."
      />
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : data?.classes?.length === 0 ? (
        <div className="card p-10 text-center text-midnight-500">No classes available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.classes.map(c => <ClassCard key={c._id} cls={c} />)}
        </div>
      )}
    </div>
  );
}
