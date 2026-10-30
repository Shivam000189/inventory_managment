import React, { useState } from 'react';
import { X, CheckCheck, AlertTriangle, PackageCheck, Receipt, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    navigate,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'alerts'>('all');

  if (!isNotificationDrawerOpen) return null;

  const filteredNotifs =
    activeTab === 'alerts'
      ? notifications.filter((n) => n.type === 'low_stock' || n.type === 'po_due')
      : notifications;

  const todayNotifs = filteredNotifs.filter((n) => n.dateGroup === 'Today');
  const earlierNotifs = filteredNotifs.filter((n) => n.dateGroup === 'Earlier');

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return (
          <div className="w-8 h-8 rounded-xl bg-[#FDEEE3] text-[#E8772E] flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
        );
      case 'po_due':
        return (
          <div className="w-8 h-8 rounded-xl bg-[#FFF4DC] text-[#D98E0B] flex items-center justify-center shrink-0">
            <PackageCheck size={15} />
          </div>
        );
      case 'sale':
        return (
          <div className="w-8 h-8 rounded-xl bg-[#E8F5EC] text-[#2E8B57] flex items-center justify-center shrink-0">
            <Receipt size={15} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center shrink-0">
            <CreditCard size={15} />
          </div>
        );
    }
  };

  const handleItemClick = (n: any) => {
    markNotificationAsRead(n.id);
    if (n.link) {
      navigate(n.link);
      setNotificationDrawerOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs transition-opacity"
        onClick={() => setNotificationDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#EEE6DA] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[#EEE6DA]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#1C1B18]">Notifications</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-[#6B665E] hover:text-[#1C1B18] inline-flex items-center gap-1 cursor-pointer font-medium p-1 hover:bg-[#FAF6EF] rounded-lg transition-colors"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationDrawerOpen(false)}
                  className="p-1.5 text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs: All | Alerts */}
            <div className="flex bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]/80">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-[#1C1B18] shadow-2xs'
                    : 'text-[#6B665E] hover:text-[#1C1B18]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'alerts'
                    ? 'bg-white text-[#1C1B18] shadow-2xs'
                    : 'text-[#6B665E] hover:text-[#1C1B18]'
                }`}
              >
                Alerts
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-[#9A948A] text-xs">
                No notifications to display
              </div>
            ) : (
              <>
                {todayNotifs.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[#9A948A] uppercase tracking-wider mb-2">
                      Today
                    </div>
                    <div className="space-y-2">
                      {todayNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          className={`p-3 rounded-2xl border transition-colors cursor-pointer flex items-start gap-3 relative ${
                            n.unread
                              ? 'bg-[#FAF6EF]/60 border-[#DDD3C4]'
                              : 'bg-white border-[#EEE6DA] hover:bg-[#FAF6EF]/40'
                          }`}
                        >
                          {getNotifIcon(n.type)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-[#1C1B18]">
                                {n.title}
                              </h4>
                              <span className="text-[10.5px] text-[#9A948A]">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B665E] mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#E8772E] shrink-0 mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {earlierNotifs.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-[#9A948A] uppercase tracking-wider mb-2">
                      Earlier
                    </div>
                    <div className="space-y-2">
                      {earlierNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          className={`p-3 rounded-2xl border transition-colors cursor-pointer flex items-start gap-3 relative ${
                            n.unread
                              ? 'bg-[#FAF6EF]/60 border-[#DDD3C4]'
                              : 'bg-white border-[#EEE6DA] hover:bg-[#FAF6EF]/40'
                          }`}
                        >
                          {getNotifIcon(n.type)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-[#1C1B18]">
                                {n.title}
                              </h4>
                              <span className="text-[10.5px] text-[#9A948A]">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#6B665E] mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          {n.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#E8772E] shrink-0 mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
