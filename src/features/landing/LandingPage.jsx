import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './landing.css';
import { Toast } from './components/common/Toast';
import { BusinessModules } from './components/features/BusinessModules';
import { Footer } from './components/footer/Footer';
import { HeroHeader } from './components/hero/HeroHeader';
import { DemoModal } from './components/modals/DemoModal';
import { DashboardMockup } from './components/mockup/DashboardMockup';
import { Navbar } from './components/navigation/Navbar';
import { FeaturesGrid } from './components/features/FeaturesGrid';
import { PricingSection } from './components/pricing/PricingSection';
import { WhyInventry } from './components/stats/WhyInventry';
import {
  CATEGORIES,
  INITIAL_INVENTORY,
  INITIAL_ORDER_LIST
} from './data/inventoryData';

export default function LandingPage({
  isLoggedIn = false,
  onNavigateAuth
}) {
  const navigate = useNavigate();

  // Navigation & Interactive States
  const [activeNav, setActiveNav] = useState('Home');
  const [activeCategory, setActiveCategory] = useState('All Stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderMode, setOrderMode] = useState('Restock In');
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [orderItems, setOrderItems] = useState(INITIAL_ORDER_LIST);
  const [toastMessage, setToastMessage] = useState('');

  // Landing Page Sections State
  const [billingCycle, setBillingCycle] = useState('annual');
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter products inside the Dashboard Mockup based on category and search query
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesCat =
        activeCategory === 'All Stock' ||
        activeCategory === 'Suppliers' ||
        item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [inventory, activeCategory, searchQuery]);

  // Click handler for product cards inside the dashboard preview
  const handleSelectProduct = (product) => {
    setInventory((prev) =>
      prev.map((it) =>
        it.id === product.id
          ? { ...it, orderQty: it.orderQty > 0 ? it.orderQty + 1 : 1 }
          : it
      )
    );

    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + 5 } : i
        );
      }
      return [
        {
          id: product.id,
          name: product.name,
          qty: 5,
          unitPrice: product.price
        },
        ...prev
      ];
    });

    triggerToast(`Added 5x ${product.name} to ${orderMode} queue`);
  };

  const handleClearOrders = () => {
    setOrderItems([]);
    setInventory((prev) => prev.map((it) => ({ ...it, orderQty: 0 })));
    triggerToast('Purchase Order queue cleared');
  };

  const handleLoginClick = () => {
    if (onNavigateAuth) {
      onNavigateAuth('signin');
    } else {
      navigate('/login');
    }
  };

  const handleGetStartedClick = () => {
    if (onNavigateAuth) {
      onNavigateAuth('signup');
    } else {
      navigate('/register');
    }
  };

  const handleDashboardClick = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        '--text': '#2f1f13',
        '--background': '#f6ecdf',
        '--bg-alt': '#F6EDE1',
        '--primary': '#2f2a25',
        '--secondary': '#0d0d0d',
        '--accent': '#7bbd65'
      }}
      className="min-h-screen bg-[#f6ecdf] text-[#2f1f13] font-sans selection:bg-[#2f2a25] selection:text-[#F6EDE1] overflow-x-hidden"
    >
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Hero Section Container */}
      <div
        className="relative w-full pb-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, #e9dbc8 0%, transparent 38%), radial-gradient(circle at 88% 42%, #e9dbc8 0%, transparent 40%), radial-gradient(circle at 50% 48%, #F6EDE1 0%, #f6ecdf 75%)'
        }}
      >
        {/* Navigation Bar Component */}
        <Navbar
          activeNav={activeNav}
          onNavClick={(label) => setActiveNav(label)}
          onLoginClick={handleLoginClick}
          isLoggedIn={isLoggedIn}
          onDashboardClick={handleDashboardClick}
        />

        {/* Hero Title and Action Block */}
        <HeroHeader
          onGetStarted={handleGetStartedClick}
          onBookDemo={() => setDemoModalOpen(true)}
        />

        {/* Hero Dashboard Interactive Mockup */}
        <DashboardMockup
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          searchQuery={searchQuery}
          onSearchChange={(query) => setSearchQuery(query)}
          filteredInventory={filteredInventory}
          onSelectProduct={handleSelectProduct}
          orderMode={orderMode}
          onOrderModeChange={(mode) => setOrderMode(mode)}
          orderItems={orderItems}
          onClearOrders={handleClearOrders}
          onQuickAction={(actionName) =>
            triggerToast(`${actionName} quick-action opened`)
          }
          onToggleMenu={() => triggerToast('Sidebar navigation toggled')}
        />

        {/* Core Features Grid - Everything you need to keep business moving */}
        <FeaturesGrid />
      </div>

      {/* Most Used Business Modules - Interactive Catalog & Capabilities Grid */}
      <BusinessModules
        onSelectModule={(mod) => triggerToast(`Selected ${mod} workflow`)}
        onViewAll={() => setDemoModalOpen(true)}
      />

      {/* Why Inventry - Stat & Impact Showcase */}
      <WhyInventry />

      {/* Pricing Plans Section */}
      <PricingSection
        billingCycle={billingCycle}
        onBillingCycleChange={setBillingCycle}
        onSelectPlan={(planName) => {
          setDemoModalOpen(true);
          triggerToast(`Selected ${planName} plan`);
        }}
      />

      {/* Footer & CTA Banner */}
      <Footer onOpenDemo={() => setDemoModalOpen(true)} />

      {/* Demo / Sandbox Modal */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onSubmitSuccess={(email, company) => {
          triggerToast(`Workspace invite & demo sent to ${email}!`);
          // Navigate to register with prefilled query params
          navigate(`/register?email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`);
        }}
      />
    </div>
  );
}
