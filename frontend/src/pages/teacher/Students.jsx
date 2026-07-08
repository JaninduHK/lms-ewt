import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import { formatLKR } from '../../utils/format';

export default function TeacherStudents() {
  const [filters, setFilters] = useState({
    search: '', classId: 'all', district: 'all', school: '', course: 'all', status: 'all',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data: opts } = useQuery({
    queryKey: ['auth-options'],
    queryFn: async () => (await api.get('/auth/options')).data,
  });
  const { data: classes } = useQuery({
    queryKey: ['t-classes'],
    queryFn: async () => (await api.get('/classes')).data,
  });

  const params = new URLSearchParams({ ...filters, page, limit: 20 }).toString();
  const { data, isLoading } = useQuery({
    queryKey: ['t-students', filters, page],
    queryFn: async () => (await api.get(`/students?${params}`)).data,
    keepPreviousData: true,
  });

  const exportCSV = async () => {
    const res = await api.get(`/students/export?${new URLSearchParams(filters).toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url; a.download = `students-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    window.URL.revokeObjectURL(url);
  };

  const updateFilter = (k, v) => { setFilters({ ...filters, [k]: v }); setPage(1); };

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Search and filter all registered students."
        actions={
          <button onClick={exportCSV} className="btn-outline">
            <Download size={16} /> Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight-400" />
            <input
              className="input pl-9"
              placeholder="Search name, ID, email, WhatsApp"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
            />
          </div>
          <select className="input" value={filters.classId} onChange={e => updateFilter('classId', e.target.value)}>
            <option value="all">All classes</option>
            {classes?.classes.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <select className="input" value={filters.district} onChange={e => updateFilter('district', e.target.value)}>
            <option value="all">All districts</option>
            {opts?.districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input" value={filters.course} onChange={e => updateFilter('course', e.target.value)}>
            <option value="all">All courses</option>
            {opts?.courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            className="input"
            placeholder="School"
            value={filters.school}
            onChange={e => updateFilter('school', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : data?.students.length === 0 ? (
        <div className="card p-10 text-center text-midnight-500">No students match your filters.</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-midnight-50 text-midnight-700">
                <tr>
                  <th className="text-left p-3">Student ID</th>
                  <th className="text-left p-3">Full Name</th>
                  <th className="text-left p-3">Course</th>
                  <th className="text-left p-3">School</th>
                  <th className="text-left p-3">District</th>
                  <th className="text-left p-3">WhatsApp</th>
                  <th className="text-left p-3">Classes</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map(s => (
                  <tr key={s._id} className="border-t border-midnight-100 hover:bg-midnight-50/50">
                    <td className="p-3 font-mono">{s.studentId}</td>
                    <td className="p-3 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="p-3">{s.course || '—'}</td>
                    <td className="p-3">{s.school || '—'}</td>
                    <td className="p-3">{s.district || '—'}</td>
                    <td className="p-3">{s.whatsapp || '—'}</td>
                    <td className="p-3">{s.enrolledClasses?.length || 0}</td>
                    <td className="p-3">{format(new Date(s.createdAt), 'PP')}</td>
                    <td className="p-3">
                      <button onClick={() => setSelected(s._id)} className="btn-outline py-1 px-2 text-xs">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-midnight-500">
              Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} students
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline disabled:opacity-50">Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p + 1)} className="btn-outline disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}

      <StudentDetailModal id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StudentDetailModal({ id, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['t-student-detail', id],
    queryFn: async () => (await api.get(`/students/${id}`)).data,
    enabled: !!id,
  });
  return (
    <Modal open={!!id} onClose={onClose} title="Student Profile" size="xl">
      {isLoading || !data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-midnight-900 text-gold-400 flex items-center justify-center font-serif text-2xl font-bold">
              {data.student.firstName?.[0]}{data.student.lastName?.[0]}
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-midnight-900">
                {data.student.firstName} {data.student.lastName}
              </h3>
              <p className="text-midnight-500">{data.student.email}</p>
              <span className="badge bg-midnight-900 text-gold-400 mt-2 font-mono">{data.student.studentId}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-midnight-500 text-xs uppercase">Course</p><p className="font-medium">{data.student.course || '—'}</p></div>
            <div><p className="text-midnight-500 text-xs uppercase">WhatsApp</p><p className="font-medium">{data.student.whatsapp || '—'}</p></div>
            <div><p className="text-midnight-500 text-xs uppercase">School</p><p className="font-medium">{data.student.school || '—'}</p></div>
            <div><p className="text-midnight-500 text-xs uppercase">District</p><p className="font-medium">{data.student.district || '—'}</p></div>
            <div><p className="text-midnight-500 text-xs uppercase">Joined</p><p className="font-medium">{format(new Date(data.student.createdAt), 'PP')}</p></div>
          </div>

          <div>
            <h4 className="font-serif text-lg font-bold text-midnight-900 mb-2">Enrollments ({data.enrollments.length})</h4>
            {data.enrollments.length === 0 ? (
              <p className="text-sm text-midnight-500">None.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {data.enrollments.map(e => (
                  <li key={e._id} className="flex justify-between p-2 rounded border border-midnight-100">
                    <span>{e.classId?.title}</span>
                    <span className="badge-emerald">{e.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="font-serif text-lg font-bold text-midnight-900 mb-2">Payment History ({data.payments.length})</h4>
            {data.payments.length === 0 ? (
              <p className="text-sm text-midnight-500">None.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {data.payments.map(p => (
                  <div key={p._id} className="flex justify-between p-2 rounded border border-midnight-100">
                    <div>
                      <p className="font-medium">{p.classId?.title}</p>
                      <p className="text-xs text-midnight-500">
                        {p.month ? `${p.month}/${p.year} · ` : ''}{p.paymentType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{formatLKR(p.amount, p.currency)}</p>
                      <span className={p.status === 'approved' ? 'badge-emerald' : p.status === 'rejected' ? 'badge-rose' : 'badge-amber'}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
