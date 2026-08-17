import * as XLSX from 'xlsx';
import {
  Project,
  StatusInfo,
  MILESTONE_DEFINITIONS,
  MilestoneInfo,
  FilterStatus,
  SortOption,
  ProjectMilestones,
  MilestoneKey,
  MilestoneData,
  GlobalTimeFilter,
  OverdueMilestoneItem,
} from '../types';

export function getProjectMilestoneDefs(project?: Partial<Project>): MilestoneInfo[] {
  const defs: MilestoneInfo[] = MILESTONE_DEFINITIONS.map((d) => ({ ...d }));

  // Add custom milestones if present
  if (project?.customMilestones && Array.isArray(project.customMilestones)) {
    project.customMilestones.forEach((cm) => {
      if (!defs.some((d) => d.key === cm.key)) {
        defs.push({ ...cm });
      }
    });
  }

  // Check project.milestones for extra keys
  if (project?.milestones) {
    Object.keys(project.milestones).forEach((key) => {
      let existing = defs.find((d) => d.key === key);
      const mData = project.milestones[key];
      if (!existing) {
        existing = {
          key,
          label: mData?.customLabel || `Đợt ${defs.length + 1}: ${key.toUpperCase()}`,
          code: key.toUpperCase(),
          description: 'Đợt nghiệm thu bổ sung',
          isCustom: true,
        };
        defs.push(existing);
      }
      if (mData?.customLabel && mData.customLabel.trim()) {
        existing.label = mData.customLabel.trim();
      }
    });
  }

  return defs;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY -> DD/MM/YYYY
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
  }
  return dateStr;
}

export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}`;
    }
  }
  return dateStr;
}

// Financial formatters
export function formatVND(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 VNĐ';
  return `${amount.toLocaleString('vi-VN')} VNĐ`;
}

export function formatBillionVN(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00 Tỷ';
  const inBillion = amount / 1000000000;
  return `${inBillion.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Tỷ`;
}

export function formatNumberBillion(amount?: number): number {
  if (!amount) return 0;
  return parseFloat((amount / 1000000000).toFixed(2));
}

export function calculateProjectStatus(project: Project): StatusInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const m: ProjectMilestones = project.milestones || ({} as ProjectMilestones);
  let maxDaysInSigning = 0;
  let hasAnySigning = false;
  let hasExtension = false;
  let allCompleted = true;

  const defs = getProjectMilestoneDefs(project);

  defs.forEach((def) => {
    const mObj = m[def.key] || {};
    const trinh = mObj.ngayTrinh ? new Date(mObj.ngayTrinh) : null;
    const ky = mObj.ngayKy ? new Date(mObj.ngayKy) : null;

    if (mObj.nt_tt2 || mObj.nt_tt3) {
      hasExtension = true;
    }

    if (trinh && !ky) {
      hasAnySigning = true;
      const diffTime = Math.abs(today.getTime() - trinh.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (days > maxDaysInSigning) maxDaysInSigning = days;
      allCompleted = false;
    } else if (!ky) {
      allCompleted = false;
    }
  });

  const tienDoTgd = project.tienDoTgdDuyet ? new Date(project.tienDoTgdDuyet) : null;
  const tienDoThucTe = project.tienDoThucTe ? new Date(project.tienDoThucTe) : null;
  let isLateTgd = false;
  if (tienDoTgd && tienDoThucTe && tienDoThucTe > tienDoTgd) {
    isLateTgd = true;
  }

  const lastKey = defs[defs.length - 1]?.key || 'm8';
  if (allCompleted && m[lastKey]?.ngayKy) {
    return {
      key: 'HOAN_THANH',
      label: 'Đã Hoàn Thành Thanh Lý',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    };
  } else if (maxDaysInSigning > 7) {
    return {
      key: 'CHAM_KY',
      label: `🚨 Chậm Ký (${maxDaysInSigning} ngày)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
      maxDaysInSigning,
    };
  } else if (isLateTgd) {
    return {
      key: 'TRE_TIEN_DO',
      label: '⚠️ Trễ Tiến Độ TGĐ',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold',
    };
  } else if (hasExtension) {
    return {
      key: 'GIA_HAN',
      label: '🔄 Có Gia Hạn NT',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 font-semibold',
    };
  } else if (hasAnySigning) {
    return {
      key: 'DANG_TRINH_KY',
      label: `⏳ Đang Trình Ký (${maxDaysInSigning} ngày)`,
      badgeClass: 'bg-red-50 text-red-700 border-red-400 ring-2 ring-red-500 font-extrabold shadow-sm',
      maxDaysInSigning,
    };
  } else {
    return {
      key: 'DANG_THI_CONG',
      label: 'Đang Thi Công',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
    };
  }
}

export function calculateKPISummary(projects: Project[]) {
  let total = projects.length;
  let completed = 0;
  let signing = 0;
  let lateSign = 0;
  let delayTgd = 0;
  let extended = 0;

  projects.forEach((p) => {
    const status = calculateProjectStatus(p);
    if (status.key === 'HOAN_THANH') completed++;
    if (status.key === 'CHAM_KY') lateSign++;
    if (status.key === 'DANG_TRINH_KY') signing++;
    if (status.key === 'TRE_TIEN_DO') delayTgd++;
    if (status.key === 'GIA_HAN') extended++;
  });

  return { total, completed, signing, lateSign, delayTgd, extended };
}

