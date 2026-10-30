import React from 'react';
import { ShieldAlert, ArrowLeft, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ForbiddenPage: React.FC = () => {
  const { navigate, currentUser, switchRole } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-150">
      <div className="w-16 h-16 rounded-3xl bg-[#FDEEE3] text-[#E8772E] flex items-center justify-center mb-4 border border-[#EEE6DA]">
        <ShieldAlert size={32} strokeWidth={1.75} />
      </div>

      <h1 className="text-2xl font-bold text-[#1C1B18] tracking-tight">
        Access Restricted (403)
      </h1>

      <p className="text-sm text-[#6B665E] max-w-md mt-2 leading-relaxed">
        You are currently logged in as a <span className="font-semibold text-[#1C1B18] capitalize">{currentUser.role}</span>. Salesperson accounts are restricted exclusively to the POS terminal and sales records.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={() => navigate('/app/pos')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold shadow-xs cursor-pointer"
        >
          <ShoppingCart size={15} />
          <span>Return to POS Terminal</span>
        </button>

        <button
          type="button"
          onClick={() => switchRole('admin')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EEE6DA] bg-white text-[#1C1B18] text-xs font-semibold hover:bg-[#FAF6EF] shadow-2xs cursor-pointer"
        >
          <span>Switch to Admin Role</span>
        </button>
      </div>
    </div>
  );
};
