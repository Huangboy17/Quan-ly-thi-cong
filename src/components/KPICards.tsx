import React from 'react';
import {
  Building2,
  FileCheck2,
  FileSignature,
  ClockAlert,
  TriangleAlert,
  CalendarPlus
} from 'lucide-react';
import { FilterStatus } from '../types';

interface KPICardsProps {
  summary: {
    total: number;
    completed: number;
    signing: number;
    lateSign: number;
    delayTgd: number;
    extended: number;
  };
  activeFilter: FilterStatus;
  onSelectFilter: (filter: FilterStatus) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  summary,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total */}
      <button
        onClick={() => onSelectFilter('ALL')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'ALL'
            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Tổng Công Trình
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-slate-800">{summary.total}</span>
          <Building2 className="w-5 h-5 text-blue-500" />
        </div>
      </button>

      {/* 2. Completed */}
      <button
        onClick={() => onSelectFilter('HOAN_THANH')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'HOAN_THANH'
            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
          Hoàn Thành Thanh Lý
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-emerald-600">{summary.completed}</span>
          <FileCheck2 className="w-5 h-5 text-emerald-500" />
        </div>
      </button>

      {/* 3. Submitting */}
      <button
        onClick={() => onSelectFilter('DANG_TRINH_KY')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'DANG_TRINH_KY'
            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
          Đang Trình Ký HS
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-amber-600">{summary.signing}</span>
          <FileSignature className="w-5 h-5 text-amber-500" />
        </div>
      </button>

      {/* 4. Late Signing (>7 Days) */}
      <button
        onClick={() => onSelectFilter('CHAM_KY')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'CHAM_KY'
            ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
          🚨 Chậm Ký (&gt;7 Ngày)
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-rose-600">{summary.lateSign}</span>
          <ClockAlert className="w-5 h-5 text-rose-500 animate-pulse" />
        </div>
      </button>

      {/* 5. Delayed TGĐ */}
      <button
        onClick={() => onSelectFilter('TRE_TIEN_DO')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'TRE_TIEN_DO'
            ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
          ⚠️ Trễ Tiến Độ TGĐ
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-red-600">{summary.delayTgd}</span>
          <TriangleAlert className="w-5 h-5 text-red-500" />
        </div>
      </button>

      {/* 6. Extension L2/L3 */}
      <button
        onClick={() => onSelectFilter('GIA_HAN')}
        className={`p-3.5 rounded-xl shadow-sm border text-left flex flex-col justify-between transition cursor-pointer hover:shadow-md ${
          activeFilter === 'GIA_HAN'
            ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
          🔄 Có Gia Hạn NT (L2, L3)
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-purple-600">{summary.extended}</span>
          <CalendarPlus className="w-5 h-5 text-purple-500" />
        </div>
      </button>
    </div>
  );
};