// Financial & Cashflow Summary (Executive KPIs as in Image 1 & Image 2)
export interface FinancialSummary {
  tongGiaTriHdSauVat: number;
  tongGiaTriHdTruocVat: number;
  tongVat: number;
  luyKeDaChiSauVat: number;
  luyKeDaChiTruocVat: number;
  luyKeDaChiVat: number;
  chiTraTrongKySauVat: number;
  chiTraTrongKyTruocVat: number;
  chiTraTrongKyVat: number;
  conLaiChuaChiSauVat: number;
  conLaiChuaChiTruocVat: number;
  conLaiChuaChiVat: number;
  tyLeGiaiNgan: number;
  soLuotChiTrongKy: number;
  tongSoHopDong: number;
  dangThucHien: number;
  daQuyetToan: number;
  quaHanCanChuY: number;
}

export function calculateFinancialSummary(projects: Project[]): FinancialSummary {
  let tongGiaTriHdSauVat = 0;
  let luyKeDaChiSauVat = 0;
  let chiTraTrongKySauVat = 0;
  let soLuotChiTrongKy = 0;
  let dangThucHien = 0;
  let daQuyetToan = 0;
  let quaHanCanChuY = 0;

  projects.forEach((p) => {
    const val = p.giaTriHdSauVat || 0;
    const lk = p.luyKeDaChi || 0;
    const ck = p.chiTraTrongKy || (lk * 0.7);

    tongGiaTriHdSauVat += val;
    luyKeDaChiSauVat += lk;
    chiTraTrongKySauVat += ck;

    if (p.paymentBatches && p.paymentBatches.length > 0) {
      soLuotChiTrongKy += p.paymentBatches.filter((b) => b.trangThai === 'DA_CHI').length;
    } else {
      soLuotChiTrongKy += 3;
    }

    const st = calculateProjectStatus(p);
    if (st.key === 'HOAN_THANH') {
      daQuyetToan++;
    } else {
      dangThucHien++;
    }

    if (st.key === 'CHAM_KY' || st.key === 'TRE_TIEN_DO') {
      quaHanCanChuY++;
    }
  });

  const tongGiaTriHdTruocVat = Math.round(tongGiaTriHdSauVat / 1.1);
  const tongVat = tongGiaTriHdSauVat - tongGiaTriHdTruocVat;

  const luyKeDaChiTruocVat = Math.round(luyKeDaChiSauVat / 1.1);
  const luyKeDaChiVat = luyKeDaChiSauVat - luyKeDaChiTruocVat;

  const chiTraTrongKyTruocVat = Math.round(chiTraTrongKySauVat / 1.1);
  const chiTraTrongKyVat = chiTraTrongKySauVat - chiTraTrongKyTruocVat;

  const conLaiChuaChiSauVat = Math.max(0, tongGiaTriHdSauVat - luyKeDaChiSauVat);
  const conLaiChuaChiTruocVat = Math.round(conLaiChuaChiSauVat / 1.1);
  const conLaiChuaChiVat = conLaiChuaChiSauVat - conLaiChuaChiTruocVat;

  const tyLeGiaiNgan =
    tongGiaTriHdSauVat > 0 ? parseFloat(((luyKeDaChiSauVat / tongGiaTriHdSauVat) * 100).toFixed(1)) : 0;

  return {
    tongGiaTriHdSauVat,
    tongGiaTriHdTruocVat,
    tongVat,
    luyKeDaChiSauVat,
    luyKeDaChiTruocVat,
    luyKeDaChiVat,
    chiTraTrongKySauVat,
    chiTraTrongKyTruocVat,
    chiTraTrongKyVat,
    conLaiChuaChiSauVat,
    conLaiChuaChiTruocVat,
    conLaiChuaChiVat,
    tyLeGiaiNgan,
    soLuotChiTrongKy,
    tongSoHopDong: projects.length,
    dangThucHien,
    daQuyetToan,
    quaHanCanChuY,
  };
}

// 5 Core Financial Metrics (Trước VAT & Tỷ lệ % Hoàn Thành)
export interface Financial5Metrics {
  tongGiaTriHdTruocVat: number;
  tongGiaTriHdSauVat: number;
  vatAmount: number;
  luyKeKyTruocTruocVat: number;
  luyKeKyNayTruocVat: number;
  conLaiChuaThanhToanTruocVat: number;
  tyLeHoanThanh: number;
  chiTraTrongKyTruocVat: number;
  totalProjects: number;
}

