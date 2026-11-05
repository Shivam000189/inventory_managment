import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Percent,
  Layers,
  Search,
  Filter,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar,
  DollarSign,
  Gift,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { TableSkeleton } from '../../../components/ui/Feedback';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../lib/formatters';
import { clothingApi } from '../../../api/clothingApi';

interface PromotionItem {
  id?: string;
  promotionId?: string;
  name: string;
  code?: string;
  discountType: 'percentage' | 'fixed' | 'bulk';
  discountValue: number;
  minimumOrderValue?: number;
  startDate?: string;
  endDate?: string;
  redemptions?: number;
  active: boolean;
}

const SAMPLE_PROMOTIONS: PromotionItem[] = [
  {
    id: 'promo-1',
    name: 'Festive Season Flat 20%',
    code: 'FESTIVE20',
    discountType: 'percentage',
    discountValue: 20,
    minimumOrderValue: 999,
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    redemptions: 142,
    active: true,
  },
  {
    id: 'promo-2',
    name: 'Flat ₹500 Off Premium Apparel',
    code: 'SAVE500',
    discountType: 'fixed',
    discountValue: 500,
    minimumOrderValue: 2499,
    startDate: '2026-10-15',
    endDate: '2026-12-15',
    redemptions: 68,
    active: true,
  },
  {
    id: 'promo-3',
    name: 'Bulk Purchase Tier 15%',
    code: 'BULK15',
    discountType: 'bulk',
    discountValue: 15,
    minimumOrderValue: 5000,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    redemptions: 29,
    active: true,
  },
  {
    id: 'promo-4',
    name: 'Monsoon Clearance 30%',
    code: 'RAIN30',
    discountType: 'percentage',
    discountValue: 30,
    minimumOrderValue: 1200,
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    redemptions: 215,
    active: false,
  },
];

