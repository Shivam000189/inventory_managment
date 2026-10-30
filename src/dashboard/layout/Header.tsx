import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Shield,
  UserCheck,
  RotateCcw,
  Store,
  ExternalLink,
  LogOut,
  Database,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authApi, clearAuthSession } from '../lib/api';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    currentUser,
    switchRole,
    setCommandPaletteOpen,
    setNotificationDrawerOpen,
    notifications,
    businessProfile,
    navigate,
    logout,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#EEE6DA] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-[#6B665E] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Input (Exact match to screenshot) */}
        <div
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full max-w-md bg-white border border-[#EEE6DA] hover:border-[#DDD3C4] rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs text-[#9A948A] cursor-pointer transition-colors shadow-2xs group"
        >
          <Search size={16} className="text-[#9A948A] group-hover:text-[#6B665E] transition-colors shrink-0" />
          <span className="truncate flex-1">Search products, suppliers, orders...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[#9A948A] bg-[#FAF6EF] rounded border border-[#EEE6DA]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {/* Backend / Supabase Connection Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EBF7EE] text-[#1E7E34] border border-[#C6EBD0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34] animate-pulse" />
          <Database size={12} className="text-[#1E7E34]" />
          <span>Supabase Connected</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative p-2 rounded-xl text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E8772E] ring-2 ring-white" />
          )}
        </button>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-[#EEE6DA]" />

        {/* User Chip */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 -mr-1.5 rounded-xl hover:bg-[#FAF6EF] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-xs shrink-0 tracking-wider">
              {currentUser.avatarInitials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[13px] font-semibold text-[#1C1B18] leading-tight">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[11px] text-[#6B665E] leading-tight capitalize">
                {currentUser.role === 'admin' ? 'Owner' : 'Salesperson'}
              </div>
            </div>
            <ChevronDown size={14} className="text-[#6B665E]" />
          </button>

          {/* User Menu Dropdown with Role Switcher */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#EEE6DA] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#EEE6DA] mb-1">
                <div className="font-semibold text-xs text-[#1C1B18]">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-[#6B665E] truncate">
                  {currentUser.email}
                </div>
              </div>

              {/* Role Switcher Section (Critical for testing both roles!) */}
              <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase text-[#9A948A] tracking-wider">
                Switch Perspective
              </div>
              <div className="space-y-1 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    switchRole('admin');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    currentUser.role === 'admin'
                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-semibold'
                      : 'text-[#6B665E] hover:bg-[#FAF6EF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#7FAE82]" />
                    <span>Admin (Owner - Full Access)</span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7FAE82]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchRole('salesperson');
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    currentUser.role === 'salesperson'
                      ? 'bg-[#F4EDE2] text-[#1C1B18] font-semibold'
                      : 'text-[#6B665E] hover:bg-[#FAF6EF]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-[#E8772E]" />
                    <span>Salesperson (POS & Bills Only)</span>
                  </div>
                  {currentUser.role === 'salesperson' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E8772E]" />
                  )}
                </button>
              </div>

              <div className="border-t border-[#EEE6DA] pt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>View Landing Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/app/settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Store size={14} />
                  <span>Business Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#6B665E] hover:text-[#D64545] hover:bg-[#FDECEC] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset demo data to initial state?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#D64545] hover:bg-[#FDECEC] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
