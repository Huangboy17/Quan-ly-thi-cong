import React, { useState, useEffect } from 'react';
import {
  Project,
  FilterStatus,
  SortOption,
  CostGroup,
  MILESTONE_DEFINITIONS,
  MilestoneInfo,
} from '../types';
import {
  calculateFinancialSummary,
  calculateProjectStatus,
  getProjectCompletionPercentage,
  getProjectMilestoneDefs,
  isMilestoneInMonth,
  formatBillionVN,
  formatVND,
  formatDate,
  formatShortDate,
} from '../utils/helpers';
import { InlineGantt } from './InlineGantt';
import { QuickMilestoneModal } from './QuickMilestoneModal';
import { QuickProgressModal } from './QuickProgressModal';
import { BulkAddProjectsModal } from './BulkAddProjectsModal';
import { BulkEditProjectsModal } from './BulkEditProjectsModal';
import { Financial5Cards } from './Financial5Cards';
import {
  Building2,
  CalendarDays,
  ChartGantt,
  GitCommitHorizontal,
  FileSpreadsheet,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  Layers,
  DollarSign,
  BarChart3,
  Sparkles,
  CheckSquare,
  Square,
  Copy,
  SlidersHorizontal,
  XCircle,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import { COST_GROUPS } from '../data/sampleData';

interface ContractsViewProps {
  projects: Project[];
  selectedContractId?: string;
  onResetContractSelection?: () => void;
  onOpenAddModal: () => void;
  onOpenImportExcelModal: () => void;
  onViewProject: (p: Project) => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  onMoveProject: (idx: number, direction: 'UP' | 'DOWN') => void;
  onOpenPaymentBatchModal: (p: Project) => void;
  onSaveProject?: (p: Project) => void;
  onBulkAdd?: (newProjects: Project[]) => void;
  onBulkDelete?: (projectIds: string[]) => void;
  onBulkUpdate?: (projectIds: string[], updates: Partial<Project>) => void;
  onBulkDuplicate?: (projectIds: string[]) => void;
}

export type TableViewMode = 'QCQS_GANTT' | 'FINANCIAL' | 'FULL';

export const ContractsView: React.FC<ContractsViewProps> = ({
  projects,
  selectedContractId = 'ALL',
  onResetContractSelection,
  onOpenAddModal,
  onOpenImportExcelModal,
  onViewProject,
  onEditProject,
  onDeleteProject,
  onMoveProject,
  onOpenPaymentBatchModal,
  onSaveProject,
  onBulkAdd,
  onBulkDelete,
  onBulkUpdate,
  onBulkDuplicate,
}) => {
  const [viewMode, setViewMode] = useState<TableViewMode>('QCQS_GANTT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [selectedCostGroup, setSelectedCostGroup] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(15);

  // Selected row for keyboard navigation
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Batch / Bulk Selection State
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Quick Real-time Milestone Modal state
  const [quickMilestoneModalOpen, setQuickMilestoneModalOpen] = useState(false);
  const [quickMilestoneProject, setQuickMilestoneProject] = useState<Project | null>(null);
  const [quickMilestoneInfo, setQuickMilestoneInfo] = useState<MilestoneInfo | null>(null);

  // Quick Progress Modal state
  const [quickProgressModalOpen, setQuickProgressModalOpen] = useState(false);
  const [quickProgressProject, setQuickProgressProject] = useState<Project | null>(null);

  // Financial summary
  const summary = calculateFinancialSummary(projects);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedMonth, sortBy, selectedCostGroup]);

  // Filter Projects
  const filteredProjects = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchCode = p.maCongTrinh?.toLowerCase().includes(q);
      const matchNo = p.soHopDong?.toLowerCase().includes(q);
      const matchName = p.tenCongTrinh?.toLowerCase().includes(q);
      const matchContractor = p.nhaThau?.toLowerCase().includes(q);
      const matchProject = p.duAn?.toLowerCase().includes(q);
      if (!matchCode && !matchNo && !matchName && !matchContractor && !matchProject) return false;
    }

    if (selectedCostGroup !== 'ALL' && p.nhomChiPhi !== selectedCostGroup) {
      return false;
    }

    if (selectedStatus !== 'ALL') {
      const st = calculateProjectStatus(p);
      if (selectedStatus === 'HOAN_THANH' && st.key !== 'HOAN_THANH') return false;
      if (selectedStatus === 'CHAM_KY' && st.key !== 'CHAM_KY') return false;
      if (selectedStatus === 'TRE_TIEN_DO' && st.key !== 'TRE_TIEN_DO') return false;
      if (selectedStatus === 'DANG_TRINH_KY' && st.key !== 'DANG_TRINH_KY') return false;
      if (selectedStatus === 'GIA_HAN' && st.key !== 'GIA_HAN') return false;
      if (selectedStatus === 'DANG_THI_CONG' && st.key !== 'DANG_THI_CONG') return false;
    }

    if (selectedMonth && selectedMonth !== 'ALL') {
      const targetMonth = parseInt(selectedMonth, 10);
      const m = p.milestones || {};
      const defs = getProjectMilestoneDefs(p);
      const hasMonthInMilestones = defs.some((def) => isMilestoneInMonth(m[def.key], selectedMonth));
      const hasMonthInDates =
        [p.tienDoHopDong, p.tienDoTgdDuyet, p.tienDoThucTe, p.ngayHopDong].some((d) => {
          if (!d) return false;
          const clean = d.split('T')[0];
          if (clean.includes('-')) {
            const parts = clean.split('-');
            const mNum = parseInt(parts[0].length === 4 ? parts[1] : parts[1], 10);
            return mNum === targetMonth;
          }
          return false;
        });

      if (!hasMonthInMilestones && !hasMonthInDates) return false;
    }

    return true;
  });

  // Sort Projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'VALUE_DESC') return (b.giaTriHdSauVat || 0) - (a.giaTriHdSauVat || 0);
    if (sortBy === 'VALUE_ASC') return (a.giaTriHdSauVat || 0) - (b.giaTriHdSauVat || 0);
    if (sortBy === 'COMPLETION_DESC')
      return getProjectCompletionPercentage(b) - getProjectCompletionPercentage(a);
    if (sortBy === 'COMPLETION_ASC')
      return getProjectCompletionPercentage(a) - getProjectCompletionPercentage(b);
    if (sortBy === 'MOST_DELAYED') {
      const stA = calculateProjectStatus(a);
      const stB = calculateProjectStatus(b);
      if (stA.key === 'CHAM_KY' && stB.key !== 'CHAM_KY') return -1;
      if (stB.key === 'CHAM_KY' && stA.key !== 'CHAM_KY') return 1;
    }
    return 0;
  });

  // Pagination calculation
  const totalItems = sortedProjects.length;
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = pageSize === 'ALL' ? 0 : (validCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(totalItems, startIndex + effectivePageSize);
  const paginatedProjects = sortedProjects.slice(startIndex, endIndex);

  // Status counts for footer
  let completedCount = 0;
  let lateCount = 0;
  let inProgressCount = 0;

  projects.forEach((p) => {
    const status = calculateProjectStatus(p);
    if (status.key === 'HOAN_THANH') completedCount++;
    else if (status.key === 'CHAM_KY') lateCount++;
    else inProgressCount++;
  });

  // Selection Logic
  const isRowSelected = (id: string) => selectedProjectIds.includes(id);

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const paginatedIds = paginatedProjects.map((p) => p.id);
  const isAllPageSelected =
    paginatedIds.length > 0 && paginatedIds.every((id) => selectedProjectIds.includes(id));
  const isSomePageSelected =
    paginatedIds.some((id) => selectedProjectIds.includes(id)) && !isAllPageSelected;

  const toggleSelectAllOnPage = () => {
    if (isAllPageSelected) {
      setSelectedProjectIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      const next = Array.from(new Set([...selectedProjectIds, ...paginatedIds]));
      setSelectedProjectIds(next);
    }
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredProjects.map((p) => p.id);
    setSelectedProjectIds(allFilteredIds);
  };

  const selectByStatus = (statusKey: FilterStatus) => {
    const matched = filteredProjects
      .filter((p) => {
        const st = calculateProjectStatus(p);
        return st.key === statusKey;
      })
      .map((p) => p.id);
    setSelectedProjectIds(Array.from(new Set([...selectedProjectIds, ...matched])));
  };

  const clearSelection = () => {
    setSelectedProjectIds([]);
  };

  const selectedProjects = projects.filter((p) => selectedProjectIds.includes(p.id));
  const selectedTotalValue = selectedProjects.reduce(
    (sum, p) => sum + (p.giaTriHdSauVat || 0),
    0
  );

  const handleBulkAdd = (newItems: Project[]) => {
    if (onBulkAdd) {
      onBulkAdd(newItems);
    }
  };

  const handleExecuteBulkDelete = () => {
    if (onBulkDelete && selectedProjectIds.length > 0) {
      onBulkDelete(selectedProjectIds);
      setSelectedProjectIds([]);
      setIsBulkDeleteConfirmOpen(false);
    }
  };

  const handleBulkDuplicate = () => {
    if (onBulkDuplicate && selectedProjectIds.length > 0) {
      onBulkDuplicate(selectedProjectIds);
      setSelectedProjectIds([]);
    }
  };

  // Keyboard navigation support (Arrow Up / Down)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedRowIndex === null) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.shiftKey || e.ctrlKey) {
        const globalIdx = startIndex + selectedRowIndex;
        if (globalIdx > 0) {
          onMoveProject(globalIdx, 'UP');
          if (selectedRowIndex > 0) setSelectedRowIndex(selectedRowIndex - 1);
        }
      } else {
        if (selectedRowIndex > 0) {
          setSelectedRowIndex(selectedRowIndex - 1);
        } else if (validCurrentPage > 1) {
          setCurrentPage(validCurrentPage - 1);
          setSelectedRowIndex(effectivePageSize - 1);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (e.shiftKey || e.ctrlKey) {
        const globalIdx = startIndex + selectedRowIndex;
        if (globalIdx < totalItems - 1) {
          onMoveProject(globalIdx, 'DOWN');
          if (selectedRowIndex < paginatedProjects.length - 1) setSelectedRowIndex(selectedRowIndex + 1);
        }
      } else {
        if (selectedRowIndex < paginatedProjects.length - 1) {
          setSelectedRowIndex(selectedRowIndex + 1);
        } else if (validCurrentPage < totalPages) {
          setCurrentPage(validCurrentPage + 1);
          setSelectedRowIndex(0);
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedMonth('ALL');
    setSortBy('DEFAULT');
    setSelectedCostGroup('ALL');
  };

  const handleOpenMilestoneQuickEdit = (p: Project, milestoneDef: MilestoneInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickMilestoneProject(p);
    setQuickMilestoneInfo(milestoneDef);
    setQuickMilestoneModalOpen(true);
  };

  const handleOpenProgressQuickEdit = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickProgressProject(p);
    setQuickProgressModalOpen(true);
  };

  const handleSaveRealtime = (updatedProject: Project) => {
    if (onSaveProject) {
      onSaveProject(updatedProject);
    }
  };

  return (
    <div
      className="space-y-3.5 text-slate-800 animate-fadeIn outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* 1. Header Row (Title & Action Buttons) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            [CVB]_P.QCQS ME-CK: THEO DÕI NGHIỆM THU - THANH TOÁN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hợp đồng, 8 điểm dừng nghiệm thu QCQS, thêm/bớt/xóa hàng loạt và cập nhật tiến độ theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('QCQS_GANTT')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'QCQS_GANTT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Chuẩn Hình Ảnh QCQS</span>
            </button>
            <button
              onClick={() => setViewMode('FINANCIAL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'FINANCIAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Dòng Tiền & Tài Chính</span>
            </button>
            <button
              onClick={() => setViewMode('FULL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'FULL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Toàn Diện</span>
            </button>
          </div>

          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Thêm nhanh nhiều hợp đồng qua bảng đa dòng hoặc tạo theo mẫu dự án"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-200" />
            <span>+ Thêm Hàng Loạt</span>
          </button>

          <button
            onClick={onOpenImportExcelModal}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nhập Hợp Đồng Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Bộ 5 Thẻ Chỉ Số Tài Chính Trước VAT (Tự Động Theo Hợp Đồng Được Chọn Hoặc Toàn Bộ) */}
      <Financial5Cards
        projects={filteredProjects}
        selectedContractId={selectedContractId}
        onResetContractSelection={onResetContractSelection}
        title="5 THẺ CHỈ SỐ TÀI CHÍNH TRƯỚC VAT"
      />

      {/* 3. Top Filter Controls Matching Provided Screenshot */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
        {/* Row 1: Search, Filter dropdowns, Reset button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-[340px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm Mã CT, Số Hợp Đồng, Tên Công Trình..."
                className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-bold">🏷️ BỘ LỌC:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FilterStatus)}
                className="bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="DANG_THI_CONG">Đang Thi Công</option>
                <option value="DANG_TRINH_KY">⏳ Đang Trình Ký</option>
                <option value="CHAM_KY">🚨 Chậm Ký (&gt;7 ngày)</option>
                <option value="TRE_TIEN_DO">⚠️ Trễ Tiến Độ TGĐ</option>
                <option value="GIA_HAN">🔄 Có Gia Hạn NT</option>
                <option value="HOAN_THANH">✅ Đã Hoàn Thành</option>
              </select>
            </div>

            {/* Month Select */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-bold">📅 Tháng NT:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">-- Tất cả tháng NT --</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m.toString()}>
                    Tháng {m < 10 ? `0${m}` : m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Side: Sort Option & Reset */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] font-bold">✨ Sắp Xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="DEFAULT">⚡ Tùy chỉnh / Mặc định (Thứ tự sắp đặt)</option>
                <option value="MOST_DELAYED">🚨 Ưu tiên chậm ký / Trễ hạn</option>
                <option value="VALUE_DESC">Giá trị HĐ (Cao → Thấp)</option>
                <option value="VALUE_ASC">Giá trị HĐ (Thấp → Cao)</option>
                <option value="COMPLETION_DESC">Tiến độ (%) (Cao → Thấp)</option>
                <option value="COMPLETION_ASC">Tiến độ (%) (Thấp → Cao)</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 flex items-center gap-1 transition cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Row 2: Quick Month Selection Bar Matching Screenshot */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-600 font-bold whitespace-nowrap text-[11px] flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" /> Lọc nhanh Tháng NT:
          </span>
          <button
            onClick={() => setSelectedMonth('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
              selectedMonth === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Tất cả tháng
          </button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const isSelected = selectedMonth === m.toString();
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(isSelected ? 'ALL' : m.toString())}
                className={`px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Tháng {m < 10 ? `0${m}` : m}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.5. Sticky / Floating Batch Actions Toolbar */}
      {selectedProjectIds.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 rounded-xl shadow-lg border border-indigo-500/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-black px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
                <CheckSquare className="w-3.5 h-3.5" />
                ĐÃ CHỌN: {selectedProjectIds.length} HỢP ĐỒNG
              </span>
              <span className="text-xs text-indigo-200">
                (Tổng giá trị: <strong className="text-amber-300 font-mono font-bold">{formatBillionVN(selectedTotalValue)}</strong>)
              </span>
            </div>

            {/* Quick selection helpers */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-[11px] text-slate-400">Chọn nhanh:</span>
              <button
                onClick={selectAllFiltered}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition cursor-pointer"
              >
                Tất cả ({totalItems})
              </button>
              <button
                onClick={() => selectByStatus('CHAM_KY')}
                className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded text-[11px] border border-rose-800 transition cursor-pointer"
              >
                Chậm ký
              </button>
              <button
                onClick={() => selectByStatus('DANG_THI_CONG')}
                className="px-2 py-0.5 bg-blue-950/80 hover:bg-blue-900 text-blue-200 rounded text-[11px] border border-blue-800 transition cursor-pointer"
              >
                Đang thi công
              </button>
            </div>
          </div>

          {/* Action buttons on selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsBulkEditModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Cập nhật hàng loạt trường thông tin cho các HĐ đã chọn"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sửa Hàng Loạt ({selectedProjectIds.length})</span>
            </button>

            <button
              onClick={handleBulkDuplicate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Nhân bản các hợp đồng đã chọn"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Nhân Bản</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Xóa vĩnh viễn các hợp đồng đã chọn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedProjectIds.length})</span>
            </button>

            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Hủy chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Master Table Matching Screenshot Exactly */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[620px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-xs text-left text-slate-700 border-collapse min-w-[2100px]">
            <thead className="bg-slate-900 text-slate-200 uppercase text-[11px] font-bold sticky top-0 z-20 shadow-md">
              <tr>
                {/* Checkbox Select All Column */}
                <th className="p-3 text-center w-12 border-b border-slate-800 select-none">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomePageSelected;
                      }}
                      onChange={toggleSelectAllOnPage}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                      title={isAllPageSelected ? 'Bỏ chọn cả trang' : 'Chọn toàn bộ hợp đồng trên trang này'}
                    />
                  </div>
                </th>

                {/* STT */}
                <th className="p-3 text-center w-16 border-b border-slate-800 select-none">
                  <div className="flex items-center justify-center gap-1">
                    <span>STT</span>
                    <span className="text-[9px] text-slate-400 font-normal">↕</span>
                  </div>
                </th>

                {/* PHẦN 1: THÔNG TIN CHUNG DỰ ÁN (Merged Cột Số HĐ + Tên HĐ/Công Trình) */}
                <th className="p-3 w-[390px] border-b border-slate-800 bg-blue-950/90 text-blue-200 border-r border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                      PHẦN 1
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> THÔNG TIN CHUNG DỰ ÁN
                    </span>
                  </div>
                </th>

                {/* PHẦN 2: CÁC THỜI GIAN: HD | TGĐ | THỰC TẾ */}
                <th className="p-3 w-56 border-b border-slate-800 bg-indigo-950/90 text-indigo-200 text-center border-r border-slate-700">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="bg-indigo-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                      PHẦN 2
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> CÁC THỜI GIAN
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 font-normal">
                    <span>HĐ</span>
                    <span>TGĐ</span>
                    <span>Thực tế</span>
                  </div>
                </th>

                {/* Financial Columns (if in FINANCIAL or FULL mode) */}
                {(viewMode === 'FINANCIAL' || viewMode === 'FULL') && (
                  <>
                    <th className="p-3 w-40 border-b border-slate-800 text-right text-blue-300 border-r border-slate-700">
                      GIÁ TRỊ HĐ (SAU VAT)
                    </th>
                    <th className="p-3 w-36 border-b border-slate-800 text-right text-emerald-300 border-r border-slate-700">
                      LŨY KẾ ĐÃ CHI
                    </th>
                    <th className="p-3 w-36 border-b border-slate-800 text-right text-amber-300 border-r border-slate-700">
                      CÒN LẠI CHƯA CHI
                    </th>
                  </>
                )}

                {/* PHẦN 3: GANTT BAR: HĐ -> ĐỢT 3 */}
                {(viewMode === 'QCQS_GANTT' || viewMode === 'FULL') && (
                  <th className="p-3 w-[370px] border-b border-slate-800 bg-purple-950/90 text-purple-200 border-r border-slate-700">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                          PHẦN 3
                        </span>
                        <span className="flex items-center gap-1">
                          <ChartGantt className="w-3.5 h-3.5" /> Gantt Bar: HĐ ➔ Đợt 3
                        </span>
                      </div>
                      <span className="text-[9.5px] text-purple-300 font-bold bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-600/50">
                        HĐ, M1, M2, M3
                      </span>
                    </div>
                  </th>
                )}

                {/* PHẦN 4: 8 ĐIỂM DỪNG NGHIỆM THU */}
                {(viewMode === 'QCQS_GANTT' || viewMode === 'FULL') && (
                  <th className="p-3 border-b border-slate-800 bg-emerald-950/90 text-emerald-200">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                          PHẦN 4
                        </span>
                        <span className="flex items-center gap-1">
                          <GitCommitHorizontal className="w-3.5 h-3.5" /> 8 Điểm Dừng Nghiệm Thu Chuẩn QCQS ME-CK
                        </span>
                      </div>
                      <span className="text-[10px] text-red-200 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-600/50 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Chạm mốc để cập nhật real-time
                      </span>
                    </div>
                  </th>
                )}

                {/* THAO TÁC */}
                <th className="p-3 w-28 border-b border-slate-800 text-center sticky right-0 bg-slate-900 z-20 shadow-left select-none">
                  Thao Tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      Không tìm thấy công trình phù hợp với bộ lọc.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p, index) => {
                  const globalIndex = startIndex + index;
                  const isFirst = globalIndex === 0;
                  const isLast = globalIndex === totalItems - 1;
                  const isSelected = selectedRowIndex === index;

                  const statusObj = calculateProjectStatus(p);
                  const m = p.milestones || {};
                  const completionPct = getProjectCompletionPercentage(p);
                  const projectDefs = getProjectMilestoneDefs(p);

                  // Count signed milestones
                  let signedCount = 0;
                  projectDefs.forEach((def) => {
                    if (m[def.key]?.ngayKy) signedCount++;
                  });

                  // Find active milestone (first unsigned)
                  let activeMilestoneIndex = -1;
                  for (let i = 0; i < projectDefs.length; i++) {
                    const key = projectDefs[i].key;
                    const data = m[key] || {};
                    if (!data.ngayKy) {
                      activeMilestoneIndex = i;
                      break;
                    }
                  }

                  // Render Milestone Cards
                  const milestoneCards = projectDefs.map((item, idx) => {
                    const data = m[item.key] || {};
                    const isSigned = !!data.ngayKy;
                    const isSubmitting = !!data.ngayTrinh && !data.ngayKy;
                    const isActive = idx === activeMilestoneIndex;
                    const isMonthMatch =
                      selectedMonth && selectedMonth !== 'ALL' && isMilestoneInMonth(data, selectedMonth);

                    let cardBorder = 'border-slate-200 bg-white text-slate-600 hover:border-slate-400';
                    let badgeColor = 'bg-slate-100 text-slate-600';

                    if (isSigned) {
                      cardBorder =
                        'border-emerald-300 bg-emerald-50/60 text-emerald-900 hover:border-emerald-500';
                      badgeColor = 'bg-emerald-600 text-white';
                    } else if (isSubmitting || isActive) {
                      // Bất kỳ mốc đang trình hồ sơ hoặc là mốc active hiện tại đều XOAY ĐỎ TRẠNG THÁI
                      cardBorder =
                        'border-red-500 bg-red-50/90 text-red-950 ring-2 ring-red-500 shadow-md animate-pulse hover:border-red-600';
                      badgeColor = 'bg-red-600 text-white font-bold';
                    }

                    if (isMonthMatch) {
                      cardBorder += ' ring-2 ring-emerald-500 shadow-md bg-emerald-50/80';
                    }

                    const dotLabel = item.label.includes(':')
                      ? item.label.split(':')[0].trim()
                      : `Đợt ${idx + 1}`;
                    const titleText = item.label.includes(':')
                      ? item.label.split(':')[1].trim()
                      : item.label;

                    const ntVal = formatShortDate(data.nt_tgd || data.nt_hd);
                    const trinhVal = formatShortDate(data.ngayTrinh);
                    const kyVal = formatShortDate(data.ngayKy);

                    return (
                      <div
                        key={item.key}
                        onClick={(e) => handleOpenMilestoneQuickEdit(p, item, e)}
                        className={`p-2 rounded-lg border ${cardBorder} flex flex-col justify-between gap-1 min-w-[135px] shadow-xs relative cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group/card`}
                        title={`Nhấn để cập nhật real-time mốc ${item.label}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold inline-block min-w-[42px] text-center leading-tight ${badgeColor}`}
                          >
                            {dotLabel}
                          </span>
                          {isMonthMatch && (
                            <span
                              className="text-[8.5px] bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs"
                              title="Mốc thuộc tháng NT đang chọn"
                            >
                              🎯 NT
                            </span>
                          )}
                          {(isSubmitting || isActive) && !isMonthMatch && (
                            <span className="text-[9px] text-red-700 font-extrabold uppercase flex items-center gap-0.5 px-1 py-0.5 bg-red-100 rounded border border-red-300">
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-red-600 shrink-0" />
                              {isSubmitting ? 'Trình (Active)' : 'Active'}
                            </span>
                          )}
                        </div>

                        <div className="text-[9.5px] font-bold text-slate-800 text-center py-1 border-b border-slate-200/80 min-h-[24px] flex items-center justify-center leading-tight">
                          {titleText}
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[9px] font-mono pt-1 text-center">
                          <div
                            className="bg-slate-100/90 rounded p-0.5"
                            title={`Nghiệm thu: ${formatDate(data.nt_tgd || data.nt_hd)}`}
                          >
                            <span className="block text-[8px] text-slate-500 font-sans font-bold">
                              NT
                            </span>
                            <span className="font-bold text-slate-800">
                              {ntVal === '-' ? '.../...' : ntVal}
                            </span>
                          </div>
                          {isSigned ? (
                            <div
                              className="bg-emerald-100/80 rounded p-0.5 border border-emerald-300"
                              title={`Ngày ký: ${formatDate(data.ngayKy)}`}
                            >
                              <span className="block text-[8px] text-emerald-700 font-sans font-extrabold">
                                Ký
                              </span>
                              <span className="font-extrabold text-emerald-950">
                                {kyVal === '-' ? '.../...' : kyVal}
                              </span>
                            </div>
                          ) : (
                            <div
                              className="bg-amber-100/80 rounded p-0.5 border border-amber-300"
                              title={`Ngày trình: ${formatDate(data.ngayTrinh)}`}
                            >
                              <span className="block text-[8px] text-amber-700 font-sans font-bold">
                                Trình
                              </span>
                              <span className="font-bold text-amber-950">
                                {trinhVal === '-' ? '.../...' : trinhVal}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Hover realtime hint icon */}
                        <span className="absolute bottom-1 right-1 opacity-0 group-hover/card:opacity-100 text-[8px] bg-slate-900 text-white rounded px-1 transition">
                          ✏️
                        </span>
                      </div>
                    );
                  });

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedRowIndex(index);
                      }}
                      className={`hover:bg-blue-50/40 transition-colors group cursor-pointer ${
                        isSelected || isRowSelected(p.id) ? 'bg-blue-50/80 ring-1 ring-blue-300' : ''
                      }`}
                    >
                      {/* Checkbox Selector */}
                      <td
                        className="p-2 text-center border-b border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected(p.id)}
                          onChange={() => toggleSelectRow(p.id)}
                          className="w-4 h-4 rounded text-blue-600 bg-white border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td
                        className="p-2 text-center font-bold text-slate-500 border-b border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-extrabold text-slate-700 text-xs w-5 text-right font-mono">
                            {globalIndex + 1}
                          </span>
                          <div className="flex flex-col items-center">
                            <button
                              type="button"
                              onClick={() => onMoveProject(globalIndex, 'UP')}
                              disabled={isFirst}
                              className="p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
                              title={`Di chuyển ${p.maCongTrinh} lên trên (Up)`}
                            >
                              <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveProject(globalIndex, 'DOWN')}
                              disabled={isLast}
                              className="p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
                              title={`Di chuyển ${p.maCongTrinh} xuống dưới (Down)`}
                            >
                              <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* PHẦN 1: THÔNG TIN CHUNG DỰ ÁN (Merged Số HĐ & Tên Công Trình) */}
                      <td className="p-3 border-b border-slate-200 border-r border-slate-200">
                        <div className="space-y-1.5">
                          {/* Row 1: Code & Contract Number */}
                          <div className="flex items-center justify-between">
                            <span className="font-black text-blue-700 text-xs">{p.maCongTrinh}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200">
                              {p.soHopDong}
                            </span>
                          </div>

                          {/* Row 2: Tên Công Trình */}
                          <div className="font-semibold text-slate-900 text-xs leading-tight">
                            {p.tenCongTrinh}
                          </div>

                          {/* Row 3: 8-Segment Progress Bar */}
                          <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                ⏱️ Tiến Độ 8 Mốc: <span className="text-slate-800">{signedCount}/8 Ký</span>
                              </span>
                              <span
                                className={`font-mono font-extrabold ${
                                  completionPct === 100
                                    ? 'text-emerald-600'
                                    : completionPct >= 50
                                    ? 'text-blue-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {completionPct}%
                              </span>
                            </div>

                            {/* 8-Segment visual line */}
                            <div className="w-full bg-slate-200/90 h-1.5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                              {MILESTONE_DEFINITIONS.map((def, mIdx) => {
                                const item = m[def.key] || {};
                                const isSigned = !!item.ngayKy;
                                const isSubmitting = !!item.ngayTrinh && !item.ngayKy;
                                const isActive = mIdx === activeMilestoneIndex;

                                let segBg = 'bg-slate-300';
                                if (isSigned) segBg = 'bg-emerald-500';
                                else if (isActive) segBg = 'bg-red-500 animate-pulse';
                                else if (isSubmitting) segBg = 'bg-amber-400';

                                return (
                                  <div
                                    key={def.key}
                                    className={`h-full flex-1 rounded-xs transition-all ${segBg}`}
                                    title={`Mốc ${mIdx + 1}: ${def.label} — ${
                                      isSigned ? 'Đã ký' : isActive ? 'Active (Đang làm)' : isSubmitting ? 'Đã trình' : 'Chưa đến'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Row 4: Ngày HĐ & Status badge */}
                          <div className="flex items-center justify-between gap-1.5 text-[10px] text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-blue-500" /> HD: {formatDate(p.ngayHopDong)}
                            </span>
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusObj.badgeClass}`}>
                              {statusObj.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PHẦN 2: CÁC THỜI GIAN: HD | TGĐ | THỰC TẾ */}
                      <td
                        className="p-3 border-b border-slate-200 border-r border-slate-200 text-center cursor-pointer group/time hover:bg-indigo-50/30 transition"
                        onClick={(e) => handleOpenProgressQuickEdit(p, e)}
                        title="Nhấn để sửa nhanh tiến độ HĐ - TGĐ - Thực tế"
                      >
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                          <div className="bg-slate-50 p-1 rounded border border-slate-200 group-hover/time:border-slate-300" title="Thời gian Hợp đồng">
                            <span className="block text-[8px] text-slate-500 font-sans font-bold">HĐ</span>
                            <span className="font-bold text-slate-800">{formatShortDate(p.tienDoHopDong)}</span>
                          </div>
                          <div className="bg-blue-50/80 p-1 rounded border border-blue-200 group-hover/time:border-blue-300" title="Thời gian TGĐ Duyệt">
                            <span className="block text-[8px] text-blue-600 font-sans font-bold">TGĐ</span>
                            <span className="font-bold text-blue-800">{formatShortDate(p.tienDoTgdDuyet)}</span>
                          </div>
                          <div className="bg-emerald-50/80 p-1 rounded border border-emerald-200 group-hover/time:border-emerald-300" title="Thời gian Thực tế">
                            <span className="block text-[8px] text-emerald-600 font-sans font-bold">Thực tế</span>
                            <span className="font-bold text-emerald-800">{formatShortDate(p.tienDoThucTe)}</span>
                          </div>
                        </div>
                        <div className="text-[8.5px] text-slate-400 mt-1 opacity-0 group-hover/time:opacity-100 transition">
                          ✏️ Sửa tiến độ
                        </div>
                      </td>

                      {/* Financial Values (If viewMode is FINANCIAL or FULL) */}
                      {(viewMode === 'FINANCIAL' || viewMode === 'FULL') && (
                        <>
                          <td className="p-3 border-b border-slate-200 border-r border-slate-200 text-right font-mono font-bold text-blue-900 text-xs">
                            {formatBillionVN(p.giaTriHdSauVat)}
                            <div className="text-[9.5px] text-slate-500 font-normal">
                              {formatVND(p.giaTriHdSauVat)}
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-200 border-r border-slate-200 text-right font-mono font-bold text-emerald-700 text-xs">
                            {formatBillionVN(p.luyKeDaChi)}
                            <div className="text-[9.5px] text-slate-500 font-normal">
                              {p.giaTriHdSauVat > 0
                                ? Math.round(((p.luyKeDaChi || 0) / p.giaTriHdSauVat) * 100)
                                : 0}
                              % giá trị
                            </div>
                          </td>
                          <td className="p-3 border-b border-slate-200 border-r border-slate-200 text-right font-mono font-bold text-amber-700 text-xs">
                            {formatBillionVN(Math.max(0, (p.giaTriHdSauVat || 0) - (p.luyKeDaChi || 0)))}
                          </td>
                        </>
                      )}

                      {/* PHẦN 3: GANTT BAR: HĐ -> ĐỢT 3 */}
                      {(viewMode === 'QCQS_GANTT' || viewMode === 'FULL') && (
                        <td className="p-3 border-b border-slate-200 border-r border-slate-200">
                          <InlineGantt project={p} />
                        </td>
                      )}

                      {/* PHẦN 4: 8 ĐIỂM DỪNG NGHIỆM THU */}
                      {(viewMode === 'QCQS_GANTT' || viewMode === 'FULL') && (
                        <td className="p-3 border-b border-slate-200">
                          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                            {milestoneCards}
                          </div>
                        </td>
                      )}

                      {/* THAO TÁC */}
                      <td
                        className="p-3 border-b border-slate-200 text-center sticky right-0 bg-white shadow-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewProject(p)}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition cursor-pointer"
                            title="Xem chi tiết 8 mốc"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProject(p)}
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition cursor-pointer"
                            title="Sửa toàn bộ thông tin hợp đồng"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProject(p.id)}
                            className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded transition cursor-pointer"
                            title="Xóa công trình"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Footer Pagination Bar Matching Provided Screenshot */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 select-none">
          {/* Left Info & Page Size */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">
              📊 Hiển thị <strong className="text-slate-900 font-bold">{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
              <strong className="text-slate-900 font-bold">{endIndex}</strong> trên{' '}
              <strong className="text-blue-700 font-bold">{totalItems}</strong> công trình
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-500 text-[11px]">Số hàng / trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs px-2 py-1 rounded-md border border-slate-300 focus:outline-none cursor-pointer font-medium"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="ALL">Tất cả ({totalItems})</option>
              </select>
            </div>
          </div>

          {/* Middle: Pagination Navigation */}
          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-xs mr-1">
                Trang <strong className="text-slate-800">{validCurrentPage}</strong> / {totalPages}
              </span>

              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              {/* Prev Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Number Buttons */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => {
                    return (
                      pNum === 1 ||
                      pNum === totalPages ||
                      Math.abs(pNum - validCurrentPage) <= 1
                    );
                  })
                  .map((pNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pNum - prev > 1;

                    return (
                      <React.Fragment key={pNum}>
                        {showEllipsis && <span className="px-1 text-slate-400 font-mono">...</span>}
                        <button
                          onClick={() => setCurrentPage(pNum)}
                          className={`min-w-[28px] h-7 px-2 rounded text-xs font-bold transition cursor-pointer ${
                            validCurrentPage === pNum
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {pNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-30 disabled:hover:bg-white transition cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Right: Status Counts Badges Matching Screenshot */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              🟢 Hoàn thành: {completedCount}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
              🔴 Chậm ký: {lateCount}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
              🔵 Đang thi công: {inProgressCount}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Real-time Milestone Modal */}
      <QuickMilestoneModal
        isOpen={quickMilestoneModalOpen}
        project={quickMilestoneProject}
        milestoneInfo={quickMilestoneInfo}
        onClose={() => {
          setQuickMilestoneModalOpen(false);
          setQuickMilestoneProject(null);
          setQuickMilestoneInfo(null);
        }}
        onSave={handleSaveRealtime}
      />

      {/* Quick Real-time Progress Modal */}
      <QuickProgressModal
        isOpen={quickProgressModalOpen}
        project={quickProgressProject}
        onClose={() => {
          setQuickProgressModalOpen(false);
          setQuickProgressProject(null);
        }}
        onSave={handleSaveRealtime}
      />

      {/* Bulk Add Projects Modal */}
      <BulkAddProjectsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onAddProjects={handleBulkAdd}
        existingProjectsCount={projects.length}
      />

      {/* Bulk Edit Projects Modal */}
      <BulkEditProjectsModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedProjects={selectedProjects}
        onApplyUpdates={(updates) => {
          if (onBulkUpdate) {
            onBulkUpdate(selectedProjectIds, updates);
          }
        }}
      />

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Xác nhận xóa hàng loạt ({selectedProjectIds.length} hợp đồng)
                </h3>
                <p className="text-xs text-slate-500">
                  Hành động này không thể hoàn tác. Các dữ liệu 8 mốc và tiến độ liên quan sẽ bị gỡ bỏ.
                </p>
              </div>
            </div>

            <div className="my-4 max-h-48 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 custom-scrollbar">
              <span className="font-bold text-slate-700 block mb-1">Danh sách hợp đồng sẽ xóa:</span>
              {selectedProjects.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-semibold text-slate-800">
                    {idx + 1}. <span className="font-mono text-blue-700">{p.maCongTrinh}</span> - {p.tenCongTrinh}
                  </span>
                  <span className="font-mono text-amber-700 font-bold shrink-0 ml-2">
                    {formatBillionVN(p.giaTriHdSauVat || 0)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa {selectedProjectIds.length} hợp đồng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