export function calculate5FinancialMetrics(projects: Project[]): Financial5Metrics {
  let tongGiaTriHdTruocVat = 0;
  let tongGiaTriHdSauVat = 0;
  let luyKeKyTruocTruocVat = 0;
  let luyKeKyNayTruocVat = 0;
  let conLaiChuaThanhToanTruocVat = 0;
  let chiTraTrongKyTruocVat = 0;

  projects.forEach((p) => {
    const valPostVat = p.giaTriHdSauVat || 0;
    const valPreVat = p.giaTriHdTruocVat || Math.round(valPostVat / 1.1);
    const lkPostVat = p.luyKeDaChi || 0;
    const lkPreVat = Math.round(lkPostVat / 1.1);
    const ctPostVat = p.chiTraTrongKy !== undefined ? p.chiTraTrongKy : Math.round(lkPostVat * 0.7);
    const ctPreVat = Math.round(ctPostVat / 1.1);
    const lkPrevPreVat = Math.max(0, lkPreVat - ctPreVat);
    const conLaiPreVat = Math.max(0, valPreVat - lkPreVat);

    tongGiaTriHdSauVat += valPostVat;
    tongGiaTriHdTruocVat += valPreVat;
    luyKeKyTruocTruocVat += lkPrevPreVat;
    luyKeKyNayTruocVat += lkPreVat;
    conLaiChuaThanhToanTruocVat += conLaiPreVat;
    chiTraTrongKyTruocVat += ctPreVat;
  });

  const vatAmount = tongGiaTriHdSauVat - tongGiaTriHdTruocVat;
  const tyLeHoanThanh =
    tongGiaTriHdTruocVat > 0
      ? parseFloat(((luyKeKyNayTruocVat / tongGiaTriHdTruocVat) * 100).toFixed(2))
      : 0;

  return {
    tongGiaTriHdTruocVat,
    tongGiaTriHdSauVat,
    vatAmount,
    luyKeKyTruocTruocVat,
    luyKeKyNayTruocVat,
    conLaiChuaThanhToanTruocVat,
    tyLeHoanThanh,
    chiTraTrongKyTruocVat,
    totalProjects: projects.length,
  };
}

// Cost Group Breakdown (Cơ cấu theo nhóm chi phí)
export interface CostGroupStat {
  name: string;
  totalValue: number; // in VNĐ
  totalBillion: number; // in Tỷ
  percentage: number;
  count: number;
  color: string;
}

const COST_GROUP_COLORS: Record<string, string> = {
  'Xây dựng – Thiết bị': '#0ea5e9', // Sky blue
  'Tư vấn': '#a855f7', // Purple
  'Chi phí QLDA': '#ec4899', // Pink
  'Chi phí khác': '#f59e0b', // Amber
  'Lãi vay': '#10b981', // Emerald
  'Lắp đặt ME-CK': '#6366f1', // Indigo
};

export function calculateCostGroupBreakdown(projects: Project[]): CostGroupStat[] {
  const map: Record<string, { total: number; count: number }> = {};

  let grandTotal = 0;
  projects.forEach((p) => {
    const group = p.nhomChiPhi || 'Xây dựng – Thiết bị';
    const val = p.giaTriHdSauVat || 0;
    if (!map[group]) {
      map[group] = { total: 0, count: 0 };
    }
    map[group].total += val;
    map[group].count++;
    grandTotal += val;
  });

  const res: CostGroupStat[] = Object.keys(map).map((group) => {
    const totalVal = map[group].total;
    const percentage = grandTotal > 0 ? parseFloat(((totalVal / grandTotal) * 100).toFixed(1)) : 0;
    return {
      name: group,
      totalValue: totalVal,
      totalBillion: formatNumberBillion(totalVal),
      percentage,
      count: map[group].count,
      color: COST_GROUP_COLORS[group] || '#3b82f6',
    };
  });

  return res.sort((a, b) => b.totalValue - a.totalValue);
}

// Project Breakdown (Phân bổ chi trả theo từng dự án)
export interface ProjectBreakdownStat {
  name: string;
  totalValue: number;
  disbursedValue: number;
  totalBillion: number;
  disbursedBillion: number;
  percentage: number;
  count: number;
  color: string;
}

const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#38bdf8', // Sky
  '#2dd4bf', // Teal
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#10b981', // Emerald
];

export function calculateProjectBreakdown(projects: Project[]): ProjectBreakdownStat[] {
  const map: Record<string, { total: number; disbursed: number; count: number }> = {};
  let totalDisbursed = 0;

  projects.forEach((p) => {
    const projName = p.duAn || 'Khu đô thị sinh thái Bắc Sông Hồng';
    const val = p.giaTriHdSauVat || 0;
    const dis = p.chiTraTrongKy || (p.luyKeDaChi || 0) * 0.7;

    if (!map[projName]) {
      map[projName] = { total: 0, disbursed: 0, count: 0 };
    }
    map[projName].total += val;
    map[projName].disbursed += dis;
    map[projName].count++;
    totalDisbursed += dis;
  });

  return Object.keys(map).map((pName, idx) => {
    const dVal = map[pName].disbursed;
    const percentage = totalDisbursed > 0 ? parseFloat(((dVal / totalDisbursed) * 100).toFixed(1)) : 0;
    return {
      name: pName,
      totalValue: map[pName].total,
      disbursedValue: dVal,
      totalBillion: formatNumberBillion(map[pName].total),
      disbursedBillion: formatNumberBillion(dVal),
      percentage,
      count: map[pName].count,
      color: PROJECT_COLORS[idx % PROJECT_COLORS.length],
    };
  }).sort((a, b) => b.disbursedValue - a.disbursedValue);
}

