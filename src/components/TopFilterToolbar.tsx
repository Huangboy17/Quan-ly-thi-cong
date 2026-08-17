import React from 'react';
import {
  Calendar,
  Filter,
  Building,
  RotateCcw,
  Landmark,
  MapPin,
  TrendingUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { GlobalTimeFilter } from '../types';
import { INVESTORS, PROVINCES } from '../data/sampleData';

interface TopFilterToolbarProps {
  filter: GlobalTimeFilter;
  onChangeFilter: (newFilter: GlobalTimeFilter) => void;
  onResetFilter: () => void;
}

export const TopFilterToolbar: React.FC<TopFilterToolbarProps> = ({
  filter,
  onChangeFilter,
  onResetFilter,
}) => {
  const years = ['ALL', '2024', '2025', '2026'];
  const quarters = ['ALL', 'Q1', 'Q2', 'Q3', 'Q4'];
  const months = [
    { value: 'ALL', label: 'Tất cả Tháng' },
    { value: '1', label: 'Tháng 01' },
    { value: '2', label: 'Tháng 02' },
    { value: '3', label: 'Tháng 03' },
    { value: '4', label: 'Tháng 04' },
    { value: '5', label: 'Tháng 05' },
    { value: '6', label: 'Tháng 06' },
    { value: '7', label: 'Tháng 07' },
    { value: '8', label: 'Tháng 08' },
    { value: '9', label: 'Tháng 09' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  const revenuePeriods = [
    { value: 'ALL', label: 'Toàn bộ thời gian' },
    { value: 'THIS_WEEK', label: '⚡ Doanh thu Tuần này' },
    { value: 'THIS_MONTH', label: '📅 Doanh thu Tháng này' },
    { value: 'THIS_QUARTER', label: '📊 Doanh thu Quý này' },
    { value: 'THIS_YEAR', label: '📈 Doanh thu Năm 2026' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3 sm:px-4 py-2 text-xs text-slate-700 select-none shadow-xs sticky top-0 z-20">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Side: Thời gian buttons & Lọc Tháng Gọn Đẹp */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-blue-700 text-[11px] uppercase tracking-wider pr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>KỲ PHÂN TÍCH:</span>
          </div>

          {/* Năm Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-300">
            <span className="text-[10px] text-slate-500 font-semibold px-1.5">Năm:</span>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => onChangeFilter({ ...filter, year: y })}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  filter.year === y
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {y === 'ALL' ? 'Tất cả' : y}
              </button>
            ))}
          </div>

          {/* Quý Selector */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-300">
            <span className="text-[10px] text-slate-500 font-semibold px-1.5">Quý:</span>
            {quarters.map((q) => (
              <button
                key={q}
                onClick={() => onChangeFilter({ ...filter, quarter: q })}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  filter.quarter === q
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {q === 'ALL' ? 'Tất cả' : q}
              </button>
            ))}
          </div>

          {/* Tháng NT Dropdown Gọn Đẹp */}
          <div className="flex items-center gap-1 bg-emerald-50/80 px-2 py-1 rounded-lg border border-emerald-300 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-emerald-800 font-bold hidden sm:inline">Tháng NT:</span>
            <select
              value={filter.month}
              onChange={(e) => onChangeFilter({ ...filter, month: e.target.value })}
              className="bg-transparent text-emerald-950 font-bold focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} className="text-slate-800 font-medium">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Từ - Đến Date Picker (Hiển thị gọn gàng) */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-300 text-[11px]">
            <span className="text-slate-500 font-medium">Từ:</span>
            <input
              type="date"
              value={filter.fromDate}
              onChange={(e) => onChangeFilter({ ...filter, fromDate: e.target.value })}
              className="bg-transparent text-slate-800 text-[11px] focus:outline-none cursor-pointer font-semibold"
            />
            <span className="text-slate-400 font-medium">→</span>
            <input
              type="date"
              value={filter.toDate}
              onChange={(e) => onChangeFilter({ ...filter, toDate: e.target.value })}
              className="bg-transparent text-slate-800 text-[11px] focus:outline-none cursor-pointer font-semibold"
            />
          </div>
        </div>

        {/* Right Side: Scope Dropdowns (Dự án, Chủ đầu tư, Địa phương, Doanh thu) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lọc Doanh Thu / Dòng Tiền (Thay cho Lọc Tất Cả Nhóm CP) */}
          <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-300 rounded-lg px-2 py-1 text-xs shadow-xs">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <select
              value={filter.revenuePeriod || 'ALL'}
              onChange={(e) => onChangeFilter({ ...filter, revenuePeriod: e.target.value })}
              className="bg-transparent text-amber-950 font-bold focus:outline-none cursor-pointer max-w-[175px] truncate"
              title="Lọc tổng doanh thu / giải ngân theo chu kỳ"
            >
              {revenuePeriods.map((rp) => (
                <option key={rp.value} value={rp.value} className="text-slate-800 font-medium">
                  {rp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Chủ Đầu Tư (Thay cho Nhà Thầu) */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs shadow-xs">
            <Landmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={filter.chuDauTu || 'ALL'}
              onChange={(e) => onChangeFilter({ ...filter, chuDauTu: e.target.value })}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[170px] truncate"
              title="Lọc theo Chủ Đầu Tư"
            >
              <option value="ALL">-- Tất cả Chủ Đầu Tư --</option>
              {INVESTORS.map((inv) => (
                <option key={inv} value={inv}>
                  {inv}
                </option>
              ))}
            </select>
          </div>

          {/* Địa Phương / Tỉnh Thành */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <select
              value={filter.diaPhuong || 'ALL'}
              onChange={(e) => onChangeFilter({ ...filter, diaPhuong: e.target.value })}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[140px] truncate"
              title="Lọc theo Địa Phương / Tỉnh Thành"
            >
              <option value="ALL">-- Tất cả Địa Phương --</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  📍 {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filter Button */}
          <button
            onClick={onResetFilter}
            className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-300 shadow-xs transition flex items-center gap-1 cursor-pointer font-bold"
            title="Xóa tất cả bộ lọc về mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Đặt Lại</span>
          </button>
        </div>
      </div>
    </div>
  );
};
