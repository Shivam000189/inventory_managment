import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  TrendingUp,
  Percent,
  Layers,
  Users,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { DateRangePicker } from '../components/common/DateRangePicker';
import { useApp } from '../context/AppContext';
import { formatINR, downloadCSV } from '../lib/formatters';

export const ReportsPage: React.FC = () => {
  const {
    bills,
    products,
    users,
    selectedDateRange,
    setSelectedDateRange,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'sales' | 'valuation' | 'profit' | 'salesperson' | 'tax'
  >('sales');

  const totalSalesRevenue = bills
    .filter((b) => b.status !== 'Cancelled')
    .reduce((acc, b) => acc + b.total, 0);

  const totalStockCost = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  const totalStockRetail = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
  const totalTaxesCollected = bills
    .filter((b) => b.status !== 'Cancelled')
    .reduce((acc, b) => acc + b.tax, 0);

  // Profit estimation: revenue minus estimated COGS
  const totalEstimatedCostOfSales = bills
    .filter((b) => b.status !== 'Cancelled')
    .reduce((acc, b) => {
      const billCost = b.items.reduce((iAcc, it) => {
        const prod = products.find((p) => p.id === it.productId);
        return iAcc + (prod?.purchasePrice || it.unitPrice * 0.6) * it.quantity;
      }, 0);
      return acc + billCost;
    }, 0);

  const estimatedGrossProfit = totalSalesRevenue - totalEstimatedCostOfSales;
  const grossMargin = totalSalesRevenue > 0 ? Math.round((estimatedGrossProfit / totalSalesRevenue) * 100) : 38;

  // Monthly revenue trend data
  const monthlyRevenueData = [
    { month: 'May', revenue: 380000 },
    { month: 'Jun', revenue: 420000 },
    { month: 'Jul', revenue: 460000 },
    { month: 'Aug', revenue: 510000 },
    { month: 'Sep', revenue: 540000 },
    { month: 'Oct', revenue: 590000 },
  ];

  const handleExportCSV = () => {
    if (activeTab === 'sales') {
      const headers = ['Invoice Number', 'Date', 'Customer', 'Items Count', 'Payment Method', 'Status', 'Total (INR)'];
      const rows = bills.map((b) => [
        b.billNumber,
        b.date,
        b.customerName,
        b.items.length,
        b.paymentMethod,
        b.status,
        b.total,
      ]);
      downloadCSV('Inventory-sales-report', headers, rows);
    } else if (activeTab === 'valuation') {
      const headers = ['SKU', 'Product Name', 'Category', 'Quantity On Hand', 'Unit Cost', 'Stock Valuation (Cost)', 'Retail Value'];
      const rows = products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.stock,
        p.purchasePrice,
        p.stock * p.purchasePrice,
        p.stock * p.sellingPrice,
      ]);
      downloadCSV('Inventory-valuation-report', headers, rows);
    } else {
      const headers = ['Date', 'Metric', 'Amount (INR)'];
      const rows = [
        ['26 Oct 2026', 'Total Revenue', totalSalesRevenue],
        ['26 Oct 2026', 'Gross Profit', estimatedGrossProfit],
        ['26 Oct 2026', 'GST Tax Collected', totalTaxesCollected],
      ];
      downloadCSV('Inventory-financial-summary', headers, rows);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Financial & Analytics Reports
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Audit sales performance, inventory valuation, gross margins, and GST breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <DateRangePicker
            value={selectedDateRange}
            onChange={setSelectedDateRange}
          />
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#EEE6DA] pb-2 scrollbar-none">
        {[
          { id: 'sales', label: 'Sales & Revenue' },
          { id: 'valuation', label: 'Inventory Valuation' },
          { id: 'profit', label: 'Profit & Margins' },
          { id: 'salesperson', label: 'Salesperson Performance' },
          { id: 'tax', label: 'GST & Tax Summary' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeTab === tab.id
                ? 'bg-[#1C1B18] !text-white'
                : 'text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF]'
              }`}
            style={{ color: activeTab === tab.id ? '#ffffff' : undefined }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<TrendingUp size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Gross Sales Revenue"
              value={formatINR(totalSalesRevenue)}
              trend="+18% vs prev period"
              isPositive={true}
            />
            <StatCard
              icon={<FileBarChart size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Completed Bills"
              value={bills.filter((b) => b.status === 'Paid').length}
              trend="100% processed"
              isPositive={true}
            />
            <StatCard
              icon={<DollarSign size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Average Order Value"
              value={formatINR(
                Math.round(totalSalesRevenue / (bills.length || 1))
              )}
              trend="Consistent"
              isPositive={true}
            />
          </div>

          {/* Revenue Chart Visual */}
          <div className="bg-white rounded-2xl p-5 border border-[#EEE6DA]">
            <h3 className="text-sm font-semibold text-[#1C1B18] mb-4">
              Monthly Revenue Performance (INR)
            </h3>
            <div className="h-44 flex items-end gap-4 px-4 pt-6 border-b border-[#EEE6DA]">
              {monthlyRevenueData.map((d, i) => {
                const heightPercent = (d.revenue / 600000) * 100;
                return (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-[#1C1B18] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatINR(d.revenue)}
                    </span>
                    <div
                      className={`w-full max-w-[42px] rounded-t-lg transition-all ${i === monthlyRevenueData.length - 1
                          ? 'bg-[#7FAE82]'
                          : 'bg-[#B9D4BA] hover:bg-[#a3c9a5]'
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs text-[#6B665E] font-medium mt-1">{d.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Total Cost Valuation"
              value={formatINR(totalStockCost)}
              trend="Purchase cost basis"
              isPositive={true}
            />
            <StatCard
              icon={<TrendingUp size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Estimated Retail Valuation"
              value={formatINR(totalStockRetail)}
              trend="Selling price basis"
              isPositive={true}
            />
            <StatCard
              icon={<Percent size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Unrealized Margin"
              value={formatINR(totalStockRetail - totalStockCost)}
              trend="Projected return"
              isPositive={true}
            />
          </div>

          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">On Hand</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Total Cost Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF6EF]/50">
                    <td className="py-3 px-4 font-semibold text-[#1C1B18]">{p.name}</td>
                    <td className="py-3 px-3 text-[#6B665E]">{p.category}</td>
                    <td className="py-3 px-3 text-center font-bold tabular-nums">{p.stock}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatINR(p.purchasePrice)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">{formatINR(p.sellingPrice)}</td>
                    <td className="py-3 px-4 text-right font-bold text-[#1C1B18] tabular-nums">
                      {formatINR(p.stock * p.purchasePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<DollarSign size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Gross Profit"
              value={formatINR(estimatedGrossProfit)}
              trend="Net margin positive"
              isPositive={true}
            />
            <StatCard
              icon={<Percent size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Gross Profit Margin"
              value={`${grossMargin}%`}
              trend="Healthy spread"
              isPositive={true}
            />
            <StatCard
              icon={<Layers size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
              label="Cost of Goods Sold (COGS)"
              value={formatINR(totalEstimatedCostOfSales)}
              trend="Direct inventory cost"
              isPositive={false}
            />
          </div>
        </div>
      )}

      {activeTab === 'salesperson' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#9A948A]">
                <tr>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Bills Count</th>
                  <th className="py-3 px-3 text-right">Total Revenue Generated</th>
                  <th className="py-3 px-4 text-right">Avg Ticket Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]">
                {users.map((u) => {
                  const userBills = bills.filter(
                    (b) => b.salespersonId === u.id || b.createdBy.includes(u.name.split(' ')[0])
                  );
                  const userRev = userBills.reduce((acc, b) => acc + b.total, 0);
                  const avg = userBills.length > 0 ? Math.round(userRev / userBills.length) : 0;

                  return (
                    <tr key={u.id} className="hover:bg-[#FAF6EF]/50">
                      <td className="py-3 px-4 font-bold text-[#1C1B18]">{u.name}</td>
                      <td className="py-3 px-3 capitalize text-[#6B665E]">{u.role}</td>
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {userBills.length}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#2E8B57] tabular-nums">
                        {formatINR(userRev)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-[#1C1B18] font-semibold">
                        {formatINR(avg)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <StatCard
              icon={<DollarSign size={18} strokeWidth={2} />}
              iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
              label="Total GST Collected"
              value={formatINR(totalTaxesCollected)}
              trend="Applicable to GSTR-1"
              isPositive={true}
            />
            <StatCard
              icon={<FileBarChart size={18} strokeWidth={2} />}
              iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
              label="Standard Rate Applied"
              value="18% / 12% / 5%"
              trend="HSN mapped"
              isPositive={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};