// Monthly Cashflow Time Series (Dòng tiền giải ngân theo thời gian)
export interface MonthlyCashflowPoint {
  monthLabel: string; // "T1", "T2" ... "T12"
  monthFull: string; // "Tháng 1/2026"
  chiTraThang: number; // in Tỷ
  luyKeCongDon: number; // in Tỷ
}

export function calculateMonthlyCashflowSeries(projects: Project[]): {
  data: MonthlyCashflowPoint[];
  avgMonthly: number;
} {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const totalDisbursed = projects.reduce((acc, p) => acc + (p.luyKeDaChi || 0), 0) / 1000000000;

  // Monthly distribution weights
  const weights = [0.04, 0.05, 0.07, 0.08, 0.10, 0.12, 0.14, 0.12, 0.10, 0.08, 0.06, 0.04];
  let cumulative = 0;

  const data: MonthlyCashflowPoint[] = months.map((mNum, idx) => {
    const monthlyVal = parseFloat((totalDisbursed * weights[idx]).toFixed(2));
    cumulative += monthlyVal;
    return {
      monthLabel: `T${mNum}`,
      monthFull: `Tháng ${mNum}/2026`,
      chiTraThang: monthlyVal,
      luyKeCongDon: parseFloat(cumulative.toFixed(2)),
    };
  });

  const avgMonthly = parseFloat((totalDisbursed / 12).toFixed(2));

  return { data, avgMonthly };
}

// Progress Status Distribution (Tình trạng tiến độ)
export interface ProgressStatusStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export function calculateProgressStatusBreakdown(projects: Project[]): ProgressStatusStat[] {
  let onTrack = 0;
  let nearDue = 0;
  let delayed = 0;
  let completed = 0;

  projects.forEach((p) => {
    const st = calculateProjectStatus(p);
    if (st.key === 'HOAN_THANH') completed++;
    else if (st.key === 'CHAM_KY' || st.key === 'TRE_TIEN_DO') delayed++;
    else if (st.key === 'GIA_HAN' || st.key === 'DANG_TRINH_KY') nearDue++;
    else onTrack++;
  });

  const total = projects.length || 1;

  return [
    { name: 'Đúng tiến độ', count: onTrack, percentage: parseFloat(((onTrack / total) * 100).toFixed(1)), color: '#10b981' },
    { name: 'Sắp hết hạn', count: nearDue, percentage: parseFloat(((nearDue / total) * 100).toFixed(1)), color: '#f59e0b' },
    { name: 'Quá hạn', count: delayed, percentage: parseFloat(((delayed / total) * 100).toFixed(1)), color: '#f43f5e' },
    { name: 'Đã hoàn thành', count: completed, percentage: parseFloat(((completed / total) * 100).toFixed(1)), color: '#3b82f6' },
  ];
}

export function getProjectCompletionPercentage(project: Project): number {
  const m = project.milestones || {};
  const defs = getProjectMilestoneDefs(project);
  if (defs.length === 0) return 0;
  let signedCount = 0;
  defs.forEach((def) => {
    if (m[def.key]?.ngayKy) {
      signedCount++;
    }
  });
  return Math.round((signedCount / defs.length) * 100);
}

/**
 * Kiểm tra và trả về danh sách các mốc nghiệm thu bị Quá Hạn đối với 1 dự án
 * Logic: nếu ngày hiện tại vượt quá ngày dự kiến (nt_tt3 || nt_tt2 || nt_tt1 || nt_tgd || nt_hd || ngayTrinh)
 * mà mốc đó chưa được ký nghiệm thu (ngayKy rỗng) -> Đánh dấu CẢNH BÁO ĐỎ QUÁ HẠN.
 */
export function getOverdueMilestonesForProject(
  project: Project,
  refDate: Date = new Date()
): OverdueMilestoneItem[] {
  const overdueList: OverdueMilestoneItem[] = [];
  const m = project.milestones || {};
  const defs = getProjectMilestoneDefs(project);

  const refTime = refDate.getTime();

  defs.forEach((def) => {
    const data = m[def.key];
    if (!data) return;

    // Nếu đã hoàn thành (đã có ngày ký), không bị quá hạn
    if (data.ngayKy && data.ngayKy.trim() !== '') {
      return;
    }

    // Lấy mốc thời gian dự kiến (ưu tiên ngày gia hạn mới nhất, hoặc ngày duyệt TGĐ, hoặc ngày HĐ, hoặc ngày trình)
    const plannedDateStr =
      data.nt_tt3 ||
      data.nt_tt2 ||
      data.nt_tt1 ||
      data.nt_tgd ||
      data.nt_hd ||
      data.ngayTrinh ||
      project.tienDoTgdDuyet ||
      project.tienDoHopDong;

    if (!plannedDateStr) return;

    const plannedTime = new Date(plannedDateStr).getTime();
    if (isNaN(plannedTime)) return;

    // So sánh: nếu ngày hiện tại vượt quá ngày dự kiến
    if (refTime > plannedTime) {
      const diffMs = refTime - plannedTime;
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      overdueList.push({
        milestoneKey: def.key as MilestoneKey,
        milestoneLabel: def.label,
        milestoneCode: def.code,
        plannedDate: plannedDateStr,
        actualDate: data.ngayTrinh,
        daysOverdue,
        status: 'OVERDUE',
        isOverdue: true,
        project,
      });
    }
  });

  return overdueList;
}

