import React, { useState, useMemo } from 'react';
import { Project, CostGroup } from '../types';
import {
  calculateProjectStatus,
  formatBillionVN,
  formatVND,
  formatDate,
  getProjectActiveMilestone,
  getProjectMilestoneDefs,
  calculate5FinancialMetrics,
} from '../utils/helpers';
import { MAJOR_PROJECTS, PROVINCES, INVESTORS, COST_GROUPS } from '../data/sampleData';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Search,
  Filter,
  RotateCcw,
  CheckSquare,
  Sparkles,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Info,
  DollarSign,
  Briefcase,
} from 'lucide-react';

interface ProjectsOverviewViewProps {
  projects: Project[];
  onSelectProject: (projName: string) => void;
  onViewProject?: (project: Project) => void;
}

export const ProjectsOverviewView: React.FC<ProjectsOverviewViewProps> = ({
  projects,
  onSelectProject,
  onViewProject,
}) => {
  // Local filter states
  const [selectedMajorProject, setSelectedMajorProject] = useState<string>('ALL');
  const [selectedProvince, setSelectedProvince] = useState<string>('ALL');
  const [selectedInvestor, setSelectedInvestor] = useState<string>('ALL');
  const [selectedCostGroup, setSelectedCostGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected project for granular metrics & milestone focus
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filtered project list based on dropdowns & search query
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedMajorProject !== 'ALL' && p.duAn !== selectedMajorProject) return false;
      if (selectedProvince !== 'ALL' && p.diaPhuong !== selectedProvince) return false;
      if (selectedInvestor !== 'ALL' && p.chuDauTu !== selectedInvestor) return false;
      if (selectedCostGroup !== 'ALL' && p.nhomChiPhi !== selectedCostGroup) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (p.maCongTrinh || '').toLowerCase().includes(q);
        const matchName = (p.tenCongTrinh || '').toLowerCase().includes(q);
        const matchHd = (p.soHopDong || '').toLowerCase().includes(q);
        const matchContractor = (p.nhaThau || '').toLowerCase().includes(q);
        const matchProvince = (p.diaPhuong || '').toLowerCase().includes(q);
        const matchInvestor = (p.chuDauTu || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchHd && !matchContractor && !matchProvince && !matchInvestor) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedMajorProject, selectedProvince, selectedInvestor, selectedCostGroup, searchQuery]);

  // The active project object if selected
  const activeSelectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  // Target projects for 5 Financial Metrics:
  // If a single project is clicked -> calculate for that project.
  // Otherwise -> calculate for all matching filtered projects.
  const targetMetricsProjects = useMemo(() => {
    if (activeSelectedProject) {
      return [activeSelectedProject];
    }
    return filteredProjects;
  }, [activeSelectedProject, filteredProjects]);

  const metrics5 = useMemo(() => {
    return calculate5FinancialMetrics(targetMetricsProjects);
  }, [targetMetricsProjects]);

  // Active milestone calculation for selected project
  const activeMilestoneInfo = useMemo(() => {
    if (!activeSelectedProject) return null;
    return getProjectActiveMilestone(activeSelectedProject);
  }, [activeSelectedProject]);

  // Bulk milestone distribution for the entire filtered set
  const milestoneDistribution = useMemo(() => {
    const counts: Record<string, { label: string; count: number; code: string }> = {
      m1: { label: 'Đợt 1: XD_Phần thô', count: 0, code: 'M1_RAW' },
      m2: { label: 'Đợt 2: ME_Tập kết TB', count: 0, code: 'M2_ME_DELIVERY' },
      m3: { label: 'Đợt 3: XD+ME Xây lắp, T&C', count: 0, code: 'M3_ERECTION_TC' },
      m4: { label: 'Đợt 4: VH Vận hành', count: 0, code: 'M4_OPERATION' },
      m5: { label: 'Đợt 5: GPMT / PCCC', count: 0, code: 'M5_PERMITS' },
      m6: { label: 'Đợt 6: Bàn giao', count: 0, code: 'M6_HANDOVER' },
      m7: { label: 'Đợt 7: Quyết toán thanh lý', count: 0, code: 'M7_LIQUIDATION' },
      m8: { label: 'Khác / Bổ sung', count: 0, code: 'M8_OTHER' },
    };

    filteredProjects.forEach((p) => {
      const ms = getProjectActiveMilestone(p);
      if (counts[ms.currentKey]) {
        counts[ms.currentKey].count++;
      } else {
        counts['m8'].count++;
      }
    });

    return counts;
  }, [filteredProjects]);

  // 5 Major Projects Aggregates
  const majorProjectStats = useMemo(() => {
    return MAJOR_PROJECTS.map((projName) => {
      const list = projects.filter((p) => p.duAn === projName);
      let totalValue = 0;
      let totalDisbursed = 0;
      let bottleneckCount = 0;
      let completedCount = 0;

      list.forEach((p) => {
        totalValue += p.giaTriHdSauVat || 0;
        totalDisbursed += p.luyKeDaChi || 0;
        const st = calculateProjectStatus(p);
        if (st.key === 'CHAM_KY' || st.key === 'TRE_TIEN_DO') {
          bottleneckCount++;
        }
        if (st.key === 'HOAN_THANH') {
          completedCount++;
        }
      });

      const remaining = Math.max(0, totalValue - totalDisbursed);
      const disPct = totalValue > 0 ? Math.round((totalDisbursed / totalValue) * 100) : 0;

      return {
        name: projName,
        count: list.length,
        totalValue,
        totalDisbursed,
        remaining,
        disPct,
        bottleneckCount,
        completedCount,
      };
    });
  }, [projects]);

  // Handle row click selection
  const handleToggleSelectProject = (p: Project) => {
    if (selectedProjectId === p.id) {
      setSelectedProjectId(null); // Deselect
    } else {
      setSelectedProjectId(p.id); // Select
    }
  };

  const handleResetAllFilters = () => {
    setSelectedMajorProject('ALL');
    setSelectedProvince('ALL');
    setSelectedInvestor('ALL');
    setSelectedCostGroup('ALL');
    setSearchQuery('');
    setSelectedProjectId(null);
  };

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100 animate-fadeIn">
      {/* 1. Header & Quick Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Tất Cả Các Dự Án & Danh Mục Hàng Loạt Công Trình ME-CK</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tra cứu danh mục toàn diện các công trình, click chọn công trình để kiểm tra 5 chỉ số tài chính Trước VAT và Mốc nghiệm thu
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800">
              Tổng số: {filteredProjects.length}/{projects.length} Công trình
            </span>
            <button
              onClick={handleResetAllFilters}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã CT, tên, số HĐ, nhà thầu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Dự án Dropdown */}
          <div>
            <select
              value={selectedMajorProject}
              onChange={(e) => {
                setSelectedMajorProject(e.target.value);
                setSelectedProjectId(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">🏢 Tất cả 5 Dự Án Trọng Điểm</option>
              {MAJOR_PROJECTS.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Địa phương Dropdown */}
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setSelectedProjectId(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-rose-700 dark:text-rose-400"
            >
              <option value="ALL">📍 Tất cả Địa Phương / Tỉnh Thành</option>
              {PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  📍 {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Chủ Đầu Tư Dropdown */}
          <div>
            <select
              value={selectedInvestor}
              onChange={(e) => {
                setSelectedInvestor(e.target.value);
                setSelectedProjectId(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">🏛️ Tất cả Chủ Đầu Tư</option>
              {INVESTORS.map((inv) => (
                <option key={inv} value={inv}>
                  {inv}
                </option>
              ))}
            </select>
          </div>

          {/* Nhóm Chi Phí Dropdown */}
          <div>
            <select
              value={selectedCostGroup}
              onChange={(e) => {
                setSelectedCostGroup(e.target.value);
                setSelectedProjectId(null);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
            >
              <option value="ALL">📑 Tất cả Nhóm Chi Phí</option>
              {COST_GROUPS.map((cg) => (
                <option key={cg} value={cg}>
                  {cg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Banner Thông Báo Trạng Thái Chọn Công Trình */}
      {activeSelectedProject ? (
        <div className="bg-indigo-900 text-white p-3.5 rounded-xl border border-indigo-700 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-700/80 rounded-lg border border-indigo-500 text-indigo-200">
              <CheckSquare className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                  ĐANG CHỌN CÔNG TRÌNH
                </span>
                <span className="font-mono font-bold text-indigo-200 text-xs">
                  {activeSelectedProject.maCongTrinh}
                </span>
                <span className="text-xs text-indigo-300">|</span>
                <span className="font-semibold text-xs text-slate-200">
                  {activeSelectedProject.soHopDong}
                </span>
                {activeSelectedProject.diaPhuong && (
                  <span className="bg-rose-950/80 text-rose-300 border border-rose-700/60 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    📍 {activeSelectedProject.diaPhuong}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white mt-0.5">
                {activeSelectedProject.tenCongTrinh}
              </h3>
              <p className="text-xs text-indigo-200/90 mt-0.5">
                Dự án: <span className="font-semibold text-white">{activeSelectedProject.duAn}</span> • Chủ đầu tư: <span className="font-semibold text-white">{activeSelectedProject.chuDauTu || 'Vingroup'}</span> • Nhà thầu: <span className="font-semibold text-white">{activeSelectedProject.nhaThau}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {onViewProject && (
              <button
                onClick={() => onViewProject(activeSelectedProject)}
                className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 text-xs font-bold rounded-lg border border-indigo-600 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Hồ Sơ 8 Mốc QCQS</span>
              </button>
            )}
            <button
              onClick={() => setSelectedProjectId(null)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-black rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bỏ chọn (Xem Toàn Bộ)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Đang hiển thị tổng hợp số liệu cho <strong>toàn bộ {filteredProjects.length} công trình</strong>. <em>(Click vào một công trình bất kỳ trong danh mục bên dưới để xem 5 chỉ số và mốc nghiệm thu của riêng công trình đó)</em>
            </span>
          </div>
          <span className="text-[11px] font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 shrink-0 font-bold text-slate-700 dark:text-slate-300">
            Chế độ: Toàn Bộ Hàng Loạt
          </span>
        </div>
      )}

      {/* 3. KHU VỰC 5 THẺ CHỈ SỐ TÀI CHÍNH TRƯỚC VAT (Executive Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* CARD 1: TỔNG GT HĐ TRƯỚC VAT */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800 dark:text-blue-400">
              1. TỔNG GT HĐ TRƯỚC VAT
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-950 dark:text-blue-100 font-mono tracking-tight">
            {formatBillionVN(metrics5.tongGiaTriHdTruocVat)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
            <span>Sau VAT: {formatBillionVN(metrics5.tongGiaTriHdSauVat)}</span>
            <span className="text-blue-600 font-semibold font-mono">10% VAT</span>
          </div>
        </div>

        {/* CARD 2: LK HẾT KỲ TRƯỚC TRƯỚC VAT */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-800 dark:text-indigo-400">
              2. LK HẾT KỲ TRƯỚC (TRƯỚC VAT)
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-950 dark:text-indigo-100 font-mono tracking-tight">
            {formatBillionVN(metrics5.luyKeKyTruocTruocVat)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
            <span>Đã thanh toán các kỳ trước</span>
            <span className="text-indigo-600 font-bold font-mono">
              {metrics5.tongGiaTriHdTruocVat > 0
                ? Math.round((metrics5.luyKeKyTruocTruocVat / metrics5.tongGiaTriHdTruocVat) * 100)
                : 0}%
            </span>
          </div>
        </div>

        {/* CARD 3: LK HẾT KỲ NÀY TRƯỚC VAT */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 dark:text-emerald-400">
              3. LK HẾT KỲ NÀY (TRƯỚC VAT)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono tracking-tight">
            {formatBillionVN(metrics5.luyKeKyNayTruocVat)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
            <span>Gồm chi phát sinh kỳ này</span>
            <span className="text-emerald-600 font-bold font-mono">
              +{formatBillionVN(metrics5.chiTraTrongKyTruocVat)}
            </span>
          </div>
        </div>

        {/* CARD 4: CÒN LẠI CHƯA TT TRƯỚC VAT */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 dark:text-amber-400">
              4. CÒN LẠI CHƯA TT (TRƯỚC VAT)
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-950 dark:text-amber-100 font-mono tracking-tight">
            {formatBillionVN(metrics5.conLaiChuaThanhToanTruocVat)}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5">
            <span>Dư nợ hợp đồng còn lại</span>
            <span className="text-amber-700 font-bold font-mono">
              {metrics5.tongGiaTriHdTruocVat > 0
                ? (100 - metrics5.tyLeHoanThanh).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>

        {/* CARD 5: TỶ LỆ % HOÀN THÀNH SO VỚI HĐ */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-600"></div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-800 dark:text-teal-400">
              5. TỶ LỆ % HOÀN THÀNH SO VỚI HĐ
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-teal-950 dark:text-teal-100 font-mono">
              {metrics5.tyLeHoanThanh}%
            </span>
            <span className="text-[10px] font-semibold text-slate-500">giải ngân HĐ</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics5.tyLeHoanThanh)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Tiến độ thanh toán</span>
            <span className="font-bold text-teal-700 dark:text-teal-400">
              {metrics5.tyLeHoanThanh >= 100 ? 'Đã hoàn tất' : 'Đang thực hiện'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. CARD 6: MỐC NGHIỆM THU THUỘC MỐC NÀO (Milestone Inspection Card) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Mốc Nghiệm Thu Thuộc Mốc Nào & Trạng Thái Hồ Sơ QCQS</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeSelectedProject
                  ? `Chi tiết tiến độ 8 đợt nghiệm thu của công trình: ${activeSelectedProject.tenCongTrinh}`
                  : `Phân bố mốc nghiệm thu của toàn bộ ${filteredProjects.length} công trình đang lọc`}
              </p>
            </div>
          </div>

          {activeSelectedProject && activeMilestoneInfo && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${activeMilestoneInfo.statusBadge}`}>
                {activeMilestoneInfo.stageDescription}
              </span>
              <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                Đã xong: {activeMilestoneInfo.completedCount}/{activeMilestoneInfo.totalMilestones} Mốc ({activeMilestoneInfo.percentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Content depending on whether a single project is selected */}
        {activeSelectedProject && activeMilestoneInfo ? (
          <div className="pt-3.5 space-y-3">
            {/* Active Milestone Highlight Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-indigo-900 dark:text-indigo-300">
                  MỐC NGHIỆM THU HIỆN TẠI (THUỘC MỐC NÀO):
                </span>
                <div className="text-sm font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5">
                  <span className="bg-indigo-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    {activeMilestoneInfo.currentCode}
                  </span>
                  <span>{activeMilestoneInfo.currentLabel}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-0.5">
                  {activeMilestoneInfo.stageDescription}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                  NGÀY TRÌNH & KÝ HỒ SƠ:
                </span>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Ngày trình hồ sơ:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {formatDate(activeMilestoneInfo.ngayTrinh)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>Ngày ký hồ sơ:</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                      {formatDate(activeMilestoneInfo.ngayKy)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                  GHI CHÚ BAN CHỈ HUY:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 line-clamp-2">
                  {activeSelectedProject.ghiChu || 'Hồ sơ pháp lý & nghiệm thu ME-CK đầy đủ, tiến độ theo kế hoạch.'}
                </p>
              </div>
            </div>

            {/* Visual 8-Stage Stepper for Selected Project */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Tiến trình 8 Đợt Nghiệm Thu QCQS:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                  {activeMilestoneInfo.completedCount}/{activeMilestoneInfo.totalMilestones} Đợt hoàn tất
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {activeMilestoneInfo.milestoneList.map((mItem, idx) => {
                  let badgeBg = 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                  let icon = <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />;
                  let statusText = 'Chưa tới đợt';

                  if (mItem.isCompleted) {
                    badgeBg = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold';
                    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
                    statusText = `Đã ký: ${formatDate(mItem.ngayKy)}`;
                  } else if (mItem.isCurrent) {
                    badgeBg = 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-extrabold ring-1 ring-amber-400';
                    icon = <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />;
                    statusText = mItem.ngayTrinh ? `Đang trình (${formatDate(mItem.ngayTrinh)})` : 'Đang thi công';
                  }

                  return (
                    <div
                      key={mItem.key}
                      className={`p-2 rounded-lg border text-[11px] flex flex-col justify-between min-h-[70px] ${badgeBg}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-[10px] font-black">
                            Đợt {idx + 1}
                          </span>
                          {icon}
                        </div>
                        <div className="font-semibold line-clamp-1 text-[11px]" title={mItem.label}>
                          {mItem.code}
                        </div>
                      </div>
                      <div className="text-[9px] truncate pt-1 border-t border-slate-200/60 dark:border-slate-700/60 mt-1 opacity-90">
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Distribution of Milestones for All Projects */
          <div className="pt-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {(Object.entries(milestoneDistribution) as [string, { label: string; count: number; code: string }][]).map(([key, item], idx) => {
                return (
                  <div
                    key={key}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        Đợt {idx + 1}
                      </span>
                      <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-mono font-black text-xs px-1.5 py-0.2 rounded">
                        {item.count} CT
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1" title={item.label}>
                      {item.code}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.label.split(':')[1] || item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. DANH MỤC HÀNG LOẠT CÁC CÔNG TRÌNH (Bulk Projects Table Matrix) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Danh Mục Hàng Loạt Công Trình & Gói Thầu ME-CK ({filteredProjects.length} Công Trình)</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nhấp vào dòng bất kỳ để chọn phân tích (không ẩn các công trình khác). Dòng đang chọn sẽ được làm nổi bật.
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {selectedProjectId && (
              <button
                onClick={() => setSelectedProjectId(null)}
                className="px-2.5 py-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold rounded-lg hover:bg-indigo-200 transition cursor-pointer"
              >
                Bỏ chọn ({activeSelectedProject?.maCongTrinh})
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar max-h-[560px]">
          <table className="w-full text-left text-xs border-collapse min-w-[1250px]">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-extrabold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">Chọn</th>
                <th className="py-2.5 px-2 text-center w-12">STT</th>
                <th className="py-2.5 px-3 w-28">Mã CT & HĐ</th>
                <th className="py-2.5 px-3 min-w-[220px]">Tên Công Trình / Gói Thầu</th>
                <th className="py-2.5 px-3 w-36">Dự Án & Địa Phương</th>
                <th className="py-2.5 px-3 w-40">Chủ Đầu Tư & Nhà Thầu</th>
                <th className="py-2.5 px-3 text-right w-36 text-blue-900 dark:text-blue-300">
                  Tổng GT HĐ Trước VAT
                </th>
                <th className="py-2.5 px-3 text-right w-36 text-indigo-900 dark:text-indigo-300">
                  LK Hết Kỳ Trước Trước VAT
                </th>
                <th className="py-2.5 px-3 text-right w-36 text-emerald-900 dark:text-emerald-300">
                  LK Hết Kỳ Này Trước VAT
                </th>
                <th className="py-2.5 px-3 text-right w-36 text-amber-900 dark:text-amber-300">
                  Còn Lại Chưa TT Trước VAT
                </th>
                <th className="py-2.5 px-3 text-center w-24">
                  % Hoàn Thành
                </th>
                <th className="py-2.5 px-3 min-w-[180px]">
                  Mốc Nghiệm Thu Thuộc Mốc Nào
                </th>
                <th className="py-2.5 px-3 text-center w-20">Thao Tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    Không tìm thấy công trình nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p, idx) => {
                  const isSelected = selectedProjectId === p.id;
                  const ms = getProjectActiveMilestone(p);

                  const gtSauVat = p.giaTriHdSauVat || 0;
                  const gtTruocVat = p.giaTriHdTruocVat || Math.round(gtSauVat / 1.1);

                  const lkSauVat = p.luyKeDaChi || 0;
                  const lkKyNayTruocVat = Math.round(lkSauVat / 1.1);

                  const chiTrongKySauVat = p.chiTraTrongKy || Math.round(lkSauVat * 0.7);
                  const lkKyTruocSauVat = Math.max(0, lkSauVat - chiTrongKySauVat);
                  const lkKyTruocTruocVat = Math.round(lkKyTruocSauVat / 1.1);

                  const conLaiSauVat = Math.max(0, gtSauVat - lkSauVat);
                  const conLaiTruocVat = Math.round(conLaiSauVat / 1.1);

                  const pctHoanThanh = gtTruocVat > 0 ? parseFloat(((lkKyNayTruocVat / gtTruocVat) * 100).toFixed(1)) : 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => handleToggleSelectProject(p)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Radio / Check icon */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectProject(p)}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                      </td>

                      {/* STT */}
                      <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Mã CT & HĐ */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {p.maCongTrinh}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {p.soHopDong}
                        </div>
                      </td>

                      {/* Tên Công Trình */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={p.tenCongTrinh}>
                          {p.tenCongTrinh}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                            {p.nhomChiPhi || 'Xây dựng – Thiết bị'}
                          </span>
                        </div>
                      </td>

                      {/* Dự Án & Địa Phương */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold line-clamp-1" title={p.duAn}>
                          {p.duAn}
                        </div>
                        {p.diaPhuong && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{p.diaPhuong}</span>
                          </div>
                        )}
                      </td>

                      {/* Chủ Đầu Tư & Nhà Thầu */}
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium line-clamp-1" title={p.chuDauTu || 'Vingroup'}>
                          🏢 {p.chuDauTu || 'Vingroup'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5" title={p.nhaThau}>
                          {p.nhaThau}
                        </div>
                      </td>

                      {/* 1. Tổng GT HĐ Trước VAT */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950 dark:text-blue-200">
                        {formatBillionVN(gtTruocVat)}
                      </td>

                      {/* 2. LK Hết Kỳ Trước Trước VAT */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-950 dark:text-indigo-200">
                        {formatBillionVN(lkKyTruocTruocVat)}
                      </td>

                      {/* 3. LK Hết Kỳ Này Trước VAT */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-950 dark:text-emerald-200">
                        {formatBillionVN(lkKyNayTruocVat)}
                      </td>

                      {/* 4. Còn Lại Chưa TT Trước VAT */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-950 dark:text-amber-200">
                        {formatBillionVN(conLaiTruocVat)}
                      </td>

                      {/* 5. % Hoàn Thành So Với HĐ */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-mono font-bold text-teal-800 dark:text-teal-300">
                          {pctHoanThanh}%
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-teal-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, pctHoanThanh)}%` }}
                          />
                        </div>
                      </td>

                      {/* 6. Mốc Nghiệm Thu Thuộc Mốc Nào */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-300 font-mono text-[10px] font-black px-1.5 py-0.5 rounded">
                            {ms.currentCode}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={ms.currentLabel}>
                            {ms.currentLabel}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${ms.statusBadge}`}>
                            {ms.statusType === 'COMPLETED'
                              ? 'Đã quyết toán'
                              : ms.statusType === 'LATE'
                              ? `Chậm ký ${ms.daysInSigning} ngày`
                              : ms.statusType === 'SIGNING'
                              ? `Đang ký ${ms.daysInSigning} ngày`
                              : 'Đang thi công'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({ms.completedCount}/{ms.totalMilestones} mốc)
                          </span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {onViewProject ? (
                          <button
                            onClick={() => onViewProject(p)}
                            title="Xem chi tiết hồ sơ QCQS"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleSelectProject(p)}
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-lg text-[10px] font-bold"
                          >
                            {isSelected ? 'Bỏ' : 'Chọn'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer: TỔNG CỘNG */}
            {filteredProjects.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 sticky bottom-0 z-10 text-[11px]">
                <tr>
                  <td colSpan={6} className="py-3 px-3 uppercase tracking-wider text-right text-indigo-900 dark:text-indigo-300 font-black">
                    TỔNG CỘNG ({filteredProjects.length} CÔNG TRÌNH ĐANG HIỂN THỊ):
                  </td>
                  {/* Tổng GT Trước VAT */}
                  <td className="py-3 px-3 text-right font-mono font-black text-blue-900 dark:text-blue-300 text-xs">
                    {formatBillionVN(
                      filteredProjects.reduce((acc, p) => acc + (p.giaTriHdTruocVat || Math.round((p.giaTriHdSauVat || 0) / 1.1)), 0)
                    )}
                  </td>
                  {/* Tổng LK Trước Kỳ Trước VAT */}
                  <td className="py-3 px-3 text-right font-mono font-black text-indigo-900 dark:text-indigo-300 text-xs">
                    {formatBillionVN(
                      filteredProjects.reduce((acc, p) => {
                        const lk = p.luyKeDaChi || 0;
                        const ck = p.chiTraTrongKy || Math.round(lk * 0.7);
                        return acc + Math.round(Math.max(0, lk - ck) / 1.1);
                      }, 0)
                    )}
                  </td>
                  {/* Tổng LK Kỳ Này Trước VAT */}
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-900 dark:text-emerald-300 text-xs">
                    {formatBillionVN(
                      filteredProjects.reduce((acc, p) => acc + Math.round((p.luyKeDaChi || 0) / 1.1), 0)
                    )}
                  </td>
                  {/* Tổng Còn Lại Trước VAT */}
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-900 dark:text-amber-300 text-xs">
                    {formatBillionVN(
                      filteredProjects.reduce((acc, p) => {
                        const val = p.giaTriHdSauVat || 0;
                        const lk = p.luyKeDaChi || 0;
                        return acc + Math.round(Math.max(0, val - lk) / 1.1);
                      }, 0)
                    )}
                  </td>
                  {/* Tỷ lệ % */}
                  <td className="py-3 px-3 text-center font-mono font-black text-teal-800 dark:text-teal-300 text-xs">
                    {(() => {
                      const totalVal = filteredProjects.reduce((acc, p) => acc + (p.giaTriHdSauVat || 0), 0);
                      const totalLk = filteredProjects.reduce((acc, p) => acc + (p.luyKeDaChi || 0), 0);
                      return totalVal > 0 ? ((totalLk / totalVal) * 100).toFixed(1) : '0.0';
                    })()}%
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-slate-500 dark:text-slate-400 font-normal text-[10px]">
                    Toàn bộ danh mục ME-CK
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 6. TỔNG QUAN 5 ĐẠI DỰ ÁN TRỌNG ĐIỂM (5 Major Projects Summary Cards) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Phân Bổ Theo 5 Đại Dự Án Trọng Điểm</span>
          </h3>
          <span className="text-xs text-slate-500">Click dự án để lọc nhanh danh mục</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {majorProjectStats.map((proj) => {
            const isFilterActive = selectedMajorProject === proj.name;
            return (
              <div
                key={proj.name}
                onClick={() => {
                  if (selectedMajorProject === proj.name) {
                    setSelectedMajorProject('ALL');
                  } else {
                    setSelectedMajorProject(proj.name);
                  }
                  setSelectedProjectId(null);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isFilterActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-2" title={proj.name}>
                      {proj.name}
                    </span>
                    {proj.bottleneckCount > 0 ? (
                      <span className="text-[9px] font-bold text-rose-800 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                        {proj.bottleneckCount} trễ
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Ổn định
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] mb-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Số gói thầu:</span>
                      <strong className="font-mono text-indigo-600 dark:text-indigo-400">{proj.count} HĐ</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Tổng GT HĐ:</span>
                      <strong className="font-mono text-blue-900 dark:text-blue-300">{formatBillionVN(proj.totalValue)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Lũy kế chi:</span>
                      <strong className="font-mono text-emerald-700 dark:text-emerald-400">{formatBillionVN(proj.totalDisbursed)}</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Giải ngân</span>
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{proj.disPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, proj.disPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                  <span>{isFilterActive ? 'Đang lọc dự án này' : 'Lọc theo dự án này'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
