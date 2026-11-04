import React from 'react';
import { ArrowRight, Inbox } from 'lucide-react';
import { formatINR } from '../../lib/formatters';
import { useApp } from '../../context/AppContext';

export const RecentTransactionsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { stockMovements, loadingStates, navigate } = useApp();

  const isInventoryLoading = loadingStates?.inventory;
  const transactions = (stockMovements || []).slice(0, 4);

  return (
    <div className={`bg-white rounded-[20px] p-5 border border-[#EEE6DA] h-full flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all min-h-[300px] ${className}`.trim()}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[#1C1B18]">Recent Transactions</h3>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          className="text-xs font-semibold text-[#1C1B18] hover:text-[#6C9C70] inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View all</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {transactions.length === 0 && !isInventoryLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8C867A] text-xs">
          <Inbox size={24} className="text-[#9A948A] mb-2 opacity-60" />
          <span className="font-medium text-[#1C1B18]">No transactions recorded yet</span>
          <span className="text-[11px] text-[#9A948A] mt-0.5">Inventory activity and sales will appear here.</span>
        </div>
      ) : (
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs min-w-[320px]">
            <thead>
              <tr className="text-[#9A948A] border-b border-[#EEE6DA] pb-2">
                <th className="font-normal py-2 text-left">Date</th>
                <th className="font-normal py-2 text-left">Type</th>
                <th className="font-normal py-2 text-left">Item</th>
                <th className="font-normal py-2 text-center">Qty</th>
                <th className="font-normal py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE6DA]/70">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#FAF6EF]/60 transition-colors">
                  <td className="py-2.5 text-[#6B665E] whitespace-nowrap text-[12px]">
                    {tx.date}
                  </td>
                  <td className="py-2.5 whitespace-nowrap text-[12px]">
                    <span
                      className={`font-medium ${
                        tx.type === 'Sale'
                          ? 'text-[#2E8B57]'
                          : tx.type === 'Purchase'
                          ? 'text-[#1C1B18]'
                          : tx.type === 'Stock In'
                          ? 'text-[#2E8B57]'
                          : 'text-[#D98E0B]'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold text-[#1C1B18] text-[12px] whitespace-nowrap max-w-[160px] truncate" title={tx.productName}>
                    {tx.productName}
                  </td>
                  <td className="py-2.5 text-center text-[#1C1B18] font-medium tabular-nums text-[12px]">
                    {Math.abs(tx.qtyDelta)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-[#1C1B18] tabular-nums text-[12px]">
                    {formatINR(tx.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