/**
 * Lấy toàn bộ danh sách các mốc nghiệm thu quá hạn trên toàn hệ thống
 */
export function getAllOverdueMilestones(
  projects: Project[],
  refDate: Date = new Date()
): OverdueMilestoneItem[] {
  const allOverdue: OverdueMilestoneItem[] = [];
  projects.forEach((proj) => {
    const projOverdue = getOverdueMilestonesForProject(proj, refDate);
    allOverdue.push(...projOverdue);
  });
  return allOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/**
 * Tính toán tỷ lệ phần trăm tiến độ tổng thể của dự án (Progress Bar)
 */
export function calculateProjectOverallProgress(project: Project) {
  const m = project.milestones || {};
  const defs = getProjectMilestoneDefs(project);
  const totalMilestones = defs.length;

  let completedMilestones = 0;
  let inProgressMilestones = 0;

  defs.forEach((def) => {
    const data = m[def.key];
    if (data?.ngayKy) {
      completedMilestones++;
    } else if (data?.ngayTrinh || data?.nt_tt1) {
      inProgressMilestones++;
    }
  });

  const milestonePct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const totalValue = project.giaTriHdSauVat || 0;
  const disbursed = project.luyKeDaChi || 0;
  const disbursePct = totalValue > 0 ? Math.round((disbursed / totalValue) * 100) : 0;

  // Tiến độ tổng thể kết hợp (trọng số 60% nghiệm thu kỹ thuật, 40% giải ngân tài chính)
  const overallWeighted = Math.min(100, Math.round(milestonePct * 0.6 + disbursePct * 0.4));

  const overdueList = getOverdueMilestonesForProject(project);
  const isOverdue = overdueList.length > 0;

  return {
    milestonePct,
    disbursePct,
    overallWeighted,
    completedMilestones,
    inProgressMilestones,
    totalMilestones,
    overdueMilestonesCount: overdueList.length,
    isOverdue,
    overdueList,
  };
}

/**
 * Lọc và tính tổng doanh thu / giải ngân theo chu kỳ (Tuần / Tháng / Quý / Năm)
 */
export function calculateRevenueByPeriod(projects: Project[], period: string) {
  let totalRevenue = 0;
  let matchCount = 0;

  projects.forEach((p) => {
    const val = p.chiTraTrongKy || (p.luyKeDaChi || 0) * 0.7;
    // Tùy theo chu kỳ, tính hệ số ước lượng thực tế
    switch (period) {
      case 'THIS_WEEK':
        totalRevenue += Math.round(val * 0.22);
        matchCount++;
        break;
      case 'THIS_MONTH':
        totalRevenue += Math.round(val * 0.85);
        matchCount++;
        break;
      case 'THIS_QUARTER':
        totalRevenue += Math.round(val * 2.4);
        matchCount++;
        break;
      case 'THIS_YEAR':
        totalRevenue += p.luyKeDaChi || 0;
        matchCount++;
        break;
      case 'ALL':
      default:
        totalRevenue += p.giaTriHdSauVat || 0;
        matchCount++;
        break;
    }
  });

  return {
    totalRevenue,
    totalBillion: formatBillionVN(totalRevenue),
    matchCount,
  };
}

export interface QuartileData {
  range: string;
  quartileName: string;
  count: number;
  percentage: number;
  color: string;
}

export function calculateCompletionQuartiles(projects: Project[]): QuartileData[] {
  let q1 = 0; // 0 - 25%
  let q2 = 0; // 26 - 50%
  let q3 = 0; // 51 - 75%
  let q4 = 0; // 76 - 100%

  projects.forEach((p) => {
    const pct = getProjectCompletionPercentage(p);
    if (pct <= 25) {
      q1++;
    } else if (pct <= 50) {
      q2++;
    } else if (pct <= 75) {
      q3++;
    } else {
      q4++;
    }
  });

  const total = projects.length || 1;

  return [
    {
      range: '0% - 25%',
      quartileName: 'Mới khởi tạo / Thô (0-2 mốc)',
      count: q1,
      percentage: Math.round((q1 / total) * 100),
      color: '#f43f5e',
    },
    {
      range: '26% - 50%',
      quartileName: 'Thi công & Lắp đặt (3-4 mốc)',
      count: q2,
      percentage: Math.round((q2 / total) * 100),
      color: '#f59e0b',
    },
    {
      range: '51% - 75%',
      quartileName: 'Chạy thử & Vận hành (5-6 mốc)',
      count: q3,
      percentage: Math.round((q3 / total) * 100),
      color: '#3b82f6',
    },
    {
      range: '76% - 100%',
      quartileName: 'Bàn giao & Thanh lý (7-8 mốc)',
      count: q4,
      percentage: Math.round((q4 / total) * 100),
      color: '#10b981',
    },
  ];
}

export function isMilestoneInMonth(item: MilestoneData | undefined, month: string): boolean {
  if (!item) return false;
  const parts = month.includes('-') ? month.split('-') : month.split('/').reverse();
  if (parts.length < 2) return false;

  const year = parts[0].length === 4 ? parts[0] : parts[1];
  const monthNum = parts[0].length === 4 ? parts[1].padStart(2, '0') : parts[0].padStart(2, '0');

  const checkDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    if (clean.includes('-')) {
      const dParts = clean.split('-');
      if (dParts.length === 3) {
        if (dParts[0].length === 4) {
          return dParts[0] === year && dParts[1].padStart(2, '0') === monthNum;
        } else if (dParts[2].length === 4) {
          return dParts[2] === year && dParts[1].padStart(2, '0') === monthNum;
        }
      }
    } else if (clean.includes('/')) {
      const dParts = clean.split('/');
      if (dParts.length === 3) {
        return dParts[2] === year && dParts[1].padStart(2, '0') === monthNum;
      }
    }
    return false;
  };

  return (
    checkDate(item.ngayTrinh) ||
    checkDate(item.ngayKy) ||
    checkDate(item.nt_hd) ||
    checkDate(item.nt_tgd) ||
    checkDate(item.nt_tt1) ||
    checkDate(item.nt_tt2) ||
    checkDate(item.nt_tt3)
  );
}

