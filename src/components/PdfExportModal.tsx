import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Download,
  RotateCcw,
  Layers,
  Table,
  Check,
  Eye,
  Search,
  Building2,
  Filter,
} from 'lucide-react';
import { MILESTONE_DEFINITIONS, MilestoneKey, Project } from '../types';
import { PdfColumnOptions } from '../utils/exportPdf';
import { calculateProjectStatus } from '../utils/helpers';

interface PdfExportModalProps {
  isOpen: boolean;
  isExporting: boolean;
  totalProjects: number;
  projects?: Project[];
  onClose: () => void;
  onExport: (options: PdfColumnOptions, selectedProjectIds?: string[]) => void;
}

export const DEFAULT_PDF_COLUMN_OPTIONS: PdfColumnOptions = {
  includeKpi: true,
  includeCharts: true,
  showStt: true,
  showProjectInfo: true,
  showProgressStatus: true,
  showGantt: true,
  milestones: {
    m1: true,
    m2: true,
    m3: true,
    m4: true,
    m5: true,
    m6: true,
    m7: true,
    m8: true,
  },
  showGhiChu: true,
};

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  isExporting,
  totalProjects,
  projects = [],
  onClose,
  onExport,
}) => {
  const [options, setOptions] = useState<PdfColumnOptions>(DEFAULT_PDF_COLUMN_OPTIONS);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [projectMode, setProjectMode] = useState<'ALL' | 'CUSTOM'>('ALL');

  // Initialize selected projects when modal opens or projects change
  useEffect(() => {
    if (isOpen) {
      setSelectedProjectIds(projects.map((p) => p.id));
      setProjectMode('ALL');
      setProjectSearch('');
    }
  }, [isOpen, projects]);

  if (!isOpen) return null;

  const handleToggleAllMilestones = (value: boolean) => {
    setOptions((prev) => ({
      ...prev,
      milestones: {
        m1: value,
        m2: value,
        m3: value,
        m4: value,
        m5: value,
        m6: value,
        m7: value,
        m8: value,
      },
    }));
  };

  const handleToggleMilestone = (key: MilestoneKey) => {
    setOptions((prev) => ({
      ...prev,
      milestones: {
        ...prev.milestones,
        [key]: !prev.milestones[key],
      },
    }));
  };

  const handleReset = () => {
    setOptions(DEFAULT_PDF_COLUMN_OPTIONS);
    setSelectedProjectIds(projects.map((p) => p.id));
    setProjectMode('ALL');
    setProjectSearch('');
  };

  const handleSelectPresetSummary = () => {
    setOptions({
      includeKpi: true,
      includeCharts: false,
      showStt: true,
      showProjectInfo: true,
      showProgressStatus: true,
      showGantt: true,
      milestones: {
        m1: false,
        m2: false,
        m3: false,
        m4: false,
        m5: false,
        m6: false,
        m7: false,
        m8: false,
      },
      showGhiChu: true,
    });
  };

  const activeMilestoneCount = Object.values(options.milestones).filter(Boolean).length;

  // Project selection helpers
  const filteredProjectList = projects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase();
    return (
      p.tenCongTrinh.toLowerCase().includes(q) ||
      p.maCongTrinh.toLowerCase().includes(q) ||
      (p.soHopDong && p.soHopDong.toLowerCase().includes(q))
    );
  });

  const handleToggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const effectiveExportCount = projectMode === 'ALL' ? projects.length : selectedProjectIds.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectMode === 'CUSTOM' && selectedProjectIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 công trình để xuất PDF!');
      return;
    }
    onExport(
      options,
      projectMode === 'CUSTOM' ? selectedProjectIds : projects.map((p) => p.id)
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Cấu hình Xuất Báo cáo PDF</h3>
              <p className="text-xs text-slate-300 font-medium">
                Tùy chọn ẩn/hiện các cột và phân đoạn thông tin báo cáo PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Presets Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Mẫu cấu hình nhanh:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Đầy đủ (Toàn bộ 8 Mốc)
              </button>
              <button
                type="button"
                onClick={handleSelectPresetSummary}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Tóm tắt (Gantt & Tiến độ)
              </button>
            </div>
          </div>

          {/* Layout Style Toggle */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-slate-50 p-3.5 rounded-xl border border-indigo-200/80 space-y-2">
            <label className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Kiểu Trình Bày PDF
              </span>
              <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                Khổ Ngang Chuẩn Đẹp
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, layoutStyle: 'WEB_MATCH' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  (options.layoutStyle || 'WEB_MATCH') === 'WEB_MATCH'
                    ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20 text-slate-900'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-indigo-950 flex items-center gap-1.5">📱 Giao Diện Web Đồng Bộ</span>
                  {(options.layoutStyle || 'WEB_MATCH') === 'WEB_MATCH' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed">
                  Hiển thị thẻ 8 mốc, 3 ô thời gian (HĐ/TGĐ/Thực tế) và thanh 8 phân đoạn giống hệt màn hình Web.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, layoutStyle: 'MULTI_COLUMN' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  options.layoutStyle === 'MULTI_COLUMN'
                    ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20 text-slate-900'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-800 flex items-center gap-1.5">📊 Bảng Phân Tách Cột</span>
                  {options.layoutStyle === 'MULTI_COLUMN' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed">
                  Tách riêng từng mốc nghiệm thu được chọn thành 1 cột bảng độc lập.
                </p>
              </button>
            </div>
          </div>

          {/* Section 1: Overview Sections */}
          <div>
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-indigo-600" />
              1. Khối Thành phần Tổng quan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.includeKpi
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.includeKpi}
                  onChange={(e) => setOptions((prev) => ({ ...prev, includeKpi: e.target.checked }))}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-bold">Thẻ Chỉ số KPI Tổng quan</div>
                  <p className="text-xs text-slate-500 font-normal">Hiển thị 6 ô thống kê trạng thái công trình</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.includeCharts
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) => setOptions((prev) => ({ ...prev, includeCharts: e.target.checked }))}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-bold">Biểu đồ Xu hướng & Quartile</div>
                  <p className="text-xs text-slate-500 font-normal">Hình ảnh chụp biểu đồ phân bổ và điểm tắc nghẽn</p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Main Table Columns */}
          <div>
            <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Table className="w-4 h-4 text-indigo-600" />
              2. Các Cột Cơ Bản Bảng Công Trình
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.showStt
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.showStt}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showStt: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Cột Số thứ tự (STT)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.showProjectInfo
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.showProjectInfo}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showProjectInfo: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Cột Tên công trình & Hồ sơ (Mã CT, Số HĐ)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.showProgressStatus
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.showProgressStatus}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showProgressStatus: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Cột Tiến độ & Trạng thái (Hạn HĐ, Hạn TGĐ, Thực tế)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  options.showGantt
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.showGantt}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showGantt: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Cột Biểu đồ Gantt Bar trực quan (Tháng 1 - Tháng 12)</span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer sm:col-span-2 transition-all ${
                  options.showGhiChu
                    ? 'bg-indigo-50/60 border-indigo-300 text-indigo-950 font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.showGhiChu}
                  onChange={(e) => setOptions((prev) => ({ ...prev, showGhiChu: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium">Cột Ghi chú công trình</span>
              </label>
            </div>
          </div>

          {/* Section 3: 8 Milestone Columns */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                3. Chi Tiết 8 Mốc Nghiệm Thu QCQS ({activeMilestoneCount}/8 Mốc)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleAllMilestones(true)}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Chọn tất cả
                </button>

                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleToggleAllMilestones(false)}
                  className="text-slate-500 font-medium hover:text-slate-700 hover:underline"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MILESTONE_DEFINITIONS.map((m) => {
                const key = m.key as MilestoneKey;
                const isChecked = options.milestones[key];

                return (
                  <label
                    key={m.key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 font-normal'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleMilestone(key)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs truncate" title={m.label}>
                      {m.label}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Specific Projects Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                4. Chọn Công Trình Xuất Báo Cáo ({effectiveExportCount}/{projects.length} CT)
              </label>

              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProjectMode('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    projectMode === 'ALL'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({projects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProjectMode('CUSTOM')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    projectMode === 'CUSTOM'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tùy chọn ({selectedProjectIds.length})
                </button>
              </div>
            </div>

            {projectMode === 'CUSTOM' && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in duration-200">
                {/* Search & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên, mã CT, số HĐ..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-indigo-600 font-bold hover:underline whitespace-nowrap"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllProjects}
                      className="text-slate-500 font-medium hover:text-slate-700 hover:underline whitespace-nowrap"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>

                {/* Project List Scrollable Box */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200/80 rounded-xl bg-white p-2">
                  {filteredProjectList.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      Không tìm thấy công trình nào phù hợp.
                    </div>
                  ) : (
                    filteredProjectList.map((p) => {
                      const isChecked = selectedProjectIds.includes(p.id);
                      const statusInfo = calculateProjectStatus(p);

                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between gap-3 p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                            isChecked
                              ? 'bg-indigo-50/60 border-indigo-200 text-slate-900 font-medium'
                              : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProject(p.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                            />
                            <span className="font-extrabold text-indigo-900 bg-indigo-100/80 px-1.5 py-0.5 rounded text-[10px] flex-shrink-0">
                              {p.maCongTrinh}
                            </span>
                            <span className="truncate font-semibold text-slate-800" title={p.tenCongTrinh}>
                              {p.tenCongTrinh}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap bg-slate-100 text-slate-700 border border-slate-200 flex-shrink-0">
                            {statusInfo.label}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Export Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Mặc định
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={isExporting || effectiveExportCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang khởi tạo PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Xuất PDF ({effectiveExportCount} Công trình)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
