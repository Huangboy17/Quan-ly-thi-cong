import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Project, MilestoneKey, MilestoneData, MILESTONE_DEFINITIONS } from '../types';
import {
  calculateProjectStatus,
  calculateKPISummary,
  getProjectCompletionPercentage,
  formatDate,
  formatShortDate,
  getProjectMilestoneDefs,
} from './helpers';

type KPISummaryType = ReturnType<typeof calculateKPISummary>;

export interface PdfColumnOptions {
  layoutStyle?: 'WEB_MATCH' | 'MULTI_COLUMN';
  includeKpi: boolean;
  includeCharts: boolean;
  showStt: boolean;
  showProjectInfo: boolean;
  showProgressStatus: boolean;
  showGantt: boolean;
  milestones: {
    m1: boolean;
    m2: boolean;
    m3: boolean;
    m4: boolean;
    m5: boolean;
    m6: boolean;
    m7: boolean;
    m8: boolean;
  };
  showGhiChu: boolean;
}

export const DEFAULT_PDF_OPTIONS: PdfColumnOptions = {
  layoutStyle: 'WEB_MATCH',
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

interface PdfExportOptions {
  filteredProjects: Project[];
  selectedProjectIds?: string[];
  totalProjectsCount: number;
  kpiSummary: KPISummaryType;
  statusFilter: string;
  selectedQuartile: string | null;
  selectedMonth?: string;
  searchQuery: string;
  columnOptions?: PdfColumnOptions;
}

export async function exportProjectsToPdf({
  filteredProjects: rawFilteredProjects,
  selectedProjectIds,
  totalProjectsCount,
  kpiSummary,
  statusFilter,
  selectedQuartile,
  selectedMonth,
  searchQuery,
  columnOptions = DEFAULT_PDF_OPTIONS,
}: PdfExportOptions): Promise<void> {
  const options = columnOptions;

  // Filter projects if specific project IDs were selected
  const filteredProjects = selectedProjectIds && selectedProjectIds.length > 0
    ? rawFilteredProjects.filter((p) => selectedProjectIds.includes(p.id))
    : rawFilteredProjects;

  // 1. Capture Charts screenshot if requested
  let chartsImgUrl: string | null = null;
  if (options.includeCharts) {
    const chartsContainer = document.getElementById('pdf-export-charts-wrapper');
    if (chartsContainer) {
      try {
        const canvas = await html2canvas(chartsContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        chartsImgUrl = canvas.toDataURL('image/png');
      } catch (err) {
        console.warn('Không thể chụp biểu đồ cho PDF:', err);
      }
    }
  }

  // 2. Active milestones filter
  const activeMilestones = (['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'] as MilestoneKey[]).filter(
    (k) => options.milestones[k]
  );

  // Labels and Filter Text
  const getStatusFilterLabel = (filter: string) => {
    switch (filter) {
      case 'HOAN_THANH':
        return 'Đã Hoàn Thành (8 Mốc)';
      case 'CHAM_KY':
        return 'Chậm Ký HĐ/NT (>7 Ngày)';
      case 'DANG_TRINH_KY':
        return 'Đang Trình Ký';
      case 'TRE_TIEN_DO':
        return 'Trễ Tiến Độ TGD Duyệt';
      case 'GIA_HAN':
        return 'Gia Hạn Tiến Độ';
      case 'DANG_THI_CONG':
        return 'Đang Thi Công Bình Thường';
      case 'ALL':
      default:
        return 'Tất Cả Công Trình';
    }
  };

  const nowStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let filterText = `Trạng thái: ${getStatusFilterLabel(statusFilter)}`;
  if (selectedMonth && selectedMonth !== 'ALL') {
    const [year, month] = selectedMonth.split('-');
    filterText += `  |  Tháng Nghiệm Thu (NT): Tháng ${month}/${year}`;
  }
  if (selectedQuartile) {
    filterText += `  |  Quartile: ${selectedQuartile}`;
  }
  if (searchQuery) {
    filterText += `  |  Từ khóa: "${searchQuery}"`;
  }

  // Helper: Render Gantt chart cell HTML
  const renderGanttCellHtml = (p: Project, completionPct: number, signedCount: number) => {
    const statusInfo = calculateProjectStatus(p);

    let barColor = '#2563eb'; // blue
    if (statusInfo.key === 'HOAN_THANH') barColor = '#059669'; // emerald
    else if (statusInfo.key === 'CHAM_KY' || statusInfo.key === 'TRE_TIEN_DO') barColor = '#e11d48'; // rose
    else if (statusInfo.key === 'DANG_TRINH_KY') barColor = '#d97706'; // amber
    else if (statusInfo.key === 'GIA_HAN') barColor = '#7c3aed'; // purple

    const m = p.milestones || {};
    const projectDefs = getProjectMilestoneDefs(p);

    let activeMilestoneIndex = -1;
    for (let i = 0; i < projectDefs.length; i++) {
      const key = projectDefs[i].key;
      if (!m[key]?.ngayKy) {
        activeMilestoneIndex = i;
        break;
      }
    }

    const totalDefs = projectDefs.length;

    // Calculate Gantt from HĐ to M3 (XD+ME Hoàn thành xây lắp) matching web InlineGantt
    const parseDateValues = (dStr?: string) => {
      if (!dStr) return null;
      const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr.trim();
      if (!clean || clean === '-' || clean === '...') return null;
      if (clean.includes('-')) {
        const parts = clean.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[2], 10);
            if (!isNaN(m) && m >= 1 && m <= 12) return { month: m, day: isNaN(d) ? 15 : d };
          } else if (parts[2].length === 4) {
            const m = parseInt(parts[1], 10);
            const d = parseInt(parts[0], 10);
            if (!isNaN(m) && m >= 1 && m <= 12) return { month: m, day: isNaN(d) ? 15 : d };
          }
        }
      } else if (clean.includes('/')) {
        const parts = clean.split('/');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[0], 10);
          if (!isNaN(m) && m >= 1 && m <= 12) return { month: m, day: isNaN(d) ? 15 : d };
        }
      }
      return null;
    };

    const getTimelinePct = (dVal: { month: number; day: number } | null, fallbackMon: number) => {
      if (!dVal) return Math.min(98, Math.max(2, ((fallbackMon - 0.5) / 12) * 100));
      const fraction = Math.min(1, Math.max(0, (dVal.day - 1) / 30));
      return Math.min(98, Math.max(2, (((dVal.month - 1) + fraction) / 12) * 100));
    };

    const hdDateVal = parseDateValues(p.ngayHopDong);
    const startMonth = hdDateVal?.month || 1;
    const startPercent = getTimelinePct(hdDateVal, 1);

    const m1Item = m.m1 || {};
    const m2Item = m.m2 || {};
    const m3Item = m.m3 || {};

    const m3DateStr = m3Item.ngayKy || m3Item.nt_tgd || m3Item.nt_hd || m3Item.nt_tt1 || p.tienDoTgdDuyet || p.tienDoHopDong;
    const m3DateVal = parseDateValues(m3DateStr);
    const rawM3Percent = getTimelinePct(m3DateVal, Math.min(12, startMonth + 5));
    const m3Percent = Math.max(startPercent + 10, rawM3Percent);
    const endMonth = m3DateVal?.month || Math.min(12, startMonth + 5);

    const widthPercent = Math.max(8.333, m3Percent - startPercent);

    const m1DateStr = m1Item.ngayKy || m1Item.nt_tgd || m1Item.nt_hd || m1Item.nt_tt1;
    const m1DateVal = parseDateValues(m1DateStr);
    const rawM1Percent = m1DateVal ? getTimelinePct(m1DateVal, startMonth + 1) : startPercent + widthPercent * 0.35;
    const m1Percent = Math.max(startPercent + 2, Math.min(m3Percent - 2, rawM1Percent));

    const m2DateStr = m2Item.ngayKy || m2Item.nt_tgd || m2Item.nt_hd || m2Item.nt_tt1;
    const m2DateVal = parseDateValues(m2DateStr);
    const rawM2Percent = m2DateVal ? getTimelinePct(m2DateVal, startMonth + 3) : startPercent + widthPercent * 0.7;
    const m2Percent = Math.max(m1Percent + 2, Math.min(m3Percent - 1, rawM2Percent));

    const isM1Signed = !!m1Item.ngayKy;
    const isM2Signed = !!m2Item.ngayKy;
    const isM3Signed = !!m3Item.ngayKy;

    const isDelayed =
      p.tienDoThucTe &&
      p.tienDoTgdDuyet &&
      new Date(p.tienDoThucTe) > new Date(p.tienDoTgdDuyet);

    let ganttBarBg = 'linear-gradient(90deg, #2563eb, #4f46e5, #0891b2)';
    if (isM3Signed) {
      ganttBarBg = 'linear-gradient(90deg, #059669, #0d9488, #10b981)';
    } else if (isDelayed) {
      ganttBarBg = 'linear-gradient(90deg, #f59e0b, #ea580c, #e11d48)';
    }

    const currentMarkerLeft = ((8 - 1) / 12) * 100 + 4.166;

    // Timeline month labels (Tháng 1 - Tháng 12)
    const monthRulerHtml = ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const)
      .map((mNum) => {
        const isCurrent = mNum === 8;
        const isInSpan = mNum >= startMonth && mNum <= endMonth;
        return `<span style="font-size: 8.5px; color: ${isCurrent ? '#dc2626' : isInSpan ? '#1e293b' : '#64748b'}; font-weight: ${isCurrent || isInSpan ? '900' : '700'}; text-align: center; display: flex; align-items: center; justify-content: center; flex: 1; line-height: 1; ${isCurrent ? 'background-color: #fee2e2; border-radius: 2px;' : ''}">T${mNum}</span>`;
      })
      .join('');

    return `
      <div style="padding: 2px 0; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 10px;">
          <span style="font-weight: 800; color: #1e293b; display: inline-flex; align-items: center;">Đã ký: <strong style="color: #0f172a; margin-left: 3px;">${signedCount}/${totalDefs} mốc</strong></span>
          <span style="font-weight: 900; color: ${barColor}; display: inline-flex; align-items: center; font-size: 11px;">${completionPct}%</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px;">
          ${monthRulerHtml}
        </div>
        <div style="position: relative; height: 20px; background-color: #f1f5f9; border-radius: 4px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 5px; display: flex; align-items: center;">
          <!-- Gantt Bar -->
          <div style="position: absolute; height: 14px; border-radius: 3px; background: ${ganttBarBg}; left: ${startPercent}%; width: ${widthPercent}%; display: flex; justify-content: space-between; align-items: center; padding: 0 4px; font-size: 7.5px; font-weight: 800; color: #ffffff; white-space: nowrap; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
            <span>HĐ:${formatShortDate(p.ngayHopDong)}</span>
            <span>${isM3Signed ? '✓' : '🏁'} M3:${formatShortDate(m3DateStr)}</span>
          </div>

          <!-- Mốc M1 -->
          <div style="position: absolute; top: 50%; transform: translate(-50%, -50%); left: ${m1Percent}%; width: 11px; height: 11px; border-radius: 50%; background-color: ${isM1Signed ? '#059669' : '#64748b'}; border: 1px solid #ffffff; z-index: 10; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 6.5px; font-weight: 900;" title="Mốc M1">${isM1Signed ? '✓' : '1'}</div>

          <!-- Mốc M2 -->
          <div style="position: absolute; top: 50%; transform: translate(-50%, -50%); left: ${m2Percent}%; width: 11px; height: 11px; border-radius: 50%; background-color: ${isM2Signed ? '#059669' : '#64748b'}; border: 1px solid #ffffff; z-index: 10; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 6.5px; font-weight: 900;" title="Mốc M2">${isM2Signed ? '✓' : '2'}</div>

          <!-- Current Month Line (T8) -->
          <div style="position: absolute; top: 0; bottom: 0; width: 2px; background-color: #dc2626; left: ${currentMarkerLeft}%; z-index: 20;"></div>
        </div>

        <!-- Dòng thời gian 4 mốc rõ ràng, ngắn gọn -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; font-family: monospace; font-size: 7.5px; text-align: center;">
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 3px; padding: 2px 1px; color: #1e3a8a;">
            <div style="font-size: 6.5px; font-weight: 800; color: #2563eb;">HỢP ĐỒNG</div>
            <strong>${formatShortDate(p.ngayHopDong)}</strong>
          </div>
          <div style="background-color: ${isM1Signed ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${isM1Signed ? '#bbf7d0' : '#cbd5e1'}; border-radius: 3px; padding: 2px 1px; color: ${isM1Signed ? '#166534' : '#334155'};">
            <div style="font-size: 6.5px; font-weight: 800; color: #64748b;">${isM1Signed ? '✓ M1 (THÔ)' : 'M1 (THÔ)'}</div>
            <strong>${formatShortDate(m1DateStr)}</strong>
          </div>
          <div style="background-color: ${isM2Signed ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${isM2Signed ? '#bbf7d0' : '#cbd5e1'}; border-radius: 3px; padding: 2px 1px; color: ${isM2Signed ? '#166534' : '#334155'};">
            <div style="font-size: 6.5px; font-weight: 800; color: #64748b;">${isM2Signed ? '✓ M2 (ME TB)' : 'M2 (ME TB)'}</div>
            <strong>${formatShortDate(m2DateStr)}</strong>
          </div>
          <div style="background-color: ${isM3Signed ? '#ecfdf5' : '#eef2ff'}; border: 1px solid ${isM3Signed ? '#a7f3d0' : '#c7d2fe'}; border-radius: 3px; padding: 2px 1px; color: ${isM3Signed ? '#065f46' : '#312e81'}; font-weight: 800;">
            <div style="font-size: 6.5px; font-weight: 800; color: #4338ca;">${isM3Signed ? '✓ M3 (XÂY LẮP)' : '🏁 M3 (XÂY LẮP)'}</div>
            <strong>${formatShortDate(m3DateStr)}</strong>
          </div>
        </div>
      </div>
    `;
  };

  // Helper: Render milestone cell HTML
  const renderMilestoneCellHtml = (item?: MilestoneData, isActive?: boolean) => {
    if (!item && !isActive) {
      return `<div style="text-align: center; color: #94a3b8; font-size: 10px; display: flex; align-items: center; justify-content: center; line-height: 1;">-</div>`;
    }

    if (item?.ngayKy) {
      return `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; box-sizing: border-box;">
          <div style="font-size: 9.5px; font-weight: 800; color: #166534; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">✓ Đã ký</div>
          <div style="font-size: 9.5px; font-weight: 800; color: #14532d; margin-top: 3px; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">${formatDate(item.ngayKy)}</div>
        </div>
      `;
    }

    if (isActive) {
      const displayDate = item?.ngayTrinh || item?.nt_tgd || item?.nt_hd;
      return `
        <div style="background-color: #fef2f2; border: 1.5px solid #ef4444; border-radius: 5px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; box-sizing: border-box;">
          <div style="font-size: 9.5px; font-weight: 900; color: #dc2626; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">⚡ Active</div>
          <div style="font-size: 9px; font-weight: 800; color: #991b1b; margin-top: 3px; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">${displayDate ? formatDate(displayDate) : 'Đang làm'}</div>
        </div>
      `;
    }

    if (item?.ngayTrinh) {
      return `
        <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 5px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; box-sizing: border-box;">
          <div style="font-size: 9.5px; font-weight: 800; color: #ca8a04; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">⏳ Trình ký</div>
          <div style="font-size: 9.5px; font-weight: 800; color: #854d0e; margin-top: 3px; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">${formatDate(item.ngayTrinh)}</div>
        </div>
      `;
    }

    const targetDate = item?.nt_tgd || item?.nt_hd;
    if (targetDate) {
      return `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; width: 100%; box-sizing: border-box;">
          <div style="font-size: 8.5px; font-weight: 700; color: #64748b; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">Hạn dự kiến</div>
          <div style="font-size: 9.5px; font-weight: 800; color: #334155; margin-top: 3px; line-height: 1; display: flex; align-items: center; justify-content: center; text-align: center;">${formatDate(targetDate)}</div>
        </div>
      `;
    }

    return `<div style="text-align: center; color: #94a3b8; font-size: 10px; display: flex; align-items: center; justify-content: center; line-height: 1;">-</div>`;
  };

  // Helper: Render table header HTML
  const renderTableHeaderHtml = () => {
    const isWebMatch = options.layoutStyle !== 'MULTI_COLUMN';
    const activeMilestoneCount = activeMilestones.length;

    if (isWebMatch) {
      return `
        <thead>
          <tr style="height: 44px; text-align: left; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff;">
            ${
              options.showStt
                ? '<th style="padding: 10px 6px; text-align: center; vertical-align: middle; width: 48px; border: 1px solid #334155; background-color: #0f172a; color: #ffffff;">STT</th>'
                : ''
            }
            ${
              options.showProjectInfo
                ? `<th style="padding: 10px 12px; width: 330px; vertical-align: middle; border: 1px solid #334155; background-color: #1e293b; color: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: flex-start; gap: 6px; height: 100%;">
                      <span style="font-size: 11.5px; font-weight: 900; color: #ffffff; display: inline-flex; align-items: center; line-height: 1;">PHẦN 1:</span>
                      <span style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px; display: inline-flex; align-items: center; line-height: 1;">THÔNG TIN CHUNG DỰ ÁN</span>
                    </div>
                  </th>`
                : ''
            }
            ${
              options.showProgressStatus
                ? `<th style="padding: 10px 8px; width: 185px; vertical-align: middle; border: 1px solid #334155; background-color: #1e293b; color: #ffffff; text-align: center;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 100%;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <span style="font-size: 11.5px; font-weight: 900; color: #ffffff; display: inline-flex; align-items: center; line-height: 1;">PHẦN 2:</span>
                        <span style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px; display: inline-flex; align-items: center; line-height: 1;">CÁC THỜI GIAN</span>
                      </div>
                      <div style="display: flex; justify-content: space-around; width: 100%; font-size: 9px; font-weight: 800; color: #cbd5e1; text-align: center;">
                        <span style="flex: 1; text-align: center;">HĐ</span>
                        <span style="flex: 1; text-align: center;">TGĐ</span>
                        <span style="flex: 1; text-align: center;">Thực tế</span>
                      </div>
                    </div>
                  </th>`
                : ''
            }
            ${
              options.showGantt
                ? `<th style="padding: 10px 10px; width: 300px; vertical-align: middle; border: 1px solid #334155; background-color: #1e293b; color: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; height: 100%;">
                      <span style="font-size: 11.5px; font-weight: 900; color: #ffffff; display: inline-flex; align-items: center; line-height: 1;">PHẦN 3:</span>
                      <span style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px; display: inline-flex; align-items: center; line-height: 1;">GANTT BAR: HĐ ➔ ĐỢT 3 (XD+ME XÂY LẮP)</span>
                    </div>
                  </th>`
                : ''
            }
            ${
              activeMilestoneCount > 0
                ? `<th style="padding: 10px 12px; vertical-align: middle; border: 1px solid #334155; background-color: #1e293b; color: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: space-between; height: 100%;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="font-size: 11.5px; font-weight: 900; color: #ffffff; display: inline-flex; align-items: center; line-height: 1;">PHẦN 4:</span>
                        <span style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.2px; display: inline-flex; align-items: center; line-height: 1;">8 ĐIỂM DỪNG NGHIỆM THU CHUẨN QCQS ME-CK</span>
                      </div>
                      <span style="font-size: 9.5px; color: #fca5a5; font-weight: 700; background-color: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); padding: 3px 8px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;">
                        ⚡ Active: Mốc đang thực hiện (viền đỏ)
                      </span>
                    </div>
                  </th>`
                : ''
            }
            ${
              options.showGhiChu
                ? '<th style="padding: 10px 8px; width: 140px; border: 1px solid #334155; background-color: #0f172a; color: #ffffff; text-align: center; vertical-align: middle; font-size: 12px; font-weight: 800;">GHI CHÚ</th>'
                : ''
            }
          </tr>
        </thead>
      `;
    }

    // MULTI_COLUMN Mode Table Header
    let headerRow1 = '';
    if (options.showStt) {
      headerRow1 += `<th rowspan="${activeMilestoneCount > 0 ? 2 : 1}" style="padding: 10px 6px; text-align: center; vertical-align: middle; width: 44px; border: 1px solid #334155; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff;">STT</th>`;
    }
    if (options.showProjectInfo) {
      headerRow1 += `<th rowspan="${activeMilestoneCount > 0 ? 2 : 1}" style="padding: 10px 10px; vertical-align: middle; width: 240px; border: 1px solid #334155; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff;">TÊN CÔNG TRÌNH & HỒ SƠ</th>`;
    }
    if (options.showProgressStatus) {
      headerRow1 += `<th rowspan="${activeMilestoneCount > 0 ? 2 : 1}" style="padding: 10px 10px; vertical-align: middle; width: 200px; border: 1px solid #334155; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff;">TIẾN ĐỘ & TRẠNG THÁI</th>`;
    }
    if (options.showGantt) {
      headerRow1 += `<th rowspan="${activeMilestoneCount > 0 ? 2 : 1}" style="padding: 10px 10px; vertical-align: middle; width: 240px; text-align: center; border: 1px solid #334155; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff;">PHẦN 3: GANTT BAR (HĐ ➔ ĐỢT 3 XD+ME)</th>`;
    }

    if (activeMilestoneCount > 0) {
      headerRow1 += `<th colspan="${activeMilestoneCount}" style="padding: 10px 10px; text-align: center; vertical-align: middle; border: 1px solid #1e40af; font-size: 12px; font-weight: 800; background-color: #1d4ed8; color: #ffffff; letter-spacing: 0.3px; text-transform: uppercase;">CHI TIẾT MỐC NGHIỆM THU (${activeMilestoneCount} MỐC)</th>`;
    }

    if (options.showGhiChu) {
      headerRow1 += `<th rowspan="${activeMilestoneCount > 0 ? 2 : 1}" style="padding: 10px 10px; vertical-align: middle; width: 150px; border: 1px solid #334155; font-size: 11.5px; font-weight: 800; background-color: #1e293b; color: #ffffff; text-align: center;">GHI CHÚ</th>`;
    }

    const milestoneLabels: Record<MilestoneKey, string> = {
      m1: 'Đợt 1: XD_Phần thô',
      m2: 'Đợt 2: ME_Tập kết TB',
      m3: 'Đợt 3: Xây lắp & CT',
      m4: 'Đợt 4: VH_Vận hành',
      m5: 'Đợt 5: GPMT/ĐKMT',
      m6: 'Đợt 6: Bàn giao CT',
      m7: 'Đợt 7: Thanh lý HĐ',
      m8: 'Khác',
    };

    let headerRow2 = '';
    if (activeMilestoneCount > 0) {
      headerRow2 = activeMilestones
        .map(
          (key) =>
            `<th style="padding: 8px 6px; width: 95px; border: 1px solid #cbd5e1; background-color: #f1f5f9; color: #0f172a; font-size: 10px; font-weight: 800; text-align: center; vertical-align: middle;">${milestoneLabels[key]}</th>`
        )
        .join('');
    }

    return `
      <thead>
        <tr style="text-align: left; height: 38px;">
          ${headerRow1}
        </tr>
        ${
          activeMilestoneCount > 0
            ? `<tr style="text-align: center; height: 32px;">${headerRow2}</tr>`
            : ''
        }
      </thead>
    `;
  };

  // Helper: Render project row HTML
  const renderProjectRowHtml = (p: Project, globalIdx: number) => {
    const isWebMatch = options.layoutStyle !== 'MULTI_COLUMN';
    const statusInfo = calculateProjectStatus(p);
    const completionPct = getProjectCompletionPercentage(p);
    const projectDefs = getProjectMilestoneDefs(p);

    let signedCount = 0;
    const m = p.milestones || {};
    projectDefs.forEach((def) => {
      if (m[def.key]?.ngayKy) signedCount++;
    });

    // Find active milestone index (first un-signed)
    let activeMilestoneIndex = -1;
    for (let i = 0; i < projectDefs.length; i++) {
      const key = projectDefs[i].key;
      const data = m[key] || {};
      if (!data.ngayKy) {
        activeMilestoneIndex = i;
        break;
      }
    }

    let badgeBg = '#eff6ff';
    let badgeColor = '#1d4ed8';
    let badgeBorder = '#bfdbfe';

    if (statusInfo.key === 'HOAN_THANH') {
      badgeBg = '#f0fdf4';
      badgeColor = '#15803d';
      badgeBorder = '#bbf7d0';
    } else if (statusInfo.key === 'CHAM_KY') {
      badgeBg = '#fff1f2';
      badgeColor = '#be123c';
      badgeBorder = '#fecdd3';
    } else if (statusInfo.key === 'TRE_TIEN_DO') {
      badgeBg = '#fef2f2';
      badgeColor = '#b91c1c';
      badgeBorder = '#fca5a5';
    } else if (statusInfo.key === 'DANG_TRINH_KY') {
      badgeBg = '#fefce8';
      badgeColor = '#ca8a04';
      badgeBorder = '#fef08a';
    } else if (statusInfo.key === 'GIA_HAN') {
      badgeBg = '#faf5ff';
      badgeColor = '#6b21a8';
      badgeBorder = '#e9d5ff';
    }

    const rowBg = globalIdx % 2 === 1 ? '#f8fafc' : '#ffffff';

    if (isWebMatch) {
      // Segmented Progress Bar
      const segmentDivsHtml = projectDefs.map((def, mIdx) => {
        const item = m[def.key] || {};
        const isSigned = !!item.ngayKy;
        const isSubmitting = !!item.ngayTrinh && !item.ngayKy;
        const isActive = mIdx === activeMilestoneIndex;

        let segBg = '#cbd5e1';
        if (isSigned) segBg = '#10b981';
        else if (isActive) segBg = '#ef4444';
        else if (isSubmitting) segBg = '#f59e0b';

        return `<div style="flex: 1; height: 100%; background-color: ${segBg}; border-radius: 2px;"></div>`;
      }).join('');

      let pctColor = '#2563eb';
      if (completionPct === 100) pctColor = '#059669';
      else if (completionPct < 50) pctColor = '#d97706';

      let cells = '';

      if (options.showStt) {
        cells += `<td style="padding: 10px 6px; text-align: center; vertical-align: middle; font-weight: 800; color: #1e293b; border: 1px solid #cbd5e1; width: 48px; font-size: 12px;">${globalIdx + 1}</td>`;
      }

      if (options.showProjectInfo) {
        cells += `
          <td style="padding: 10px 12px; border: 1px solid #cbd5e1; width: 330px; vertical-align: middle;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <span style="font-weight: 900; color: #1d4ed8; font-size: 12.5px; letter-spacing: 0.2px; display: inline-flex; align-items: center;">${p.maCongTrinh}</span>
              <span style="font-size: 10.5px; background-color: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;">${p.soHopDong || 'Chưa HĐ'}</span>
            </div>
            <div style="font-weight: 800; color: #0f172a; font-size: 13px; line-height: 1.4; margin-bottom: 6px;">${p.tenCongTrinh}</div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; margin-bottom: 4px;">
                <span style="font-weight: 700; color: #334155; display: inline-flex; align-items: center;">Tiến Độ Mốc: <strong style="color: #0f172a; margin-left: 4px;">${signedCount}/${projectDefs.length} Ký</strong></span>
                <span style="font-weight: 900; color: ${pctColor}; font-family: monospace; display: inline-flex; align-items: center;">${completionPct}%</span>
              </div>
              <div style="display: flex; gap: 3px; height: 8px; background-color: #e2e8f0; border-radius: 4px; padding: 1.5px; box-sizing: border-box; align-items: center;">
                ${segmentDivsHtml}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #475569; font-weight: 600;">
              <span style="display: inline-flex; align-items: center;">HĐ: <strong style="margin-left: 3px; color: #0f172a;">${formatDate(p.ngayHopDong)}</strong></span>
              <span style="display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 800;">
                ${statusInfo.label}
              </span>
            </div>
          </td>
        `;
      }

      if (options.showProgressStatus) {
        cells += `
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; width: 185px; vertical-align: middle;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; font-family: monospace; text-align: center; align-items: stretch;">
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 7px 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #64748b; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 4px;">HĐ</span>
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: #1e293b; font-size: 10px; line-height: 1;">${formatShortDate(p.tienDoHopDong)}</span>
              </div>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 5px; padding: 7px 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #2563eb; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 4px;">TGĐ</span>
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: #1e40af; font-size: 10px; line-height: 1;">${formatShortDate(p.tienDoTgdDuyet)}</span>
              </div>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 5px; padding: 7px 3px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #059669; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 4px;">Thực tế</span>
                <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: #166534; font-size: 10px; line-height: 1;">${formatShortDate(p.tienDoThucTe)}</span>
              </div>
            </div>
          </td>
        `;
      }

      if (options.showGantt) {
        cells += `
          <td style="padding: 10px 8px; border: 1px solid #cbd5e1; width: 300px; vertical-align: middle;">
            ${renderGanttCellHtml(p, completionPct, signedCount)}
          </td>
        `;
      }

      if (activeMilestones.length > 0) {
        const milestoneShortTitles: Record<MilestoneKey, string> = {
          m1: 'XD_Phần thô',
          m2: 'ME_Tập kết TB',
          m3: 'XD+ME Xây lắp',
          m4: 'VH_Vận hành',
          m5: 'GPMT/ĐKMT',
          m6: 'Bàn giao CT',
          m7: 'Thanh lý HĐ',
          m8: 'Khác',
        };

        const filteredDefs = projectDefs.filter((def) => options.milestones[def.key]);

        const milestoneCardsHtml = filteredDefs.map((def) => {
          const data = m[def.key] || {};
          const isSigned = !!data.ngayKy;
          const isSubmitting = !!data.ngayTrinh && !data.ngayKy;
          const mGlobalIdx = projectDefs.findIndex(d => d.key === def.key);
          const isActive = mGlobalIdx === activeMilestoneIndex;

          let cardBorder = '1px solid #cbd5e1';
          let cardBg = '#ffffff';
          let statusTag = '';

          if (isSigned) {
            cardBorder = '1.5px solid #a7f3d0';
            cardBg = '#f0fdf4';
            statusTag = '';
          } else if (isActive) {
            cardBorder = '2px solid #ef4444';
            cardBg = '#fef2f2';
            statusTag = '<span style="font-size: 8.5px; color: #991b1b; font-weight: 800; background-color: transparent; padding: 2px 0px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;">⚡ Active</span>';
          } else if (isSubmitting) {
            cardBorder = '1.5px solid #fde68a';
            cardBg = '#fefce8';
            statusTag = '<span style="font-size: 8.5px; color: #ca8a04; font-weight: 800; background-color: transparent; padding: 2px 0px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;">⏳ Trình</span>';
          } else {
            statusTag = '<span style="font-size: 8.5px; color: #64748b; font-weight: 700; background-color: transparent; padding: 2px 0px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 1;">○ Chưa</span>';
          }

          const ntVal = formatShortDate(data.nt_tgd || data.nt_hd);
          const trinhVal = formatShortDate(data.ngayTrinh);
          const kyVal = formatShortDate(data.ngayKy);

          const hasNt = ntVal !== '-' && ntVal !== '...';
          const ntBoxBg = hasNt ? '#f1f5f9' : '#f8fafc';
          const ntBorder = hasNt ? '#cbd5e1' : '#e2e8f0';
          const ntLabelColor = hasNt ? '#475569' : '#94a3b8';
          const ntValColor = hasNt ? '#1e293b' : '#64748b';

          const hasTrinh = trinhVal !== '-' && trinhVal !== '...';
          const trinhBoxBg = hasTrinh ? '#ffffff' : '#f8fafc';
          const trinhBorder = hasTrinh ? '#fde68a' : '#e2e8f0';
          const trinhLabelColor = hasTrinh ? '#d97706' : '#94a3b8';
          const trinhValColor = hasTrinh ? '#78350f' : '#64748b';

          const hasKy = kyVal !== '-' && kyVal !== '...';
          const kyBoxBg = hasKy ? '#ffffff' : '#f8fafc';
          const kyBorder = hasKy ? '#a7f3d0' : '#e2e8f0';
          const kyLabelColor = hasKy ? '#059669' : '#94a3b8';
          const kyValColor = hasKy ? '#065f46' : '#64748b';

          const dotLabel = def.label.includes(':') ? def.label.split(':')[0].trim() : `Đợt ${mGlobalIdx + 1}`;
          const titleText = def.label.includes(':') ? def.label.split(':')[1].trim() : def.label;

          return `
            <div style="border: ${cardBorder}; background-color: ${cardBg}; border-radius: 6px; padding: 6px 5px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; min-width: 0; width: 100%; height: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; font-weight: 800; min-height: 20px; width: 100%; gap: 4px;">
                <span style="color: #0f172a; font-size: 9.5px; font-weight: 800; white-space: nowrap; display: inline-block; line-height: 1.2; vertical-align: middle;">${dotLabel}</span>
                ${statusTag}
              </div>
              <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; text-align: center; padding: 2px 0 4px 0; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.25; min-height: 22px; word-break: break-word;">${titleText}</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3px; font-size: 8.5px; font-family: monospace; text-align: center; align-items: stretch; width: 100%;">
                <div style="background-color: ${ntBoxBg}; border: 1px solid ${ntBorder}; border-radius: 3.5px; padding: 4px 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8px; color: ${ntLabelColor}; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 2px;">NT</span>
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: ${ntValColor}; font-size: 8.5px; line-height: 1;">${ntVal === '-' ? '...' : ntVal}</span>
                </div>
                ${
                  isSigned
                    ? `
                <div style="background-color: ${kyBoxBg}; border: 1px solid ${kyBorder}; border-radius: 3.5px; padding: 4px 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8px; color: ${kyLabelColor}; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 2px;">Ký</span>
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: ${kyValColor}; font-size: 8.5px; line-height: 1;">${kyVal === '-' ? '...' : kyVal}</span>
                </div>
                `
                    : `
                <div style="background-color: ${trinhBoxBg}; border: 1px solid ${trinhBorder}; border-radius: 3.5px; padding: 4px 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-size: 8px; color: ${trinhLabelColor}; font-family: sans-serif; font-weight: 800; line-height: 1; margin-bottom: 2px;">Trình</span>
                  <span style="display: flex; align-items: center; justify-content: center; text-align: center; font-weight: 800; color: ${trinhValColor}; font-size: 8.5px; line-height: 1;">${trinhVal === '-' ? '...' : trinhVal}</span>
                </div>
                `
                }
              </div>
            </div>
          `;
        }).join('');

        cells += `
          <td style="padding: 8px; border: 1px solid #cbd5e1; vertical-align: middle;">
            <div style="display: grid; grid-template-columns: repeat(${filteredDefs.length}, 1fr); gap: 6px; align-items: stretch; width: 100%;">
              ${milestoneCardsHtml}
            </div>
          </td>
        `;
      }

      if (options.showGhiChu) {
        cells += `
          <td style="padding: 8px; border: 1px solid #cbd5e1; width: 140px; vertical-align: middle; text-align: center; font-size: 11px; color: #334155; line-height: 1.4;">
            ${p.ghiChu ? p.ghiChu : '<span style="color: #94a3b8; font-style: italic;">Không có ghi chú</span>'}
          </td>
        `;
      }

      return `<tr style="background-color: ${rowBg}; border-bottom: 1px solid #cbd5e1;">${cells}</tr>`;
    }

    // MULTI_COLUMN Mode Row Rendering
    let cells = '';

    if (options.showStt) {
      cells += `<td style="padding: 8px; text-align: center; font-weight: 800; color: #1e293b; border: 1px solid #cbd5e1; width: 44px; font-size: 12px;">${globalIdx + 1}</td>`;
    }

    if (options.showProjectInfo) {
      cells += `
        <td style="padding: 8px; border: 1px solid #cbd5e1; width: 240px; vertical-align: top;">
          <div style="font-weight: 800; color: #0f172a; font-size: 12px; margin-bottom: 4px; line-height: 1.35;">${p.tenCongTrinh}</div>
          <div style="font-size: 10.5px; color: #475569; margin-bottom: 2px;">Mã CT: <strong style="color: #1e293b;">${p.maCongTrinh}</strong></div>
          <div style="font-size: 10.5px; color: #64748b;">Số HĐ: ${p.soHopDong || 'Chưa có'} (${formatDate(p.ngayHopDong)})</div>
        </td>
      `;
    }

    if (options.showProgressStatus) {
      cells += `
        <td style="padding: 8px; border: 1px solid #cbd5e1; width: 200px; vertical-align: top;">
          <div style="font-size: 10.5px; color: #334155; margin-bottom: 3px;">• Hạn HĐ: <strong style="color: #0f172a;">${formatDate(p.tienDoHopDong)}</strong></div>
          <div style="font-size: 10.5px; color: #334155; margin-bottom: 3px;">• Hạn TGĐ duyệt: <strong style="color: #0f172a;">${formatDate(p.tienDoTgdDuyet)}</strong></div>
          <div style="font-size: 10.5px; color: #334155; margin-bottom: 5px;">• Thực tế: <strong style="color: #0f172a;">${formatDate(p.tienDoThucTe)}</strong></div>
          <div style="margin-top: 4px;">
            <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 4px; padding: 3px 8px; font-size: 10px; font-weight: 800;">
              ${statusInfo.label}
            </span>
          </div>
        </td>
      `;
    }

    if (options.showGantt) {
      cells += `
        <td style="padding: 8px; border: 1px solid #cbd5e1; width: 240px; vertical-align: middle;">
          ${renderGanttCellHtml(p, completionPct, signedCount)}
        </td>
      `;
    }

    activeMilestones.forEach((key) => {
      const isAct = key === projectDefs[activeMilestoneIndex]?.key;
      cells += `<td style="padding: 5px; border: 1px solid #cbd5e1; vertical-align: middle;">${renderMilestoneCellHtml(m[key], isAct)}</td>`;
    });

    if (options.showGhiChu) {
      cells += `
        <td style="padding: 8px; border: 1px solid #cbd5e1; width: 150px; vertical-align: top; font-size: 10.5px; color: #334155; line-height: 1.35;">
          ${p.ghiChu ? p.ghiChu : '<span style="color: #94a3b8; font-style: italic;">Không có ghi chú</span>'}
        </td>
      `;
    }

    return `<tr style="background-color: ${rowBg}; border-bottom: 1px solid #cbd5e1;">${cells}</tr>`;
  };

  const isWebMatchMode = options.layoutStyle !== 'MULTI_COLUMN';

  const totalCols =
    (options.showStt ? 1 : 0) +
    (options.showProjectInfo ? 1 : 0) +
    (options.showProgressStatus ? 1 : 0) +
    (options.showGantt ? 1 : 0) +
    (isWebMatchMode ? (activeMilestones.length > 0 ? 1 : 0) : activeMilestones.length) +
    (options.showGhiChu ? 1 : 0);

  // 3. Page Capacity Calculation
  const hasPage1Overview = options.includeKpi || (options.includeCharts && !!chartsImgUrl);
  const page1Capacity = hasPage1Overview ? 4 : 6;
  const subsequentCapacity = 6;

  const pageChunks: { pageNum: number; projects: { project: Project; globalIdx: number }[] }[] = [];
  let currentIdx = 0;
  let pageNumCounter = 1;

  if (filteredProjects.length === 0) {
    pageChunks.push({ pageNum: 1, projects: [] });
  } else {
    while (currentIdx < filteredProjects.length) {
      const cap = pageNumCounter === 1 ? page1Capacity : subsequentCapacity;
      const chunk = filteredProjects.slice(currentIdx, currentIdx + cap).map((p, i) => ({
        project: p,
        globalIdx: currentIdx + i,
      }));
      pageChunks.push({ pageNum: pageNumCounter, projects: chunk });
      currentIdx += cap;
      pageNumCounter++;
    }
  }

  const totalReportPages = pageChunks.length;

  // 4. Render pages and generate dynamic landscape PDF
  let pdf: jsPDF | null = null;
  const pdfWidthMm = 420; // 420mm base width for generous horizontal space

  for (let pIdx = 0; pIdx < pageChunks.length; pIdx++) {
    const chunkInfo = pageChunks[pIdx];
    const pageNum = chunkInfo.pageNum;

    const pageDiv = document.createElement('div');
    pageDiv.style.position = 'absolute';
    pageDiv.style.left = '-9999px';
    pageDiv.style.top = '0';
    pageDiv.style.width = '1600px';
    pageDiv.style.backgroundColor = '#ffffff';
    pageDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    pageDiv.style.color = '#0f172a';
    pageDiv.style.padding = '24px';
    pageDiv.style.boxSizing = 'border-box';

    let pageHeaderContent = '';

    if (pageNum === 1) {
      // Main Banner
      pageHeaderContent = `
        <div style="background-color: #0f172a; color: #ffffff; padding: 20px 24px; border-radius: 8px; margin-bottom: 16px; border-bottom: 4px solid #2563eb;">
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 0.3px; margin-bottom: 8px; text-transform: uppercase;">
            PHÒNG QCQS ME-CK — BÁO CÁO GIÁM SÁT NGHIỆM THU & THANH TOÁN CÔNG TRÌNH
          </div>
          <div style="font-size: 12px; color: #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-weight: 600;">
            <span>Thời gian xuất báo cáo: <strong style="color: #38bdf8;">${nowStr}</strong></span>
            <span>Tổng số công trình: <strong style="color: #4ade80;">${filteredProjects.length} / ${totalProjectsCount}</strong> CT</span>
          </div>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 16px; margin-bottom: 18px; font-size: 12px; color: #334155; font-weight: 600;">
          <span style="color: #1e293b; font-weight: 800;">Bộ lọc áp dụng:</span> ${filterText}
        </div>
      `;

      // KPI Section
      if (options.includeKpi) {
        pageHeaderContent += `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.3px;">
              1. CHỈ SỐ KPI TỔNG QUAN
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; align-items: stretch;">
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 5px;">${kpiSummary.total}</div>
                <div style="font-size: 11px; font-weight: 800; color: #475569; line-height: 1.2;">Tổng Công Trình</div>
              </div>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #15803d; line-height: 1; margin-bottom: 5px;">${kpiSummary.completed}</div>
                <div style="font-size: 11px; font-weight: 800; color: #166534; line-height: 1.2;">Hoàn Thành (8 Mốc)</div>
              </div>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #1d4ed8; line-height: 1; margin-bottom: 5px;">${kpiSummary.signing}</div>
                <div style="font-size: 11px; font-weight: 800; color: #1e40af; line-height: 1.2;">Đang Trình Ký</div>
              </div>
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #be123c; line-height: 1; margin-bottom: 5px;">${kpiSummary.lateSign}</div>
                <div style="font-size: 11px; font-weight: 800; color: #9f1239; line-height: 1.2;">Chậm Ký (>7 Ngày)</div>
              </div>
              <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #ca8a04; line-height: 1; margin-bottom: 5px;">${kpiSummary.delayTgd}</div>
                <div style="font-size: 11px; font-weight: 800; color: #854d0e; line-height: 1.2;">Trễ Tiến Độ TGD</div>
              </div>
              <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 12px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="font-size: 22px; font-weight: 900; color: #7c3aed; line-height: 1; margin-bottom: 5px;">${kpiSummary.extended}</div>
                <div style="font-size: 11px; font-weight: 800; color: #6b21a8; line-height: 1.2;">Hợp Đồng Gia Hạn</div>
              </div>
            </div>
          </div>
        `;
      }

      // Charts Section
      if (options.includeCharts && chartsImgUrl) {
        pageHeaderContent += `
          <div style="margin-bottom: 20px;">
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.3px;">
              2. BIỂU ĐỒ PHÂN BỔ QUARTILE & XU HƯỚNG TẮC NGHỄN
            </div>
            <img src="${chartsImgUrl}" style="width: 100%; border-radius: 8px; border: 1px solid #cbd5e1; display: block;" />
          </div>
        `;
      }
    } else {
      // Compact Header for Page 2+
      pageHeaderContent = `
        <div style="background-color: #0f172a; color: #ffffff; padding: 14px 20px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 15px; font-weight: 900; letter-spacing: 0.3px; text-transform: uppercase;">
            PHÒNG QCQS ME-CK — BÁO CÁO GIÁM SÁT NGHIỆM THU & THANH TOÁN CÔNG TRÌNH
          </div>
          <div style="font-size: 12px; color: #38bdf8; font-weight: 800;">
            Trang ${pageNum} / ${totalReportPages}
          </div>
        </div>
      `;
    }

    const tableRowsChunkHtml = chunkInfo.projects
      .map(({ project, globalIdx }) => renderProjectRowHtml(project, globalIdx))
      .join('');

    const sectionTitleText =
      pageNum === 1
        ? `BẢNG CHI TIẾT CÔNG TRÌNH & TIẾN ĐỘ QCQS (Trang ${pageNum} / ${totalReportPages})`
        : `BẢNG CHI TIẾT CÔNG TRÌNH & TIẾN ĐỘ QCQS (Trang ${pageNum} / ${totalReportPages} - Tiếp Theo)`;

    const signatureBlockHtml =
      pageNum === totalReportPages
        ? `
        <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #cbd5e1; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-family: inherit;">
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">NGƯỜI LẬP BÁO CÁO</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 3px; font-weight: 600;">(Ký & ghi rõ họ tên)</div>
            <div style="height: 55px;"></div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">CẤP QUẢN LÝ QCQS ME-CK</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 3px; font-weight: 600;">(Ký & ghi rõ họ tên)</div>
            <div style="height: 55px;"></div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">TỔNG GIÁM ĐỐC PHÊ DUYỆT</div>
            <div style="font-size: 9.5px; color: #64748b; margin-top: 3px; font-weight: 600;">(Ký & duyệt)</div>
            <div style="height: 55px;"></div>
          </div>
        </div>
      `
        : '';

    pageDiv.innerHTML = `
      <div style="width: 100%; box-sizing: border-box; line-height: 1.4;">
        ${pageHeaderContent}

        <div>
          <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.3px;">
            ${sectionTitleText}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: inherit;">
            ${renderTableHeaderHtml()}
            <tbody>
              ${
                tableRowsChunkHtml ||
                `<tr><td colspan="${totalCols}" style="padding: 24px; text-align: center; color: #64748b; font-weight: 700; font-size: 13px;">Không có công trình nào phù hợp với bộ lọc.</td></tr>`
              }
            </tbody>
          </table>
        </div>

        ${signatureBlockHtml}

        <div style="margin-top: 20px; padding-top: 10px; border-top: 1.5px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; font-weight: 700;">
          <div>PHÒNG QCQS ME-CK — BÁO CÁO GIÁM SÁT NGHIỆM THU & THANH TOÁN CÔNG TRÌNH</div>
          <div>Trang ${pageNum} / ${totalReportPages}</div>
        </div>
      </div>
    `;

    document.body.appendChild(pageDiv);

    // Capture Page Block
    const canvas = await html2canvas(pageDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(pageDiv);

    const imgData = canvas.toDataURL('image/png');
    const imgWidthMm = 400; // 400mm printable width (10mm margins on left & right)
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
    const pageHeightMm = imgHeightMm + 14; // Dynamic height for image + top/bottom padding

    if (!pdf) {
      pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidthMm, pageHeightMm],
      });
    } else {
      pdf.addPage([pdfWidthMm, pageHeightMm], 'landscape');
    }

    // Top navy header bar
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pdfWidthMm, 4, 'F');

    // Add image starting at Y = 8mm
    pdf.addImage(imgData, 'PNG', 10, 8, imgWidthMm, imgHeightMm);
  }

  if (pdf) {
    const filenameDate = new Date().toISOString().slice(0, 10);
    pdf.save(`Bao_Cao_QCQS_${filenameDate}.pdf`);
  }
}