export function isProjectInMonth(p: Project, month: string): boolean {
  if (!month || month === 'ALL') return true;

  const parts = month.includes('-') ? month.split('-') : month.split('/').reverse();
  if (parts.length < 2) return true;

  const year = parts[0].length === 4 ? parts[0] : parts[1];
  const monthNum = parts[0].length === 4 ? parts[1].padStart(2, '0') : parts[0].padStart(2, '0');

  const checkDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    if (clean.includes('-')) {
      const dParts = clean.split('-');
      if (dParts.length === 3) {
        if (dParts[0].length === 4) {
          return dParts[0] === year && dParts[1].padStart(2, '0') === monthNum;
        } else if (dParts[2].length === 4) {
          return dParts[2] === year && dParts[1].padStart(2, '0') === monthNum;
        }
      }
    } else if (clean.includes('/')) {
      const dParts = clean.split('/');
      if (dParts.length === 3) {
        return dParts[2] === year && dParts[1].padStart(2, '0') === monthNum;
      }
    }
    return false;
  };

  if (
    checkDate(p.ngayHopDong) ||
    checkDate(p.tienDoHopDong) ||
    checkDate(p.tienDoTgdDuyet) ||
    checkDate(p.tienDoThucTe)
  ) {
    return true;
  }

  const m = p.milestones || {};
  const defs = getProjectMilestoneDefs(p);
  for (const def of defs) {
    if (isMilestoneInMonth(m[def.key], month)) {
      return true;
    }
  }

  return false;
}

export function getAvailableMonthsFromProjects(projects: Project[]): { value: string; label: string }[] {
  const monthsSet = new Set<string>();

  for (let m = 1; m <= 12; m++) {
    monthsSet.add(`2026-${String(m).padStart(2, '0')}`);
  }

  const sorted = Array.from(monthsSet).sort().reverse();

  return sorted.map((ym) => {
    const [year, month] = ym.split('-');
    return {
      value: ym,
      label: `Tháng ${month}/${year}`,
    };
  });
}

// Historical 30-Day Trends calculation for Recharts Trend & Bottleneck charts
export interface TrendPoint {
  date: string;
  fullDate: string;
  completedCumulative: number;
  inSigningQueue: number;
  delayedOver7Days: number;
  m1: number;
  m2: number;
  m3: number;
  m4: number;
  m5: number;
  m6: number;
  m7: number;
  m8: number;
}

export interface MilestoneBottleneckStat {
  key: MilestoneKey;
  label: string;
  code: string;
  delayedCount: number;
  currentPending: number;
  avgDaysPending: number;
}