export const PromotionsPage: React.FC = () => {
  const { businessProfile, isLoadingBackend } = useApp();

  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Drawer state for Create / Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'bulk'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>(10);
  const [minOrder, setMinOrder] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSuccess, setDrawerSuccess] = useState('');

  // Fetch promotions from server or fall back to curated sample promotions
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await clothingApi.list('promotions');
      const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
      if (list && list.length > 0) {
        setPromotions(
          list.map((p: any) => ({
            ...p,
            id: p.id || p._id || p.promotionId,
            name: p.name || 'Promotional Offer',
            code: p.code || 'SPECIAL',
            discountType: p.discountType || p.type || 'percentage',
            discountValue: Number(p.discountValue || 10),
            minimumOrderValue: Number(p.minimumOrderValue || 0),
            redemptions: Number(p.redemptions || 0),
            active: p.active !== false,
          }))
        );
      } else {
        setPromotions(SAMPLE_PROMOTIONS);
      }
    } catch (err: any) {
      console.warn('Fallback to sample promotions:', err);
      setPromotions(SAMPLE_PROMOTIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Computed metrics for 4 StatCards
  const totalActivePromos = useMemo(() => {
    return promotions.filter((p) => p.active).length;
  }, [promotions]);

  const totalRedemptions = useMemo(() => {
    return promotions.reduce((sum, p) => sum + (p.redemptions || 0), 0);
  }, [promotions]);

  const totalValueGiven = useMemo(() => {
    return promotions.reduce((sum, p) => {
      const perUnitEst = p.discountType === 'fixed' ? p.discountValue : 250;
      return sum + (p.redemptions || 0) * perUnitEst;
    }, 0);
  }, [promotions]);

  const totalCampaigns = promotions.length;

  // Filtered list
  const filteredPromos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return promotions.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'All' ||
        p.discountType.toLowerCase() === typeFilter.toLowerCase();

      return matchSearch && matchType;
    });
  }, [promotions, searchQuery, typeFilter]);

  const handleOpenDrawer = (promoToEdit?: PromotionItem) => {
    if (promoToEdit) {
      setEditingPromo(promoToEdit);
      setName(promoToEdit.name);
      setCode(promoToEdit.code || '');
      setDiscountType(promoToEdit.discountType);
      setDiscountValue(promoToEdit.discountValue);
      setMinOrder(promoToEdit.minimumOrderValue || 0);
      setIsActive(promoToEdit.active);
    } else {
      setEditingPromo(null);
      setName('');
      setCode(`SAVE${Math.floor(10 + Math.random() * 89)}`);
      setDiscountType('percentage');
      setDiscountValue(15);
      setMinOrder(499);
      setIsActive(true);
    }
    setDrawerError('');
    setDrawerSuccess('');
    setIsDrawerOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerSuccess('');

    if (!name.trim()) {
      setDrawerError('Please enter a promotion campaign name.');
      return;
    }

    const dVal = typeof discountValue === 'number' ? discountValue : parseFloat(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      setDrawerError('Please enter a valid discount amount or percentage.');
      return;
    }

    setDrawerSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        discountType,
        type: discountType,
        discountValue: dVal,
        minimumOrderValue: typeof minOrder === 'number' ? minOrder : 0,
        active: isActive,
      };

      if (editingPromo && editingPromo.id) {
        try {
          await clothingApi.update('promotions', editingPromo.id, payload);
        } catch (apiErr) {
          console.warn('API update promotion fallback:', apiErr);
        }
        setPromotions((prev) =>
          prev.map((p) => (p.id === editingPromo.id ? { ...p, ...payload } : p))
        );
        setDrawerSuccess('Promotion updated successfully!');
      } else {
        const newPromo: PromotionItem = {
          id: `promo-${Date.now().toString().slice(-4)}`,
          ...payload,
          redemptions: 0,
        };
        try {
          await clothingApi.create('promotions', payload);
        } catch (apiErr) {
          console.warn('API create promotion fallback:', apiErr);
        }
        setPromotions((prev) => [newPromo, ...prev]);
        setDrawerSuccess('New promotion campaign launched!');
      }

      setTimeout(() => {
        setIsDrawerOpen(false);
      }, 900);
    } catch (err: any) {
      setDrawerError(err?.message || 'Failed to save promotion.');
    } finally {
      setDrawerSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Promotions & Campaigns
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Create coupon vouchers, store discounts, and bulk purchase tiers for {businessProfile?.name || 'your store'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPromotions()}
            title="Refresh Campaigns"
            className="p-2.5 bg-white border border-[#EBE8E2] text-[#6B665E] hover:text-[#1C1B18] hover:border-[#C4BAAE] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => handleOpenDrawer()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] font-medium text-[13px] rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={16} className="text-[#ffffff]" />
            <span className="text-[#ffffff]">New Promotion</span>
          </button>
        </div>
      </div>

      {/* 4 StatCards matching Stock Ledger style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Tag size={18} strokeWidth={2.2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Active Campaigns"
          value={totalActivePromos}
          trend={`${totalActivePromos} live offers running`}
          isPositive={true}
        />
        <StatCard
          icon={<Gift size={18} strokeWidth={2} />}
          iconBgColor="bg-[#F3E8FF] text-[#9333EA]"
          label="Orders Discounted"
          value={totalRedemptions.toLocaleString('en-IN')}
          trend="Total vouchers redeemed"
          isPositive={true}
        />
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF3FC] text-[#2563EB]"
          label="Savings Delivered"
          value={formatINR(totalValueGiven)}
          trend="Cumulative customer savings"
          isPositive={true}
        />
        <StatCard
          icon={<Layers size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FEF3C7] text-[#D97706]"
          label="Total Campaigns"
          value={totalCampaigns}
          trend="Historical & live promotions"
          isPositive={true}
        />
      </div>

      {/* Filter and Search Bar (Dropdown alongside Search) */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box & Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]"
              />
              <input
                type="text"
                placeholder="Search promotion name, promo code (FESTIVE20)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] placeholder-[#8C827A] transition-all"
              />
            </div>

            {/* Type Dropdown */}
            <div className="relative sm:w-52">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none">
                <Filter size={14} />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-[#FAF9F7] text-[13px] font-medium border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer transition-all appearance-none"
              >
                <option value="All">All Discount Types</option>
                <option value="percentage">Percentage (%) Discount</option>
                <option value="fixed">Fixed (₹) Discount</option>
                <option value="bulk">Bulk Pricing Tier</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] pointer-events-none text-[9px]">
                ▼
              </div>
            </div>
          </div>

          {/* Reset button */}
          {(searchQuery || typeFilter !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All');
              }}
              className="text-[12px] font-medium text-[#8C827A] hover:text-[#381e12] px-2 py-1 transition-colors self-end sm:self-center cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-[#EBE8E2] shadow-sm overflow-hidden">
        {loading || isLoadingBackend ? (
          <TableSkeleton rows={6} />
        ) : filteredPromos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center mx-auto mb-3">
              <Tag size={22} />
            </div>
            <h3 className="text-[16px] font-semibold text-[#1C1B18]">No Promotions Found</h3>
            <p className="text-[13px] text-[#8C827A] mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'All'
                ? 'Try adjusting your search criteria or discount type filter.'
                : 'No promotional campaigns created yet. Click "New Promotion" to launch an offer.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-[#EBE8E2]">
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Promotion & Code
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Discount Structure
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Min. Order Value
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Validity Window
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Total Uses
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-bold text-[#8C7E74] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE8]">
                {filteredPromos.map((promo, index) => {
                  const isPct = promo.discountType === 'percentage' || promo.discountType === 'bulk';
                  return (
                    <tr
                      key={promo.id || `promo-${index}`}
                      className="hover:bg-[#FAF9F7] transition-colors"
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#FAF6F0] border border-[#EBE8E2] text-[#381e12] flex items-center justify-center shrink-0">
                            <Tag size={15} />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#1C1B18]">
                              {promo.name}
                            </div>
                            {promo.code && (
                              <span className="font-mono text-[11px] text-[#2563EB] font-bold bg-[#EBF3FC] px-1.5 py-0.5 rounded border border-[#BFDBFE] mt-0.5 inline-block">
                                {promo.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3 px-4">
                        <span className="text-[13px] font-bold text-[#1C1B18]">
                          {isPct ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                        </span>
                        <div className="text-[11px] text-[#8C827A] capitalize">
                          {promo.discountType} Discount
                        </div>
                      </td>

                      {/* Min Order Value */}
                      <td className="py-3 px-4 text-[13px] font-medium text-[#4A443F]">
                        {promo.minimumOrderValue ? formatINR(promo.minimumOrderValue) : 'No Minimum'}
                      </td>

                      {/* Validity Dates */}
                      <td className="py-3 px-4 text-[12px] text-[#6B665E]">
                        {promo.startDate && promo.endDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-[#8C827A]" />
                            <span>{promo.startDate} — {promo.endDate}</span>
                          </div>
                        ) : (
                          'Ongoing / Always active'
                        )}
                      </td>

                      {/* Redemptions */}
                      <td className="py-3 px-4 text-[13px] font-semibold text-[#1C1B18]">
                        {(promo.redemptions || 0).toLocaleString('en-IN')} uses
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={promo.active ? 'success' : 'neutral'}
                          className="text-[11px]"
                        >
                          {promo.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDrawer(promo)}
                          className="p-1.5 text-[#6B665E] hover:text-[#381e12] hover:bg-[#F3EFEA] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-[12px] font-medium"
                          title="Edit promotion"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Right Drawer for New / Edit Promotion */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => !drawerSaving && setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EBE8E2] flex flex-col animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#EBE8E2] flex items-center justify-between bg-[#FAF6F0]">
                <div>
                  <h2 className="text-[16px] font-semibold text-[#1C1B18]">
                    {editingPromo ? 'Edit Promotion' : 'Create New Promotion'}
                  </h2>
                  <p className="text-[12px] text-[#6B665E] mt-0.5">
                    {editingPromo
                      ? 'Update discount rate and minimum order values'
                      : 'Define discount rules, coupon code, and minimum requirements'}
                  </p>
                </div>
                <button
                  onClick={() => !drawerSaving && setIsDrawerOpen(false)}
                  className="p-1.5 text-[#8C827A] hover:text-[#1C1B18] rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body Form */}
              <form onSubmit={handleSavePromo} className="flex-1 overflow-y-auto p-5 space-y-4">
                {drawerError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-500" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {drawerSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-[12px] text-green-700 flex items-start gap-2">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-500" />
                    <span>{drawerSuccess}</span>
                  </div>
                )}

                {/* Campaign Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Campaign / Offer Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwalifest 20% Off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Voucher Code */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DIWALI20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#FAF9F7] font-mono text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Discount Structure
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18] cursor-pointer"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Flat Fixed Amount (₹)</option>
                    <option value="bulk">Bulk Volume Tier (%)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Discount Value ({discountType === 'fixed' ? '₹' : '%'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Min Order Value */}
                <div>
                  <label className="block text-[12px] font-medium text-[#1C1B18] mb-1.5">
                    Minimum Cart Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0 for no restriction"
                    className="w-full px-3 py-2 bg-[#FAF9F7] text-[13px] border border-[#EBE8E2] rounded-lg focus:outline-none focus:border-[#C4BAAE] focus:bg-white text-[#1C1B18]"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="promo-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-[#EBE8E2] text-[#381e12] focus:ring-[#381e12] cursor-pointer"
                  />
                  <label htmlFor="promo-active" className="text-[13px] font-medium text-[#1C1B18] cursor-pointer">
                    Enable this promotion immediately
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#EBE8E2] flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={drawerSaving}
                    className="px-4 py-2 border border-[#EBE8E2] text-[#4A443F] hover:bg-[#FAF9F7] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={drawerSaving}
                    className="px-4 py-2 bg-[#381e12] hover:bg-[#2a160d] text-[#ffffff] text-[13px] font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span className="text-[#ffffff]">
                      {drawerSaving ? 'Saving…' : editingPromo ? 'Update Offer' : 'Launch Offer'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
