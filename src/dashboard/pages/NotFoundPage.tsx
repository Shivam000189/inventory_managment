import React from 'react';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const NotFoundPage: React.FC = () => {
  const { navigate, currentUser } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-150">
      <div className="w-16 h-16 rounded-3xl bg-[#FAF6EF] text-[#6B665E] flex items-center justify-center mb-4 border border-[#EEE6DA]">
        <FileQuestion size={32} strokeWidth={1.75} />
      </div>

      <h1 className="text-2xl font-bold text-[#1C1B18] tracking-tight">
        Page Not Found (404)
      </h1>

      <p className="text-sm text-[#6B665E] max-w-md mt-2 leading-relaxed">
        The requested screen or URL route does not exist in Inventory.
      </p>

      <div className="mt-6">
        <button
          type="button"
          onClick={() =>
            navigate(currentUser.role === 'admin' ? '/app/overview' : '/app/pos')
          }
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold shadow-xs cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Back to {currentUser.role === 'admin' ? 'Overview' : 'POS'}</span>
        </button>
      </div>
    </div>
  );
};