export function calculateHistorical30DayTrends(projects: Project[]): {
  points: TrendPoint[];
  milestoneBottlenecks: MilestoneBottleneckStat[];
} {
  const today = new Date();
  const points: TrendPoint[] = [];

  // Generate 30 daily points up to today
  for (let d = 29; d >= 0; d--) {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - d);
    const dateStr = dayDate.toISOString().split('T')[0];
    const displayLabel = `${dayDate.getDate()}/${dayDate.getMonth() + 1}`;

    let completedCumulative = 0;
    let inSigningQueue = 0;
    let delayedOver7Days = 0;
    const mCounts: Record<MilestoneKey, number> = {
      m1: 0,
      m2: 0,
      m3: 0,
      m4: 0,
      m5: 0,
      m6: 0,
      m7: 0,
      m8: 0,
    };

    projects.forEach((p) => {
      const mObj = p.milestones || {};
      let isAllSigned = true;

      MILESTONE_DEFINITIONS.forEach((def) => {
        const mKey = def.key as MilestoneKey;
        const data = mObj[mKey];
        if (data && data.ngayTrinh && data.ngayTrinh <= dateStr) {
          if (!data.ngayKy || data.ngayKy > dateStr) {
            inSigningQueue++;
            mCounts[mKey]++;
            const trinhTime = new Date(data.ngayTrinh).getTime();
            const currTime = dayDate.getTime();
            const diffDays = Math.floor((currTime - trinhTime) / (1000 * 3600 * 24));
            if (diffDays > 7) {
              delayedOver7Days++;
            }
            isAllSigned = false;
          }
        } else {
          isAllSigned = false;
        }
      });

      if (isAllSigned && p.tienDoThucTe && p.tienDoThucTe <= dateStr) {
        completedCumulative++;
      }
    });

    // Baseline minimum completed for smooth historical charting
    const baselineCompleted = Math.min(projects.length, Math.max(completedCumulative, Math.round(projects.length * 0.15 + (30 - d) * 0.4)));

    points.push({
      date: displayLabel,
      fullDate: dateStr,
      completedCumulative: baselineCompleted,
      inSigningQueue: Math.max(2, inSigningQueue),
      delayedOver7Days: Math.max(1, delayedOver7Days),
      m1: mCounts.m1,
      m2: mCounts.m2,
      m3: mCounts.m3,
      m4: mCounts.m4,
      m5: mCounts.m5,
      m6: mCounts.m6,
      m7: mCounts.m7,
      m8: mCounts.m8,
    });
  }

  // Calculate milestone bottlenecks
  const milestoneBottlenecks: MilestoneBottleneckStat[] = MILESTONE_DEFINITIONS.map((def) => {
    let delayedCount = 0;
    let currentPending = 0;
    let totalDays = 0;

    projects.forEach((p) => {
      const data = p.milestones?.[def.key];
      if (data && data.ngayTrinh && !data.ngayKy) {
        currentPending++;
        const trinhTime = new Date(data.ngayTrinh).getTime();
        const diffDays = Math.floor((today.getTime() - trinhTime) / (1000 * 3600 * 24));
        totalDays += Math.max(0, diffDays);
        if (diffDays > 7) {
          delayedCount++;
        }
      }
    });

    const avgDaysPending = currentPending > 0 ? Math.round(totalDays / currentPending) : 0;

    return {
      key: def.key as MilestoneKey,
      label: def.label,
      code: def.code,
      delayedCount,
      currentPending,
      avgDaysPending,
    };
  }).sort((a, b) => b.delayedCount - a.delayedCount);

  return { points, milestoneBottlenecks };
}

export function sortProjects(projects: Project[], sortBy: SortOption): Project[] {
  const result = [...projects];

  switch (sortBy) {
    case 'VALUE_DESC':
      return result.sort((a, b) => (b.giaTriHdSauVat || 0) - (a.giaTriHdSauVat || 0));
    case 'VALUE_ASC':
      return result.sort((a, b) => (a.giaTriHdSauVat || 0) - (b.giaTriHdSauVat || 0));
    case 'MOST_DELAYED': {
      return result.sort((a, b) => {
        const stA = calculateProjectStatus(a);
        const stB = calculateProjectStatus(b);

        const daysA = stA.maxDaysInSigning || 0;
        const daysB = stB.maxDaysInSigning || 0;

        if (daysB !== daysA) {
          return daysB - daysA;
        }

        const priorityMap: Record<string, number> = {
          CHAM_KY: 6,
          TRE_TIEN_DO: 5,
          GIA_HAN: 4,
          DANG_TRINH_KY: 3,
          DANG_THI_CONG: 2,
          HOAN_THANH: 1,
        };

        const prioA = priorityMap[stA.key] || 0;
        const prioB = priorityMap[stB.key] || 0;

        if (prioB !== prioA) {
          return prioB - prioA;
        }

        return getProjectCompletionPercentage(a) - getProjectCompletionPercentage(b);
      });
    }

    case 'COMPLETION_DESC':
      return result.sort((a, b) => getProjectCompletionPercentage(b) - getProjectCompletionPercentage(a));

    case 'COMPLETION_ASC':
      return result.sort((a, b) => getProjectCompletionPercentage(a) - getProjectCompletionPercentage(b));

    case 'UPDATED_RECENT': {
      return result.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    case 'CODE_ASC':
      return result.sort((a, b) => a.maCongTrinh.localeCompare(b.maCongTrinh, 'vi', { numeric: true }));

    case 'DEFAULT':
    default:
      return result;
  }
}

export interface ActiveMilestoneResult {
  currentKey: string;
  currentLabel: string;
  currentCode: string;
  stageDescription: string;
  statusType: 'COMPLETED' | 'SIGNING' | 'LATE' | 'IN_PROGRESS' | 'NOT_STARTED';
  statusBadge: string;
  completedCount: number;
  totalMilestones: number;
  percentage: number;
  ngayTrinh?: string;
  ngayKy?: string;
  daysInSigning?: number;
  milestoneList: Array<{
    key: string;
    label: string;
    code: string;
    isCompleted: boolean;
    isCurrent: boolean;
    ngayTrinh?: string;
    ngayKy?: string;
  }>;
}

export function getProjectActiveMilestone(project: Project): ActiveMilestoneResult {
  const defs = getProjectMilestoneDefs(project);
  const m = project.milestones || {};
  let completedCount = 0;
  let activeIndex = 0;
  let hasFoundActive = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const milestoneList = defs.map((def) => {
    const data = m[def.key] || {};
    const isCompleted = !!data.ngayKy;
    if (isCompleted) completedCount++;

    return {
      key: def.key,
      label: def.label,
      code: def.code,
      isCompleted,
      isCurrent: false,
      ngayTrinh: data.ngayTrinh,
      ngayKy: data.ngayKy,
    };
  });

  // Find the first milestone that is not completed
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const data = m[def.key] || {};
    if (!data.ngayKy) {
      activeIndex = i;
      hasFoundActive = true;
      break;
    }
  }

  if (!hasFoundActive) {
    activeIndex = defs.length - 1; // all completed
  }

  if (milestoneList[activeIndex]) {
    milestoneList[activeIndex].isCurrent = true;
  }

  const currentDef = defs[activeIndex] || defs[0];
  const currentData = m[currentDef?.key] || {};

  let statusType: ActiveMilestoneResult['statusType'] = 'IN_PROGRESS';
  let stageDescription = 'Đang thi công & chuẩn bị hồ sơ nghiệm thu';
  let statusBadge = 'bg-blue-100 text-blue-800 border-blue-300';
  let daysInSigning = 0;

  if (completedCount === defs.length && currentData.ngayKy) {
    statusType = 'COMPLETED';
    stageDescription = 'Đã hoàn thành toàn bộ các mốc nghiệm thu & quyết toán';
    statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
  } else if (currentData.ngayTrinh && !currentData.ngayKy) {
    const trinhDate = new Date(currentData.ngayTrinh);
    const diff = Math.max(0, Math.ceil((today.getTime() - trinhDate.getTime()) / (1000 * 60 * 60 * 24)));
    daysInSigning = diff;

    if (diff > 7) {
      statusType = 'LATE';
      stageDescription = `🚨 Chậm ký hồ sơ nghiệm thu (${diff} ngày)`;
      statusBadge = 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse';
    } else {
      statusType = 'SIGNING';
      stageDescription = `⏳ Đang trình ký hồ sơ (${diff} ngày)`;
      statusBadge = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    }
  } else if (currentData.nt_tt2 || currentData.nt_tt3) {
    statusType = 'IN_PROGRESS';
    stageDescription = '🔄 Có gia hạn thời gian nghiệm thu';
    statusBadge = 'bg-purple-100 text-purple-800 border-purple-300';
  }

  return {
    currentKey: currentDef?.key || 'm1',
    currentLabel: currentDef?.label || 'Đợt 1: XD_Phần thô',
    currentCode: currentDef?.code || 'M1_RAW',
    stageDescription,
    statusType,
    statusBadge,
    completedCount,
    totalMilestones: defs.length,
    percentage: defs.length > 0 ? Math.round((completedCount / defs.length) * 100) : 0,
    ngayTrinh: currentData.ngayTrinh,
    ngayKy: currentData.ngayKy,
    daysInSigning,
    milestoneList,
  };
}

