import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { BottomNav } from './layout/BottomNav';
import { CommandPalette } from './layout/CommandPalette';
import { NotificationDrawer } from './layout/NotificationDrawer';

interface DashboardLayoutProps {
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll container to top smoothly on page transition
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#FAF8F5] antialiased selection:bg-[#E6F1E6]">
      {/* Left Sidebar */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAF8F5]">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main
          id="main-scroll-container"
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 bg-[#FAF8F5] smooth-scroll"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.18,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-full max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Overlays */}
      <CommandPalette />
      <NotificationDrawer />
    </div>
  );
};

export default DashboardLayout;
