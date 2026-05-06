import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ui/ProtectedRoute';
import StudentLayout from './components/layout/StudentLayout';
import TeacherLayout from './components/layout/TeacherLayout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import StudentDashboard from './pages/student/Dashboard';
import BrowseClasses from './pages/student/BrowseClasses';
import ClassDetail from './pages/student/ClassDetail';
import ClassLearn from './pages/student/ClassLearn';
import StudentPayments from './pages/student/Payments';
import StudentProfile from './pages/student/Profile';
import MyEnrollments from './pages/student/MyEnrollments';

import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClasses from './pages/teacher/Classes';
import TeacherClassEdit from './pages/teacher/ClassEdit';
import TeacherStudents from './pages/teacher/Students';
import TeacherPayments from './pages/teacher/Payments';
import TeacherSettings from './pages/teacher/Settings';

import { useAuth } from './context/AuthContext';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<RoleRedirect />} />

      {/* Student */}
      <Route element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/classes" element={<BrowseClasses />} />
        <Route path="/classes/:id" element={<ClassDetail />} />
        <Route path="/classes/:id/learn" element={<ClassLearn />} />
        <Route path="/enrollments" element={<MyEnrollments />} />
        <Route path="/payments" element={<StudentPayments />} />
        <Route path="/profile" element={<StudentProfile />} />
      </Route>

      {/* Teacher */}
      <Route element={<ProtectedRoute role="teacher"><TeacherLayout /></ProtectedRoute>}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/classes/:id/edit" element={<TeacherClassEdit />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/payments" element={<TeacherPayments />} />
        <Route path="/teacher/settings" element={<TeacherSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