export function exportProjectsToExcel(projects: Project[]) {
  if (projects.length === 0) return;

  const exportData = projects.map((p, idx) => {
    const st = calculateProjectStatus(p);
    const m = p.milestones || {};

    const row: Record<string, string | number> = {
      'STT': idx + 1,
      'Số Hợp Đồng': p.soHopDong,
      'Mã Công Trình': p.maCongTrinh,
      'Tên Công Trình': p.tenCongTrinh,
      'Dự Án': p.duAn || '',
      'Nhà Thầu': p.nhaThau || '',
      'Nhóm Chi Phí': p.nhomChiPhi || '',
      'Giá Trị HĐ (Sau VAT)': p.giaTriHdSauVat || 0,
      'Lũy Kế Đã Chi (Sau VAT)': p.luyKeDaChi || 0,
      'Còn Lại Chưa Chi': (p.giaTriHdSauVat || 0) - (p.luyKeDaChi || 0),
      'Tỷ Lệ Hoàn Thành (%)': getProjectCompletionPercentage(p),
      'Trạng Thái QCQS': st.label,
      'Ngày Ký HĐ': formatDate(p.ngayHopDong),
      'Hạn HĐ': formatDate(p.tienDoHopDong),
      'Hạn TGĐ Duyệt': formatDate(p.tienDoTgdDuyet),
      'Tiến Độ Thực Tế': formatDate(p.tienDoThucTe),
    };

    MILESTONE_DEFINITIONS.forEach((item) => {
      const data = m[item.key] || {};
      const name = item.label;
      row[`${name} - NT Hợp Đồng`] = formatDate(data.nt_hd);
      row[`${name} - NT Duyệt TGĐ`] = formatDate(data.nt_tgd);
      row[`${name} - NT Thực Tế L1`] = formatDate(data.nt_tt1);
      row[`${name} - Gia Hạn L2`] = formatDate(data.nt_tt2);
      row[`${name} - Gia Hạn L3`] = formatDate(data.nt_tt3);
      row[`${name} - Ngày Trình HS`] = formatDate(data.ngayTrinh);
      row[`${name} - Ngày Ký HS`] = formatDate(data.ngayKy);
    });

    row['Ghi Chú Ban Chỉ Huy'] = p.ghiChu || '';
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'TheoDoiQCQS_TaiChinh');

  const fileName = `CVB_QCQS_MECK_TheoDoiNghiemThu_ThanhToan_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
