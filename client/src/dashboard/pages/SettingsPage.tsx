import React, { useState } from 'react';
import {
  Building2,
  Receipt,
  CreditCard,
  Layers,
  User,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { businessProfile, updateBusinessProfile, currentUser } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'profile' | 'billing' | 'payments' | 'inventory' | 'account'
  >('profile');

  const [savedNotice, setSavedNotice] = useState(false);

  // Local copy of profile state
  const [profileData, setProfileData] = useState(businessProfile);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(profileData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
          System Settings
        </h1>
        <p className="text-[13px] text-[#6B665E] mt-0.5">
          Configure business identity, invoicing defaults, UPI payment integrations, and stock thresholds.
        </p>
      </div>

      {/* Main Settings Grid: Left Vertical Sub-tabs & Right Form Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Sub-tabs */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-[#EEE6DA] p-2 space-y-1">
          {[
            { id: 'profile', label: 'Business Profile', icon: Building2 },
            { id: 'billing', label: 'Billing & POS', icon: Receipt },
            { id: 'payments', label: 'UPI & Payments', icon: CreditCard },
            { id: 'inventory', label: 'Inventory Rules', icon: Layers },
            { id: 'account', label: 'My Account', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#F4EDE2] text-[#1C1B18]'
                    : 'text-[#6B665E] hover:bg-[#FAF6EF] hover:text-[#1C1B18]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Container */}
        <div className="md:col-span-9 bg-white rounded-3xl border border-[#EEE6DA] p-6 shadow-2xs">
          <form onSubmit={handleSave} className="space-y-5">
            {savedNotice && (
              <div className="p-3 bg-[#E8F5EC] border border-[#a8dcb3] text-[#2E8B57] text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Settings successfully saved and applied across the system!</span>
              </div>
            )}

            {/* Sub-tab 1: Business Profile */}
            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#1C1B18]">Business Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Business Category / Type
                    </label>
                    <input
                      type="text"
                      value={profileData.businessType}
                      onChange={(e) =>
                        setProfileData({ ...profileData, businessType: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      GSTIN / Tax ID
                    </label>
                    <input
                      type="text"
                      value={profileData.taxNumber}
                      onChange={(e) =>
                        setProfileData({ ...profileData, taxNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none font-mono focus:border-[#7FAE82]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Store Support Phone
                    </label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none focus:border-[#7FAE82]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Store Physical Address (Printed on Invoices)
                  </label>
                  <textarea
                    rows={2}
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({ ...profileData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none resize-none focus:border-[#7FAE82]"
                  />
                </div>
              </div>
            )}

            {/* Sub-tab 2: Billing & POS Defaults */}
            {activeSubTab === 'billing' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#1C1B18]">Billing & Invoicing Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={profileData.invoicePrefix}
                      onChange={(e) =>
                        setProfileData({ ...profileData, invoicePrefix: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Starting Number
                    </label>
                    <input
                      type="number"
                      value={profileData.startingInvoiceNumber}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          startingInvoiceNumber: parseInt(e.target.value) || 1000,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                      Receipt Paper Size
                    </label>
                    <select
                      value={profileData.receiptPaperSize}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          receiptPaperSize: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs bg-white outline-none"
                    >
                      <option value="80mm">80mm Thermal Receipt (Standard POS)</option>
                      <option value="58mm">58mm Thermal Receipt (Compact)</option>
                      <option value="A4">A4 Full Sheet Invoice</option>
                    </select>
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF6EF] rounded-2xl border border-[#EEE6DA] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#1C1B18]">
                        Allow Negative Stock on POS
                      </div>
                      <div className="text-[11px] text-[#6B665E]">
                        Permit bill creation even if product on-hand quantity is 0
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.allowNegativeStock}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          allowNegativeStock: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#7FAE82] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-[#EEE6DA] pt-2">
                    <div>
                      <div className="text-xs font-bold text-[#1C1B18]">
                        Prices Inclusive of Taxes
                      </div>
                      <div className="text-[11px] text-[#6B665E]">
                        Display retail selling prices inclusive of GST
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={profileData.isTaxInclusive}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          isTaxInclusive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#7FAE82] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Receipt Footer Note
                  </label>
                  <input
                    type="text"
                    value={profileData.receiptFooterText}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        receiptFooterText: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none"
                  />
                </div>
              </div>
            )}

            {/* Sub-tab 3: Payments & UPI */}
            {activeSubTab === 'payments' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#1C1B18]">Payment Gateways & UPI</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Merchant UPI ID for QR Code Display at Billing
                  </label>
                  <input
                    type="text"
                    value={profileData.upiId}
                    onChange={(e) =>
                      setProfileData({ ...profileData, upiId: e.target.value })
                    }
                    placeholder="store@bankupi"
                    className="w-full px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none font-mono focus:border-[#7FAE82]"
                  />
                  <p className="text-[11px] text-[#6B665E] mt-1">
                    Customers can scan this QR code directly at the checkout terminal for instant payment.
                  </p>
                </div>
              </div>
            )}

            {/* Sub-tab 4: Inventory Rules */}
            {activeSubTab === 'inventory' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#1C1B18]">Inventory Thresholds</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#1C1B18] mb-1">
                    Default Low-Stock Warning Threshold (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={profileData.lowStockThreshold}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        lowStockThreshold: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full max-w-xs px-3 py-2 rounded-xl border border-[#EEE6DA] text-xs outline-none tabular-nums"
                  />
                  <p className="text-[11px] text-[#6B665E] mt-1">
                    Items with quantities below this count trigger notification alerts on the Overview dashboard.
                  </p>
                </div>
              </div>
            )}

            {/* Sub-tab 5: My Account */}
            {activeSubTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#1C1B18]">My Profile</h3>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA]">
                  <div className="w-12 h-12 rounded-full bg-[#1C1B18] text-white flex items-center justify-center font-bold text-base">
                    {currentUser.avatarInitials}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#1C1B18]">{currentUser.name}</div>
                    <div className="text-xs text-[#6B665E]">{currentUser.email}</div>
                    <div className="text-[11px] text-[#7FAE82] font-semibold capitalize mt-0.5">
                      Role: {currentUser.role === 'admin' ? 'Owner / Super Admin' : 'Salesperson'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[#EEE6DA] flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Save size={15} />
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
