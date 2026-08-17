import React, { useState, useMemo } from 'react';
import {
  Project,
  GlobalTimeFilter,
  OverdueMilestoneItem,
} from '../types';
import {
  calculateFinancialSummary,
  calculate5FinancialMetrics,
  Financial5Metrics,
  calculateCostGroupBreakdown,
  calculateProjectBreakdown,
  calculateMonthlyCashflowSeries,
  formatBillionVN,
  formatVND,
  formatDate,
  getAllOverdueMilestones,
  calculateProjectOverallProgress,
  calculateRevenueByPeriod,
  calculateProjectStatus,
  getProjectMilestoneDefs,
} from '../utils/helpers';
import { INVESTORS, COST_GROUPS } from '../data/sampleData';
import { Financial5Cards } from './Financial5Cards';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  PlusCircle,
  CreditCard,
  Building,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Landmark,
  MapPin,
  Eye,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  RotateCcw,
  Search,
  Download,
  Check,
  Coins,
  Percent,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardViewProps {
  projects: Project[];
  allProjects?: Project[];
  selectedContractId?: string;
  onSelectContract?: (id: string) => void;
  onResetContractSelection?: () => void;
  globalFilter: GlobalTimeFilter;
  onOpenAddContractModal: () => void;
  onOpenAddPaymentModal: () => void;
  onSelectCostGroup?: (cg: string) => void;
  onSelectProject?: (proj: string) => void;
  onViewProject?: (project: Project) => void;
}

