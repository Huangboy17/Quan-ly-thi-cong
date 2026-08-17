import React from 'react';
import {
  Building2,
  HardHat,
  Search,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  UserCheck,
  CreditCard,
  Layers,
  User,
  History,
  Moon,
  Sun,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenAddModal: () => void;
  onOpenPaymentModal: () => void;
  onExportExcel: () => void;
  onQuickExportPdf: () => void;
  onOpenPdfModal: () => void;
  isExportingPdf?: boolean;
  onResetSampleData: () => void;
  isCloudActive: boolean;
  totalProjects: number;
  userProfile?: UserProfile | null;
  onOpenUserProfileModal?: () => void;
  onOpenBchLogs?: () => void;
  isPresenceSidebarOpen?: boolean;
  onTogglePresenceSidebar?: () => void;
  activePresenceCount?: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  onOpenPaymentModal,
  onExportExcel,
  onQuickExportPdf,
  onOpenPdfModal,
  isExportingPdf = false,
  onResetSampleData,
  isCloudActive,
  totalProjects,
  userProfile,
  onOpenUserProfileModal,
  onOpenBchLogs,
  isPresenceSidebarOpen = true,
  onTogglePresenceSidebar,
  activePresenceCount = 6,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  return (
    <header className="bg-white text-slate-800 sticky top-0 z-40 border-b border-slate-200 shadow-sm backdrop-blur-md transition-colors duration-200">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow-md flex items-center justify-center text-white">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                BUILD COST • CVB
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ CSDL Realtime
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5 mt-0.5">
              [CVB]_P.QCQS ME-CK_THEO DÕI NGHIỆM THU - THANH TOÁN
            </h1>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="flex-1 min-w-[220px] max-w-[380px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo số HĐ, tên công trình, nhà thầu, dự án..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-7 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* User Identity Chip & Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap shrink-0">
          {/* Night Shift / Dark Mode Toggle Button */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 group ${
                isDarkMode
                  ? 'bg-indigo-950/90 hover:bg-indigo-900 border-indigo-700 text-amber-300 ring-1 ring-indigo-500 shadow-indigo-950/50'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
              title={
                isDarkMode
                  ? 'Đang bật chế độ ban đêm bảo vệ mắt. Bấm để chuyển sang chế độ ban ngày'
                  : 'Bật chế độ Dark Mode (Ban đêm) bảo vệ mắt khi làm việc ngoài công trường'
              }
            >
              {isDarkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span className="hidden sm:inline">Chế Độ Đêm</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded border border-amber-400/40">
                    Công Trường
                  </span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Chế Độ Sáng</span>
                </>
              )}
            </button>
          )}

          {/* Active Officers Presence Sidebar Toggle */}
          {onTogglePresenceSidebar && (
            <button
              onClick={onTogglePresenceSidebar}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 group ${
                isPresenceSidebarOpen
                  ? 'bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 text-emerald-900 ring-1 ring-emerald-400'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
              }`}
              title="Mở/Đóng thanh dọc theo dõi cán bộ đang trực tuyến & nhập liệu"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Cán Bộ Trực Tuyến</span>
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {activePresenceCount}
              </span>
            </button>
          )}

          {/* Lịch sử BCH Button */}
          {onOpenBchLogs && (
            <button
              onClick={onOpenBchLogs}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 group"
              title="Xem lịch sử Ban Chỉ Huy nhập liệu theo thời gian thực"
            >
              <History className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Lịch Sử BCH</span>
            </button>
          )}

          {/* User Profile Badge */}
          <button
            onClick={onOpenUserProfileModal}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-900 text-xs transition cursor-pointer shadow-xs active:scale-95 group"
            title="Khai báo thông tin cán bộ Ban chỉ huy nhập liệu"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              <UserCheck className="w-3 h-3" />
            </div>
            <div className="text-left hidden md:block">
              <div className="font-bold text-[11px] leading-tight truncate max-w-[130px]">
                {userProfile?.fullName || 'Khai báo BCH'}
              </div>
              <div className="text-[9.5px] text-indigo-600 truncate max-w-[130px]">
                {userProfile?.role || 'Nhập tên & Email'}
              </div>
            </div>
            <span className="md:hidden font-bold text-[11px]">BCH</span>
          </button>

          <button
            onClick={onExportExcel}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Xuất file Excel tổng hợp"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Hợp Đồng Mới</span>
          </button>

          <button
            onClick={onOpenPaymentModal}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>+ Thanh Toán</span>
          </button>

          <button
            onClick={onQuickExportPdf}
            disabled={isExportingPdf}
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Xuất nhanh báo cáo PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isExportingPdf ? 'Đang tạo...' : 'Xuất PDF'}</span>
          </button>

          <button
            onClick={onResetSampleData}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1 cursor-pointer"
            title="Khởi tạo lại 52 công trình mẫu chuẩn hóa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Nạp 52 Mẫu</span>
          </button>
        </div>
      </div>
    </header>
  );
};
