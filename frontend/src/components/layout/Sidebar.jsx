import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

export default function Sidebar({ items, open, onClose }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-midnight-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={false}
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-midnight-900 text-white z-50 flex flex-col
          transform transition-transform duration-300 lg:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-midnight-800/60 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">
              Econ With <span className="text-gold-400">Thusitha</span>
            </h1>
            <p className="text-xs text-midnight-300 mt-0.5">A/L Economics Tuition</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-midnight-300 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* User card */}
        <div className="px-6 py-5 border-b border-midnight-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gold-500 text-midnight-900 flex items-center justify-center font-semibold">
              {initials(user?.firstName, user?.lastName)}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{user?.firstName} {user?.lastName}</p>
              {user?.studentId && (
                <p className="text-xs text-gold-400 font-mono">{user.studentId}</p>
              )}
              {user?.role === 'teacher' && (
                <p className="text-xs text-gold-400">Teacher</p>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg text-sm font-medium transition
                ${isActive
                  ? 'bg-midnight-700 text-gold-400 shadow-inner'
                  : 'text-midnight-200 hover:bg-midnight-800 hover:text-white'}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-midnight-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-midnight-200 hover:bg-midnight-800 hover:text-white transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}
