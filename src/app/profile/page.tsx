'use client';

import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Receipt,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const menuItems = [
  { icon: <Receipt size={18} />, label: 'Transaction History', href: '/receipts' },
  { icon: <Globe size={18} />, label: 'My eSIMs', href: '/dashboard' },
  { icon: <Bell size={18} />, label: 'Notifications', href: '#' },
  { icon: <Shield size={18} />, label: 'Security', href: '#' },
  { icon: <HelpCircle size={18} />, label: 'Help & Support', href: '#' },
];

export default function ProfilePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#f6f8f6' }}
      >
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-sm w-full">
          <div
            className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4"
            style={{ backgroundColor: '#112116' }}
          >
            <User size={24} color="white" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Your Profile</h2>
          <p className="text-sm text-slate-500 mb-5">
            Sign in to access your profile and account settings.
          </p>
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ backgroundColor: '#112116' }}
          >
            Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Avatar & name */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-5 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#112116' }}
          >
            <User size={26} color="white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {user?.name ?? 'Traveller'}
            </h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-5">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-slate-700">
                <span style={{ color: '#112116' }}>{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>

        <p className="text-center text-xs text-slate-300 mt-6">
          Travela · by Onnela · For A More Enjoyable Life
        </p>
      </div>
    </div>
  );
}
