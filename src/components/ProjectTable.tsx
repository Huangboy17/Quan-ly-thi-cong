import React, { useState, useEffect } from 'react';
import {
  Building2,
  CalendarDays,
  ChartGantt,
  GitCommitHorizontal,
  Edit,
  Trash2,
  Check,
  CheckCircle2,
  Loader2,
  Calendar,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Project, MILESTONE_DEFINITIONS, MilestoneKey } from '../types';
import {
  formatDate,
  formatShortDate,
  calculateProjectStatus,
  getProjectCompletionPercentage,
  getProjectMilestoneDefs,
  isMilestoneInMonth,
} from '../utils/helpers';
import { InlineGantt } from './InlineGantt';

interface ProjectTableProps {
  projects: Project[];
  totalProjectsCount?: number;
  selectedMonth?: string;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onViewDetail: (project: Project) => void;
  onMoveProject?: (id: string, direction: 'up' | 'down') => void;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  totalProjectsCount,
  selectedMonth,
  onEdit,
  onDelete,
  onViewDetail,
  onMoveProject,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  const totalItems = projects.length;
  const effectivePageSize = pageSize === 'ALL' ? (totalItems || 1) : pageSize;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalItems / effectivePageSize));

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === 'ALL' ? 0 : (validCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedProjects = projects.slice(startIndex, endIndex);

  // Calculate footer counts for currently displayed projects
  let completedCount = 0;
  let lateCount = 0;
  let inProgressCount = 0;

  projects.forEach((p) => {
    const status = calculateProjectStatus(p);
    if (status.key === 'HOAN_THANH') completedCount++;
    else if (status.key === 'CHAM_KY') lateCount++;
    else inProgressCount++;
  });
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          Không tìm thấy công trình phù hợp với tìm kiếm hoặc bộ lọc.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Thử thay đổi bộ lọc hoặc thêm mới công trình.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar max-h-[calc(100vh-275px)]">
        <table className="w-full text-xs text-left text-slate-700 border-collapse min-w-[2200px]">
          <thead className="bg-slate-900 text-slate-200 uppercase text-[11px] font-bold sticky top-0 z-20 shadow-md">
            <tr>
              <th className="p-3 text-center w-20 border-b border-slate-800">
                <div className="flex items-center justify-center gap-1">
                  <span>STT</span>
                  {onMoveProject && <span className="text-[9px] text-slate-400 font-normal">↕</span>}
                </div>
              </th>

              {/* PHẦN 1: THÔNG TIN CHUNG DỰ ÁN */}
              <th className="p-3 w-[380px] border-b border-slate-800 bg-blue-950/90 text-blue-200 border-r border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                    PHẦN 1
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> THÔNG TIN CHUNG DỰ ÁN
                  </span>
                </div>
              </th>

              {/* PHẦN 2: CÁC THỜI GIAN CỦA DỰ ÁN */}
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

              {/* PHẦN 3: GANTT CHART TRỰC QUAN */}
              <th className="p-3 w-[370px] border-b border-slate-800 bg-purple-950/90 text-purple-200 border-r border-slate-700">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 px-2 py-0.5 rounded text-[10px] text-white font-black">
                      PHẦN 3
                    </span>
                    <span className="flex items-center gap-1">
                      <ChartGantt className="w-3.5 h-3.5" /> Gantt Bar: HĐ ➔ Đợt 3 (Hoàn thành XD+ME)
                    </span>
                  </div>
                  <span className="text-[9.5px] text-purple-300 font-bold bg-purple-900/80 px-1.5 py-0.5 rounded border border-purple-600/50">
                    Mốc HĐ, M1, M2, M3
                  </span>
                </div>
              </th>

              {/* PHẦN 4: 8 ĐIỂM DỪNG & TRẠNG THÁI */}
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
                    Điểm đang thực hiện (Active) viền đỏ & nhấp nháy
                  </span>
                </div>
              </th>

              <th className="p-3 w-28 border-b border-slate-800 text-center sticky right-0 bg-slate-900 z-20 shadow-left">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedProjects.map((p, index) => {
              const statusObj = calculateProjectStatus(p);
              const m = p.milestones || {};
              const completionPct = getProjectCompletionPercentage(p);
              const projectDefs = getProjectMilestoneDefs(p);

              // Count signed milestones
              let signedCount = 0;
              projectDefs.forEach((def) => {
                if (m[def.key]?.ngayKy) signedCount++;
              });

              {/* Find active milestone (first un-signed milestone) */}
              let activeMilestoneIndex = -1;
              for (let i = 0; i < projectDefs.length; i++) {
                const key = projectDefs[i].key;
                const data = m[key] || {};
                if (!data.ngayKy) {
                  activeMilestoneIndex = i;
                  break;
                }
              }

              const milestoneCards = projectDefs.map((item, idx) => {
                const data = m[item.key] || {};
                const isSigned = !!data.ngayKy;
                const isSubmitting = !!data.ngayTrinh && !data.ngayKy;
                const isActive = idx === activeMilestoneIndex;
                const isMonthMatch = selectedMonth && selectedMonth !== 'ALL' && isMilestoneInMonth(data, selectedMonth);

                let cardBorder = 'border-slate-200 bg-white text-slate-600';
                let badgeColor = 'bg-slate-100 text-slate-500';

                if (isSigned) {
                  cardBorder = 'border-emerald-300 bg-emerald-50/50 text-emerald-900';
                  badgeColor = 'bg-emerald-600 text-white';
                } else if (isActive) {
                  cardBorder =
                    'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-500 shadow-md animate-pulse';
                  badgeColor = 'bg-red-600 text-white font-bold';
                } else if (isSubmitting) {
                  cardBorder = 'border-amber-200 bg-amber-50/40 text-amber-900';
                  badgeColor = 'bg-amber-500 text-white';
                }

                if (isMonthMatch) {
                  cardBorder += ' ring-2 ring-emerald-500 shadow-md bg-emerald-50/80';
                }

                const dotLabel = item.label.includes(':') ? item.label.split(':')[0].trim() : `Đợt ${idx + 1}`;
                const titleText = item.label.includes(':') ? item.label.split(':')[1].trim() : item.label;

                const ntVal = formatShortDate(data.nt_tgd || data.nt_hd);
                const trinhVal = formatShortDate(data.ngayTrinh);
                const kyVal = formatShortDate(data.ngayKy);

                return (
                  <div
                    key={item.key}
                    className={`p-2 rounded-lg border ${cardBorder} flex flex-col justify-between gap-1 min-w-[135px] shadow-sm relative`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold inline-block min-w-[42px] text-center leading-tight ${badgeColor}`}>
                        {dotLabel}
                      </span>
                      {isMonthMatch && (
                        <span className="text-[8.5px] bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded shadow-xs" title="Mốc thuộc tháng NT đang chọn">
                          🎯 NT
                        </span>
                      )}
                      {isActive && !isMonthMatch && (
                        <span className="text-[9px] text-red-700 font-extrabold uppercase flex items-center gap-0.5 px-1 py-0.5">
                          <Loader2 className="w-2.5 h-2.5 animate-spin text-red-600" />
                          Active
                        </span>
                      )}
                      {isSubmitting && !isActive && !isMonthMatch && (
                        <span className="text-[9px] text-amber-700 font-bold flex items-center gap-0.5 px-1 py-0.5">
                          ⏳ Trình
                        </span>
                      )}
                    </div>

                    <div className="text-[9.5px] font-bold text-slate-800 text-center py-1 border-b border-slate-200/80 min-h-[22px] flex items-center justify-center leading-tight">
                      {titleText}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[9px] font-mono pt-1 text-center">
                      <div
                        className="bg-slate-100/80 rounded p-0.5"
                        title={`Nghiệm thu: ${formatDate(data.nt_tgd || data.nt_hd)}`}
                      >
                        <span className="block text-[8px] text-slate-500 font-sans font-bold">NT</span>
                        <span className="font-bold text-slate-800">
                          {ntVal === '-' ? '.../...' : ntVal}
                        </span>
                      </div>
                      {isSigned ? (
                        <div
                          className="bg-emerald-50 rounded p-0.5 border border-emerald-200"
                          title={`Ngày ký: ${formatDate(data.ngayKy)}`}
                        >
                          <span className="block text-[8px] text-emerald-700 font-sans font-extrabold">Ký</span>
                          <span className="font-extrabold text-emerald-900">
                            {kyVal === '-' ? '.../...' : kyVal}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="bg-amber-50 rounded p-0.5 border border-amber-200"
                          title={`Ngày trình: ${formatDate(data.ngayTrinh)}`}
                        >
                          <span className="block text-[8px] text-amber-700 font-sans font-bold">Trình</span>
                          <span className="font-bold text-amber-950">
                            {trinhVal === '-' ? '.../...' : trinhVal}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });

              const globalIndex = startIndex + index;
              const isFirst = globalIndex === 0;
              const isLast = globalIndex === totalItems - 1;

              return (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-2 text-center font-bold text-slate-500 border-b border-slate-200">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-extrabold text-slate-700 text-xs w-5 text-right font-mono">
                        {globalIndex + 1}
                      </span>
                      {onMoveProject && (
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => onMoveProject(p.id, 'up')}
                            disabled={isFirst}
                            className="p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
                            title={`Di chuyển ${p.maCongTrinh} lên trên (Up)`}
                            aria-label={`Di chuyển ${p.maCongTrinh} lên trên`}
                          >
                            <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveProject(p.id, 'down')}
                            disabled={isLast}
                            className="p-0.5 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
                            title={`Di chuyển ${p.maCongTrinh} xuống dưới (Down)`}
                            aria-label={`Di chuyển ${p.maCongTrinh} xuống dưới`}
                          >
                            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* PHẦN 1: THÔNG TIN CHUNG DỰ ÁN */}
                  <td className="p-3 border-b border-slate-200 border-r border-slate-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-blue-700 text-xs">{p.maCongTrinh}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {p.soHopDong}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 text-xs">{p.tenCongTrinh}</div>

                      {/* Subtle 8-Stop Acceptance Progress Bar */}
                      <div className="bg-slate-50/80 p-1.5 rounded-lg border border-slate-200/90 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Tiến Độ 8 Mốc: <span className="text-slate-800">{signedCount}/8 Ký</span>
                          </span>
                          <span className={`font-mono font-extrabold ${
                            completionPct === 100
                              ? 'text-emerald-600'
                              : completionPct >= 50
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }`}>
                            {completionPct}%
                          </span>
                        </div>

                        {/* 8-Segment Visual Bar */}
                        <div className="w-full bg-slate-200/90 h-1.5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                          {MILESTONE_DEFINITIONS.map((def, mIdx) => {
                            const item = m[def.key] || {};
                            const isSigned = !!item.ngayKy;
                            const isSubmitting = !!item.ngayTrinh && !item.ngayKy;
                            const isActive = mIdx === activeMilestoneIndex;

                            let segBg = 'bg-slate-300/80';
                            if (isSigned) segBg = 'bg-emerald-500';
                            else if (isActive) segBg = 'bg-red-500 animate-pulse';
                            else if (isSubmitting) segBg = 'bg-amber-300';

                            return (
                              <div
                                key={def.key}
                                className={`h-full flex-1 rounded-sm transition-all ${segBg}`}
                                title={`Mốc ${mIdx + 1}: ${def.label} — ${
                                  isSigned ? 'Đã ký' : isActive ? 'Active (Đang làm)' : isSubmitting ? 'Đã trình' : 'Chưa đến'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-blue-500" /> HĐ: {formatDate(p.ngayHopDong)}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] ${statusObj.badgeClass}`}>
                          {statusObj.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* PHẦN 2: CÁC THỜI GIAN CỦA DỰ ÁN */}
                  <td className="p-3 border-b border-slate-200 border-r border-slate-200 text-center">
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                      <div className="bg-slate-50 p-1 rounded border border-slate-200" title="Thời gian Hợp đồng">
                        <span className="block text-[8px] text-slate-400 font-sans">HĐ</span>
                        <span className="font-bold text-slate-700">{formatShortDate(p.tienDoHopDong)}</span>
                      </div>
                      <div className="bg-blue-50/80 p-1 rounded border border-blue-200" title="Thời gian TGĐ Duyệt">
                        <span className="block text-[8px] text-blue-600 font-sans">TGĐ</span>
                        <span className="font-bold text-blue-800">{formatShortDate(p.tienDoTgdDuyet)}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-1 rounded border border-emerald-200" title="Thời gian Thực tế">
                        <span className="block text-[8px] text-emerald-600 font-sans">Thực tế</span>
                        <span className="font-bold text-emerald-800">{formatShortDate(p.tienDoThucTe)}</span>
                      </div>
                    </div>
                  </td>

                  {/* PHẦN 3: GANTT CHART TRỰC QUAN */}
                  <td className="p-3 border-b border-slate-200 border-r border-slate-200">
                    <InlineGantt project={p} />
                  </td>

                  {/* PHẦN 4: 8 ĐIỂM DỪNG NGHIỆM THU */}
                  <td className="p-3 border-b border-slate-200">
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                      {milestoneCards}
                    </div>
                  </td>

                  {/* THAO TÁC */}
                  <td className="p-3 border-b border-slate-200 text-center sticky right-0 bg-white shadow-left">
                    <div className="flex items-center justify-center gap-1">
                      {onMoveProject && (
                        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1 mr-0.5">
                          <button
                            type="button"
                            onClick={() => onMoveProject(p.id, 'up')}
                            disabled={isFirst}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 disabled:opacity-20 disabled:cursor-not-allowed rounded transition cursor-pointer"
                            title="Di chuyển lên trên (Up)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveProject(p.id, 'down')}
                            disabled={isLast}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 disabled:opacity-20 disabled:cursor-not-allowed rounded transition cursor-pointer"
                            title="Di chuyển xuống dưới (Down)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetail(p)}
                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition cursor-pointer"
                        title="Xem chi tiết 8 mốc"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded transition cursor-pointer"
                        title="Xóa công trình"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer bar with pagination and project count summary */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium rounded-b-xl">
        {/* Left: Project Count & Page Size Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>
              Hiển thị <strong className="text-slate-900 font-extrabold">{totalItems > 0 ? startIndex + 1 : 0}–{endIndex}</strong> trên <strong className="text-slate-900 font-extrabold">{totalItems}</strong> công trình
              {totalProjectsCount && totalProjectsCount !== totalItems && (
                <span className="text-slate-500 font-normal ml-1">(lọc từ tổng {totalProjectsCount})</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-semibold">Số hàng / trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="ALL">Tất cả ({totalItems})</option>
            </select>
          </div>
        </div>

        {/* Center: Pagination controls with Page Numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap my-1 lg:my-0">
            <span className="text-xs font-bold text-slate-700 mr-1 bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200">
              Trang <strong className="text-indigo-900 font-black">{validCurrentPage}</strong> / <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
              </button>

              {getPageNumbers(validCurrentPage, totalPages).map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                      ...
                    </span>
                  );
                }
                const isCurrent = pNum === validCurrentPage;
                return (
                  <button
                    key={`page-${pNum}`}
                    onClick={() => setCurrentPage(Number(pNum))}
                    className={`min-w-[28px] h-7 px-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Trang cuối"
              >
                <ChevronsRight className="w-3.5 h-3.5 text-slate-700" />
              </button>
            </div>
          </div>
        )}

        {/* Right: Status summary badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Hoàn thành: <strong className="font-extrabold">{completedCount}</strong>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Chậm ký: <strong className="font-extrabold">{lateCount}</strong>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Đang thi công: <strong className="font-extrabold">{inProgressCount}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