type DashboardTab = 'OVERVIEW' | 'DETAIL';
type ScopeType = 'ALL' | 'PROJECT_GROUP' | 'INVESTOR_GROUP' | 'COST_GROUP' | 'SINGLE_PROJECT';

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  allProjects,
  selectedContractId = 'ALL',
  onSelectContract,
  onResetContractSelection,
  globalFilter,
  onOpenAddContractModal,
  onOpenAddPaymentModal,
  onSelectCostGroup,
  onSelectProject,
  onViewProject,
}) => {
  // 1. Tab View Mode: 'OVERVIEW' (Tổng quan) vs 'DETAIL' (Chi tiết)
  const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');

  // 2. Interactive Selection Scope
  const [selectedScopeType, setSelectedScopeType] = useState<ScopeType>('ALL');
  const [selectedScopeValue, setSelectedScopeValue] = useState<string>('ALL');

  // 3. Detail View Filters & Search
  const [detailSearch, setDetailSearch] = useState('');
  const [detailStatusFilter, setDetailStatusFilter] = useState('ALL');
  const [showAllOverdue, setShowAllOverdue] = useState(false);

  // Selected single project object (if applicable)
  const selectedSingleProject = useMemo(() => {
    const allList = allProjects && allProjects.length > 0 ? allProjects : projects;
    if (selectedContractId && selectedContractId !== 'ALL') {
      return (
        allList.find(
          (p) =>
            p.id === selectedContractId ||
            p.maCongTrinh === selectedContractId ||
            p.soHopDong === selectedContractId
        ) || null
      );
    }
    if (selectedScopeType === 'SINGLE_PROJECT') {
      return (
        allList.find(
          (p) =>
            p.id === selectedScopeValue ||
            p.maCongTrinh === selectedScopeValue ||
            p.soHopDong === selectedScopeValue
        ) || null
      );
    }
    return null;
  }, [allProjects, projects, selectedContractId, selectedScopeType, selectedScopeValue]);

  // Filter projects according to the user-selected interactive scope or selectedContractId
  const activeScopeProjects = useMemo(() => {
    if (selectedSingleProject) {
      return [selectedSingleProject];
    }
    if (selectedScopeType === 'ALL' || selectedScopeValue === 'ALL') {
      return projects;
    }
    if (selectedScopeType === 'PROJECT_GROUP') {
      return projects.filter((p) => p.duAn === selectedScopeValue);
    }
    if (selectedScopeType === 'INVESTOR_GROUP') {
      return projects.filter((p) => p.chuDauTu === selectedScopeValue);
    }
    if (selectedScopeType === 'COST_GROUP') {
      return projects.filter((p) => p.nhomChiPhi === selectedScopeValue);
    }
    return projects;
  }, [projects, selectedSingleProject, selectedScopeType, selectedScopeValue]);

  // 5 CORE FINANCIAL METRICS TRƯỚC VAT (Automatically updated upon clicking single/group/all)
  const metrics5: Financial5Metrics = useMemo(() => {
    return calculate5FinancialMetrics(activeScopeProjects);
  }, [activeScopeProjects]);

  // General Summaries & Charts
  const summary = calculateFinancialSummary(projects);
  const costGroups = calculateCostGroupBreakdown(projects);
  const projectBreakdown = calculateProjectBreakdown(projects);
  const { data: cashflowData, avgMonthly } = calculateMonthlyCashflowSeries(projects);
  const allOverdueMilestones = getAllOverdueMilestones(activeScopeProjects);

  // Revenue summary
  const revenueSummary = calculateRevenueByPeriod(
    activeScopeProjects,
    globalFilter.revenuePeriod || 'ALL'
  );

  // Reset/Clear interactive scope
  const handleSelectAll = () => {
    setSelectedScopeType('ALL');
    setSelectedScopeValue('ALL');
    if (onResetContractSelection) {
      onResetContractSelection();
    } else if (onSelectContract) {
      onSelectContract('ALL');
    }
  };

  const handleSelectProjectGroup = (projName: string) => {
    if (selectedScopeType === 'PROJECT_GROUP' && selectedScopeValue === projName) {
      handleSelectAll();
    } else {
      setSelectedScopeType('PROJECT_GROUP');
      setSelectedScopeValue(projName);
      if (onResetContractSelection) onResetContractSelection();
    }
  };

  const handleSelectCostGroup = (costGroupName: string) => {
    if (selectedScopeType === 'COST_GROUP' && selectedScopeValue === costGroupName) {
      handleSelectAll();
    } else {
      setSelectedScopeType('COST_GROUP');
      setSelectedScopeValue(costGroupName);
      if (onResetContractSelection) onResetContractSelection();
    }
  };

  const handleSelectInvestorGroup = (investorName: string) => {
    if (selectedScopeType === 'INVESTOR_GROUP' && selectedScopeValue === investorName) {
      handleSelectAll();
    } else {
      setSelectedScopeType('INVESTOR_GROUP');
      setSelectedScopeValue(investorName);
      if (onResetContractSelection) onResetContractSelection();
    }
  };

  const handleSelectSingleProject = (projectId: string) => {
    if (onSelectContract) {
      if (selectedContractId === projectId || selectedScopeValue === projectId) {
        handleSelectAll();
      } else {
        onSelectContract(projectId);
        setSelectedScopeType('SINGLE_PROJECT');
        setSelectedScopeValue(projectId);
      }
    } else {
      if (selectedScopeType === 'SINGLE_PROJECT' && selectedScopeValue === projectId) {
        handleSelectAll();
      } else {
        setSelectedScopeType('SINGLE_PROJECT');
        setSelectedScopeValue(projectId);
      }
    }
  };

  const filterYearLabel =
    globalFilter.year === 'ALL' ? 'TẤT CẢ THỜI GIAN' : `NĂM ${globalFilter.year}`;
  const filterInvestorLabel =
    globalFilter.chuDauTu && globalFilter.chuDauTu !== 'ALL' ? globalFilter.chuDauTu : 'TẤT CẢ CĐT';

  // Detail View projects with search & status filter
  const detailViewProjects = useMemo(() => {
    return projects.filter((p) => {
      // Scope filter for groups if selected (NOTE: Single project selection does NOT hide other projects in the table)
      if (selectedScopeType === 'PROJECT_GROUP' && p.duAn !== selectedScopeValue) return false;
      if (selectedScopeType === 'INVESTOR_GROUP' && p.chuDauTu !== selectedScopeValue) return false;
      if (selectedScopeType === 'COST_GROUP' && p.nhomChiPhi !== selectedScopeValue) return false;

      // Status filter
      if (detailStatusFilter !== 'ALL') {
        const st = calculateProjectStatus(p);
        if (st.key !== detailStatusFilter) return false;
      }

      // Search keyword
      if (detailSearch.trim()) {
        const q = detailSearch.toLowerCase().trim();
        const match =
          p.maCongTrinh.toLowerCase().includes(q) ||
          p.soHopDong.toLowerCase().includes(q) ||
          p.tenCongTrinh.toLowerCase().includes(q) ||
          (p.chuDauTu && p.chuDauTu.toLowerCase().includes(q)) ||
          (p.nhaThau && p.nhaThau.toLowerCase().includes(q)) ||
          (p.duAn && p.duAn.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [projects, selectedScopeType, selectedScopeValue, detailStatusFilter, detailSearch]);

  // Calculate table footer metrics representing all displayed projects in the detail table
  const tableFooterMetrics = useMemo(() => {
    return calculate5FinancialMetrics(detailViewProjects);
  }, [detailViewProjects]);


  // Export Detailed Table to Excel
  const handleExportDetailExcel = () => {
    const dataToExport = detailViewProjects.map((p, idx) => {
      const valPostVat = p.giaTriHdSauVat || 0;
      const valPreVat = p.giaTriHdTruocVat || Math.round(valPostVat / 1.1);
      const lkPostVat = p.luyKeDaChi || 0;
      const lkPreVat = Math.round(lkPostVat / 1.1);
      const ctPostVat = p.chiTraTrongKy !== undefined ? p.chiTraTrongKy : Math.round(lkPostVat * 0.7);
      const ctPreVat = Math.round(ctPostVat / 1.1);
      const lkPrevPreVat = Math.max(0, lkPreVat - ctPreVat);
      const conLaiPreVat = Math.max(0, valPreVat - lkPreVat);
      const pct = valPreVat > 0 ? ((lkPreVat / valPreVat) * 100).toFixed(2) : '0';
      const status = calculateProjectStatus(p);

      return {
        'STT': idx + 1,
        'Mã Công Trình': p.maCongTrinh,
        'Số Hợp Đồng': p.soHopDong,
        'Tên Công Trình / Gói Thầu': p.tenCongTrinh,
        'Dự Án': p.duAn,
        'Chủ Đầu Tư': p.chuDauTu || '',
        'Nhà Thầu': p.nhaThau || '',
        'Nhóm Chi Phí': p.nhomChiPhi || '',
        'Tổng GT HĐ Trước VAT (VNĐ)': valPreVat,
        'Lũy Kế TT Đến Hết Kỳ Trước Trước VAT (VNĐ)': lkPrevPreVat,
        'Lũy Kế TT Đến Hết Kỳ Này Trước VAT (VNĐ)': lkPreVat,
        'Còn Lại Chưa Thanh Toán Trước VAT (VNĐ)': conLaiPreVat,
        'Tỷ Lệ % Hoàn Thành So Với HĐ (%)': `${pct}%`,
        'Trạng Thái Kỹ Thuật': status.label,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chi_Tiet_Tai_Chinh_Truoc_VAT');
    XLSX.writeFile(
      workbook,
      `Bao_Cao_Chi_Tiet_Tai_Chinh_Truoc_VAT_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fadeIn" id="dashboard-main-container">
      {/* 1. Header Scope Bar & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs" id="dashboard-header-scope">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
              <Calendar className="w-3 h-3 text-blue-600" />
              KỲ PHÂN TÍCH: {filterYearLabel}
            </span>
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
              <Building className="w-3 h-3 text-indigo-600" />
              {projects.length} HỢP ĐỒNG / CÔNG TRÌNH
            </span>
            {globalFilter.chuDauTu && globalFilter.chuDauTu !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
                <Landmark className="w-3 h-3 text-purple-600" />
                CĐT: {filterInvestorLabel}
              </span>
            )}
            {globalFilter.diaPhuong && globalFilter.diaPhuong !== 'ALL' && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
                <MapPin className="w-3 h-3 text-rose-600" />
                {globalFilter.diaPhuong}
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            Bảng Điều Khiển Tổng Hợp: Tiến Độ Nghiệm Thu &amp; Dòng Tiền Giải Ngân
          </h2>
          <p className="text-xs text-slate-500">
            Giám sát 8 mốc nghiệm thu kỹ thuật, cảnh báo đỏ mốc trễ hạn và theo dõi 5 chỉ số tài chính trước VAT cập nhật tự động.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-add-new-contract-dash"
            onClick={onOpenAddContractModal}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nhập Hợp Đồng Mới</span>
          </button>
          <button
            id="btn-add-new-payment-dash"
            onClick={onOpenAddPaymentModal}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>+ Nhập Thanh Toán Đợt</span>
          </button>
        </div>
      </div>

      {/* 2. CHUYỂN ĐỔI 2 GIAO DIỆN: GIAO DIỆN TỔNG QUAN vs GIAO DIỆN CHI TIẾT */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3" id="dashboard-view-mode-bar">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            id="tab-btn-overview"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Giao Diện Tổng Quan</span>
          </button>

          <button
            id="tab-btn-detail"
            onClick={() => setActiveTab('DETAIL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
              activeTab === 'DETAIL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Giao Diện Chi Tiết</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'DETAIL' ? 'bg-white text-blue-700' : 'bg-slate-200 text-slate-700'
            }`}>
              {detailViewProjects.length}
            </span>
          </button>
        </div>

        {/* Quick Scope Filter Dropdowns & Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Phạm vi tính toán:
          </span>

          {/* Quick ALL Button */}
          <button
            id="btn-scope-all"
            onClick={handleSelectAll}
            className={`px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
              selectedScopeType === 'ALL'
                ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Toàn Bộ Công Trình ({projects.length})
          </button>

          {/* Select Investor Group Dropdown */}
          <select
            id="select-scope-investor-group"
            value={selectedScopeType === 'INVESTOR_GROUP' ? selectedScopeValue : 'NONE'}
            onChange={(e) => {
              if (e.target.value === 'NONE') handleSelectAll();
              else handleSelectInvestorGroup(e.target.value);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 hover:border-blue-300 focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer"
          >
            <option value="NONE">🏛️ Nhóm Chủ Đầu Tư (Chọn...)</option>
            {INVESTORS.map((inv) => (
              <option key={inv} value={inv}>
                {inv}
              </option>
            ))}
          </select>

          {/* Select Single Project Dropdown */}
          <select
            id="select-scope-single-project"
            value={selectedScopeType === 'SINGLE_PROJECT' ? selectedScopeValue : 'NONE'}
            onChange={(e) => {
              if (e.target.value === 'NONE') handleSelectAll();
              else handleSelectSingleProject(e.target.value);
            }}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 hover:border-blue-300 focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer max-w-[200px] truncate"
          >
            <option value="NONE">📑 Từng Công Trình (Chọn...)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.maCongTrinh} - {p.tenCongTrinh.slice(0, 24)}...
              </option>
            ))}
          </select>

          {/* Reset Scope Button */}
          {selectedScopeType !== 'ALL' && (
            <button
              id="btn-reset-scope"
              onClick={handleSelectAll}
              className="p-1 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-md transition cursor-pointer"
              title="Đặt lại về toàn bộ công trình"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. BỘ 5 CHỈ SỐ TÀI CHÍNH TỰ ĐỘNG CẬP NHẬT THEO HỢP ĐỒNG ĐƯỢC CHỌN HOẶC TOÀN BỘ */}
      <Financial5Cards
        projects={activeScopeProjects}
        selectedContractId={
          selectedContractId !== 'ALL'
            ? selectedContractId
            : selectedScopeType === 'SINGLE_PROJECT'
            ? selectedScopeValue
            : 'ALL'
        }
        onResetContractSelection={handleSelectAll}
      />

      {/* ========================================================================= */}
      {/* 4. GIAO DIỆN 1: GIAO DIỆN TỔNG QUAN (OVERVIEW TAB) */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 animate-fadeIn" id="dashboard-overview-tab-content">
          {/* Cảnh Báo Mốc Nghiệm Thu Quá Hạn */}
          {allOverdueMilestones.length > 0 && (
            <div className="bg-rose-50/70 border-2 border-rose-300 rounded-xl p-4 shadow-xs" id="overdue-milestones-alert-box">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-rose-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs animate-bounce">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
                      <span>CẢNH BÁO QUÁ HẠN: Phát hiện {allOverdueMilestones.length} mốc nghiệm thu vượt quá ngày dự kiến</span>
                    </h3>
                    <p className="text-[11px] text-rose-800">
                      Các mốc dưới đây đã quá ngày cam kết (hoặc ngày gia hạn) nhưng chưa có chữ ký nghiệm thu hoàn tất.
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold bg-rose-200 text-rose-900 px-2.5 py-1 rounded-md border border-rose-300">
                  🚨 Cần Ban Chỉ Huy đôn đốc xử lý gấp
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {(showAllOverdue ? allOverdueMilestones : allOverdueMilestones.slice(0, 6)).map((item, idx) => (
                  <div
                    key={`${item.project.id}_${item.milestoneKey}_${idx}`}
                    className="bg-white p-3 rounded-lg border border-rose-300 shadow-xs flex flex-col justify-between hover:border-rose-500 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded shadow-xs">
                          {item.project.soHopDong}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                          <Clock className="w-3 h-3 text-rose-600" />
                          Trễ {item.daysOverdue} ngày
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-1">
                        {item.project.tenCongTrinh}
                      </h4>
                      <div className="text-[10.5px] text-slate-600 font-medium truncate mt-0.5">
                        🏢 {item.project.duAn} {item.project.chuDauTu ? `• CĐT: ${item.project.chuDauTu}` : ''}
                      </div>

                      <div className="mt-2 p-2 bg-rose-50/80 rounded-md border border-rose-200 text-[11px]">
                        <div className="font-bold text-rose-900 flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>{item.milestoneLabel}</span>
                        </div>
                        <div className="text-[10.5px] text-slate-600 mt-0.5 flex justify-between">
                          <span>Ngày dự kiến: <strong className="text-slate-800">{formatDate(item.plannedDate)}</strong></span>
                          <span className="text-rose-700 font-bold">Chưa Ký</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleSelectSingleProject(item.project.id)}
                        className="text-[10.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded transition"
                      >
                        🎯 Lọc KPI công trình này
                      </button>

                      {onViewProject && (
                        <button
                          onClick={() => onViewProject(item.project)}
                          className="text-[10.5px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết HĐ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {allOverdueMilestones.length > 6 && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => setShowAllOverdue(!showAllOverdue)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    {showAllOverdue
                      ? 'Thu gọn danh sách cảnh báo'
                      : `Xem thêm ${allOverdueMilestones.length - 6} mốc quá hạn khác...`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Row: Phân Bổ Chi Phí & Phân Bổ Chi Trả Trong Kỳ (Donut Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Left Panel: Cơ Cấu Chi Phí */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Cơ Cấu Chi Phí Theo Nhóm
                  </h3>
                  <p className="text-[11px] text-slate-500">Tỷ trọng giá trị hợp đồng theo phân loại chi phí</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Donut Chart */}
                <div className="sm:col-span-5 relative h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costGroups}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={74}
                        paddingAngle={3}
                        dataKey="totalValue"
                      >
                        {costGroups.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${formatBillionVN(val)}`, 'Giá trị']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">TỔNG GIÁ TRỊ</span>
                    <span className="text-xs font-black text-slate-900 leading-tight">
                      {formatBillionVN(summary.tongGiaTriHdSauVat)}
                    </span>
                  </div>
                </div>

                {/* Cost Group Ranked List */}
                <div className="sm:col-span-7 space-y-1.5">
                  {costGroups.map((cg) => (
                    <div
                      key={cg.name}
                      onClick={() => {
                        setSelectedScopeType('COST_GROUP');
                        setSelectedScopeValue(cg.name);
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border text-xs ${
                        selectedScopeType === 'COST_GROUP' && selectedScopeValue === cg.name
                          ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400'
                          : 'bg-slate-50 hover:bg-blue-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cg.color }} />
                        <span className="font-semibold text-slate-800 truncate">{cg.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-bold text-slate-900">{cg.totalBillion} Tỷ</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          {cg.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel: Phân Bổ Chi Trả Trong Kỳ */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Phân Bổ Chi Trả Trong Kỳ
                  </h3>
                  <p className="text-[11px] text-slate-500">Tỷ trọng giải ngân từng dự án trong {filterYearLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Donut Chart */}
                <div className="sm:col-span-5 relative h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={74}
                        paddingAngle={3}
                        dataKey="disbursedValue"
                      >
                        {projectBreakdown.map((entry, index) => (
                          <Cell key={`proj-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${formatBillionVN(val)}`, 'Chi trả']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[9px] text-slate-400 uppercase font-bold">TỔNG CHI</span>
                    <span className="text-xs font-black text-emerald-700 leading-tight">
                      {formatBillionVN(summary.chiTraTrongKySauVat)}
                    </span>
                  </div>
                </div>

                {/* Projects Ranked List */}
                <div className="sm:col-span-7 space-y-1.5">
                  {projectBreakdown.map((proj) => (
                    <div
                      key={proj.name}
                      onClick={() => handleSelectProjectGroup(proj.name)}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer border text-xs ${
                        selectedScopeType === 'PROJECT_GROUP' && selectedScopeValue === proj.name
                          ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400'
                          : 'bg-slate-50 hover:bg-emerald-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                        <span className="font-semibold text-slate-800 truncate">{proj.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-bold text-slate-900">{proj.disbursedBillion} Tỷ</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          {proj.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Biểu đồ Dòng Tiền Giải Ngân Theo Thời Gian */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Dòng Tiền Giải Ngân Theo Thời Gian ({filterYearLabel})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Biểu đồ kết hợp Chi trả hàng tháng (Cột) &amp; Giá trị Lũy kế cộng dồn (Đường) cho toàn bộ công trình (Tỷ VNĐ)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="w-2 h-2 rounded-sm bg-blue-600" />
                  Trung bình tháng: {avgMonthly} Tỷ
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v} Tỷ`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v) => `${v} Tỷ`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} Tỷ VNĐ`,
                      name === 'chiTraThang' ? 'Chi trả trong tháng' : 'Lũy kế cộng dồn',
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
                    formatter={(value) => (value === 'chiTraThang' ? 'Chi trả tháng (Cột)' : 'Lũy kế cộng dồn (Đường)')}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="chiTraThang"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="luyKeCongDon"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GIAO DIỆN 2: GIAO DIỆN CHI TIẾT (DETAIL TABLE & MATRIX TAB) */}
      {/* ========================================================================= */}
      {activeTab === 'DETAIL' && (
        <div className="space-y-3.5 animate-fadeIn" id="dashboard-detail-tab-content">
          {/* Detail Filters & Controls Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã CT, Số HĐ, Tên gói thầu, Chủ đầu tư, Nhà thầu..."
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition"
                />
              </div>
            </div>

            {/* Status Filter & Actions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={detailStatusFilter}
                onChange={(e) => setDetailStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-300 focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái HĐ</option>
                <option value="DANG_THI_CONG">Đang Thi Công</option>
                <option value="DANG_TRINH_KY">Đang Trình Ký</option>
                <option value="CHAM_KY">🚨 Chậm Ký (&gt;7 ngày)</option>
                <option value="TRE_TIEN_DO">⚠️ Trễ Tiến Độ TGĐ</option>
                <option value="HOAN_THANH">Đã Hoàn Thành</option>
              </select>

              <button
                onClick={handleExportDetailExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel Bảng Chi Tiết</span>
              </button>
            </div>
          </div>

          {/* Detailed Financial Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800 text-xs sm:text-sm">
                  Bảng Phân Tích Chi Tiết Tài Chính &amp; Tiến Độ Từng Công Trình
                </span>
                <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {detailViewProjects.length} Công trình
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                💡 Click vào bất kỳ dòng nào để chọn công trình và cập nhật 5 chỉ số KPI phía trên
              </p>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10 border-b border-slate-200 shadow-xs font-black text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">STT</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Mã CT &amp; Số HĐ</th>
                    <th className="py-2.5 px-3 min-w-[220px]">Tên Công Trình &amp; Gói Thầu</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right bg-blue-50/70 text-blue-900 border-l border-r border-blue-100">
                      TỔNG GT HĐ<br />TRƯỚC VAT
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right bg-amber-50/70 text-amber-900 border-r border-amber-100">
                      LK HẾT KỲ TRƯỚC<br />TRƯỚC VAT
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right bg-emerald-50/70 text-emerald-900 border-r border-emerald-100">
                      LK HẾT KỲ NÀY<br />TRƯỚC VAT
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right bg-purple-50/70 text-purple-900 border-r border-purple-100">
                      CÒN LẠI CHƯA TT<br />TRƯỚC VAT
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center bg-indigo-50/70 text-indigo-900">
                      % HOÀN THÀNH<br />SO VỚI HĐ
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">Trạng Thái NT</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {detailViewProjects.map((p, idx) => {
                    const valPostVat = p.giaTriHdSauVat || 0;
                    const valPreVat = p.giaTriHdTruocVat || Math.round(valPostVat / 1.1);
                    const lkPostVat = p.luyKeDaChi || 0;
                    const lkPreVat = Math.round(lkPostVat / 1.1);
                    const ctPostVat = p.chiTraTrongKy !== undefined ? p.chiTraTrongKy : Math.round(lkPostVat * 0.7);
                    const ctPreVat = Math.round(ctPostVat / 1.1);
                    const lkPrevPreVat = Math.max(0, lkPreVat - ctPreVat);
                    const conLaiPreVat = Math.max(0, valPreVat - lkPreVat);
                    const pct = valPreVat > 0 ? parseFloat(((lkPreVat / valPreVat) * 100).toFixed(1)) : 0;
                    const status = calculateProjectStatus(p);
                    const progress = calculateProjectOverallProgress(p);
                    const isSelected = selectedScopeType === 'SINGLE_PROJECT' && selectedScopeValue === p.id;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelectSingleProject(p.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100/80 border-l-4 border-l-blue-600 font-semibold shadow-xs'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/50 hover:bg-slate-100/70'
                        }`}
                      >
                        {/* STT */}
                        <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                          {isSelected ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                              ✓
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </td>

                        {/* Mã CT & Số HĐ */}
                        <td className="py-2 px-3">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {p.maCongTrinh}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {p.soHopDong}
                          </div>
                        </td>

                        {/* Tên Công Trình & Gói Thầu */}
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {p.tenCongTrinh}
                          </div>
                          <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-blue-700 font-medium truncate max-w-[180px]">🏢 {p.duAn}</span>
                            {p.chuDauTu && (
                              <span className="text-purple-700 truncate max-w-[160px]">• CĐT: {p.chuDauTu}</span>
                            )}
                          </div>
                        </td>

                        {/* 1. TỔNG GT HĐ TRƯỚC VAT */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-950 bg-blue-50/30 border-l border-r border-blue-100">
                          {formatBillionVN(valPreVat)}
                        </td>

                        {/* 2. LK HẾT KỲ TRƯỚC TRƯỚC VAT */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-950 bg-amber-50/30 border-r border-amber-100">
                          {formatBillionVN(lkPrevPreVat)}
                        </td>

                        {/* 3. LK HẾT KỲ NÀY TRƯỚC VAT */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-950 bg-emerald-50/30 border-r border-emerald-100">
                          {formatBillionVN(lkPreVat)}
                        </td>

                        {/* 4. CÒN LẠI CHƯA TT TRƯỚC VAT */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-purple-950 bg-purple-50/30 border-r border-purple-100">
                          {formatBillionVN(conLaiPreVat)}
                        </td>

                        {/* 5. % HOÀN THÀNH SO VỚI HĐ */}
                        <td className="py-2 px-3 text-center bg-indigo-50/30">
                          <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-indigo-950">
                            <span>{pct}%</span>
                          </div>
                          <div className="w-16 mx-auto bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                            />
                          </div>
                        </td>

                        {/* Trạng Thái & 8 Mốc NT */}
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] border whitespace-nowrap ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                          <div className="text-[9.5px] text-slate-500 mt-0.5">
                            {progress.completedMilestones}/{progress.totalMilestones} mốc NT
                          </div>
                        </td>

                        {/* Thao tác */}
                        <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSelectSingleProject(p.id)}
                              className={`p-1.5 rounded transition cursor-pointer text-[10.5px] font-bold flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                              title="Chọn xem 5 chỉ số KPI cho công trình này"
                            >
                              <Check className="w-3 h-3" />
                              <span className="hidden sm:inline">{isSelected ? 'Đang chọn' : 'Chọn'}</span>
                            </button>

                            {onViewProject && (
                              <button
                                onClick={() => onViewProject(p)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                                title="Xem toàn bộ hồ sơ hợp đồng"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {detailViewProjects.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold">Không tìm thấy công trình nào phù hợp với bộ lọc hiện tại.</p>
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* SUMMARY FOOTER ROW */}
                {detailViewProjects.length > 0 && (
                  <tfoot className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300 text-xs">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-right uppercase tracking-wider">
                        TỔNG CỘNG ({detailViewProjects.length} CÔNG TRÌNH HIỂN THỊ):
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-950 bg-blue-100/50 border-l border-r border-blue-200">
                        {formatBillionVN(tableFooterMetrics.tongGiaTriHdTruocVat)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-950 bg-amber-100/50 border-r border-amber-200">
                        {formatBillionVN(tableFooterMetrics.luyKeKyTruocTruocVat)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-950 bg-emerald-100/50 border-r border-emerald-200">
                        {formatBillionVN(tableFooterMetrics.luyKeKyNayTruocVat)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-purple-950 bg-purple-100/50 border-r border-purple-200">
                        {formatBillionVN(tableFooterMetrics.conLaiChuaThanhToanTruocVat)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-indigo-950 bg-indigo-100/50">
                        {tableFooterMetrics.tyLeHoanThanh}%
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-slate-600">
                        Giá trị quy đổi VNĐ / Tỷ Đồng
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
