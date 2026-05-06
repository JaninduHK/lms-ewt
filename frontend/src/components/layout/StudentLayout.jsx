import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, BookOpen, ListChecks, CreditCard, User, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const items = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/classes', label: 'Browse Classes', icon: BookOpen },
  { to: '/enrollments', label: 'My Enrollments', icon: ListChecks },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-midnight-50">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-midnight-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="text-midnight-800">
            <Menu size={24} />
          </button>
          <span className="font-serif font-bold text-midnight-900">Econ With Thusitha</span>
          <span className="w-6" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
