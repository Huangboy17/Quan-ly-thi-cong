import React from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  X,
  BarChart2,
  Sparkles,
  Calendar,
  Building,
  Landmark,
  MapPin,
  Clock,
} from 'lucide-react';
import { FilterStatus, SortOption } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (status: FilterStatus) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: { value: string; label: string }[];
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  selectedQuartile?: string | null;
  onClearQuartile?: () => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedMonth,
  onMonthChange,
  availableMonths,
  sortBy,
  onSortChange,
  selectedQuartile,
  onClearQuartile,
  onReset,
}) => {
  const currentSelectedMonthLabel =
    availableMonths.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  return (
    <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 flex flex-col gap-2.5">
      {/* Top row: Search input & Status, Month, Sort */}
      <div className="flex flex-col lg:flex-row gap-2.5 justify-between items-center">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm Mã CT, Số HĐ, Tên Công Trình, CĐT..."
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {selectedQuartile && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-300 flex items-center gap-1.5 animate-fadeIn">
              <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Quartile: {selectedQuartile}</span>
              <button
                onClick={onClearQuartile}
                className="hover:bg-blue-200 rounded p-0.5 transition cursor-pointer text-blue-900"
                title="Bỏ lọc Quartile"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedMonth !== 'ALL' && (
            <span className="bg-emerald-100 text-emerald-900 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1.5 animate-fadeIn">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Lọc NT: {currentSelectedMonthLabel}</span>
              <button
                onClick={() => onMonthChange('ALL')}
                className="hover:bg-emerald-200 rounded p-0.5 transition cursor-pointer text-emerald-950"
                title="Bỏ lọc Tháng NT"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {/* Trạng thái QCQS */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as FilterStatus)}
            className="border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-700 cursor-pointer max-w-[200px]"
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="CHAM_KY">🚨 Chậm Ký Hồ Sơ (&gt;7 ngày)</option>
            <option value="TRE_TIEN_DO">⚠️ Trễ Tiến Độ TGĐ</option>
            <option value="GIA_HAN">🔄 Đang Có Gia Hạn NT</option>
            <option value="DANG_TRINH_KY">⏳ Đang Trình Ký</option>
            <option value="HOAN_THANH">✅ Đã Hoàn Thành Thanh Lý</option>
            <option value="DANG_THI_CONG">🏗️ Đang Thi Công Bình Thường</option>
          </select>

          {/* Sắp xếp thông minh */}
          <div className="flex items-center gap-1 bg-indigo-50/80 border border-indigo-200 rounded-lg px-2 py-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs outline-none font-bold text-indigo-900 cursor-pointer"
            >
              <option value="DEFAULT">⚡ Thứ tự mặc định</option>
              <option value="MOST_DELAYED">🚨 Ưu tiên: Chậm ký &amp; Trễ nhiều nhất</option>
              <option value="COMPLETION_DESC">📈 Tiến độ NT cao nhất (100% → 0%)</option>
              <option value="COMPLETION_ASC">📉 Tiến độ NT thấp nhất (0% → 100%)</option>
              <option value="UPDATED_RECENT">🕒 Vừa cập nhật gần đây</option>
              <option value="CODE_ASC">🔤 Theo Mã Công Trình (A-Z)</option>
            </select>
          </div>

          <button
            onClick={onReset}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border border-slate-300"
            title="Đặt lại toàn bộ tìm kiếm &amp; bộ lọc"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Thanh chọn nhanh Tháng NT xử lý gọn đẹp, phân bố đều theo tháng */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lọc nhanh Tháng NT (2026):</span>
        </div>

        <div className="flex items-center gap-1 shrink-0 overflow-x-auto py-0.5">
          <button
            onClick={() => onMonthChange('ALL')}
            className={`text-[10.5px] px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer whitespace-nowrap border ${
              selectedMonth === 'ALL'
                ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            Tất cả
          </button>
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const).map((mNum) => {
            const ymVal = `2026-${String(mNum).padStart(2, '0')}`;
            const isSelected = selectedMonth === ymVal;
            return (
              <button
                key={mNum}
                onClick={() => onMonthChange(isSelected ? 'ALL' : ymVal)}
                className={`text-[10.5px] px-2 py-0.5 rounded-md font-bold transition cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-400'
                    : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                }`}
                title={`Lọc các mốc nghiệm thu trong Tháng ${mNum}/2026`}
              >
                T{mNum < 10 ? `0${mNum}` : mNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
