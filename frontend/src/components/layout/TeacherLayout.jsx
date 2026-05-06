import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, CreditCard, Settings, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const items = [
  { to: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/teacher/classes', label: 'Classes', icon: BookOpen },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/payments', label: 'Payments', icon: CreditCard },
  { to: '/teacher/settings', label: 'Bank Settings', icon: Settings },
];

export default function TeacherLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-midnight-50">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-midnight-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="text-midnight-800">
            <Menu size={24} />
          </button>
          <span className="font-serif font-bold text-midnight-900">Teacher Console</span>
          <span className="w-6" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
