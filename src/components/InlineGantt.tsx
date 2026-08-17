import React from 'react';
import { Project } from '../types';
import { formatDate, formatShortDate } from '../utils/helpers';
import { Check, Clock, FileText, Flag } from 'lucide-react';

interface InlineGanttProps {
  project: Project;
}

interface DateInfo {
  month: number;
  day: number;
  year: number;
  raw: string;
}

function parseDateInfo(dateStr?: string): DateInfo | null {
  if (!dateStr) return null;
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  if (!clean || clean === '-' || clean === '...') return null;

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          return { month: m, day: isNaN(d) ? 15 : d, year: isNaN(y) ? 2026 : y, raw: clean };
        }
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          return { month: m, day: isNaN(d) ? 15 : d, year: isNaN(y) ? 2026 : y, raw: clean };
        }
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length >= 2) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const y = parts.length >= 3 ? parseInt(parts[2], 10) : 2026;
      if (!isNaN(m) && m >= 1 && m <= 12) {
        return { month: m, day: isNaN(d) ? 15 : d, year: isNaN(y) ? 2026 : y, raw: clean };
      }
    }
  }
  return null;
}

function getTimelinePercent(dateObj: DateInfo | null, fallbackMonth: number): number {
  if (!dateObj) {
    return Math.min(97, Math.max(3, ((fallbackMonth - 0.5) / 12) * 100));
  }
  const fraction = Math.min(1, Math.max(0, (dateObj.day - 1) / 30));
  const monthPos = dateObj.month - 1 + fraction;
  return Math.min(97, Math.max(3, (monthPos / 12) * 100));
}

export const InlineGantt: React.FC<InlineGanttProps> = ({ project }) => {
  const m = project.milestones || {};
  const m1 = m.m1 || {};
  const m2 = m.m2 || {};
  const m3 = m.m3 || {};

  // 1. Mốc Hợp đồng (Bắt đầu)
  const hdDateInfo = parseDateInfo(project.ngayHopDong);
  const startPercent = getTimelinePercent(hdDateInfo, 1);
  const startMonth = hdDateInfo?.month || 1;

  // 2. Mốc Đợt 3: XD+ME_Hoàn thành xây lắp (Kết thúc)
  const m3DateStr = m3.ngayKy || m3.nt_tgd || m3.nt_hd || m3.nt_tt1 || project.tienDoTgdDuyet || project.tienDoHopDong;
  const m3DateInfo = parseDateInfo(m3DateStr);
  const rawM3Percent = getTimelinePercent(m3DateInfo, Math.min(12, startMonth + 5));
  const m3Percent = Math.max(startPercent + 10, rawM3Percent);
  const endMonth = m3DateInfo?.month || Math.min(12, startMonth + 5);

  const widthPercent = Math.max(8.333, m3Percent - startPercent);

  // 3. Mốc Đợt 1 (M1: XD_Phần thô)
  const m1DateStr = m1.ngayKy || m1.nt_tgd || m1.nt_hd || m1.nt_tt1;
  const m1DateInfo = parseDateInfo(m1DateStr);
  const rawM1Percent = m1DateInfo ? getTimelinePercent(m1DateInfo, startMonth + 1) : startPercent + widthPercent * 0.35;
  const m1Percent = Math.max(startPercent + 2, Math.min(m3Percent - 2, rawM1Percent));

  // 4. Mốc Đợt 2 (M2: ME_Tập kết thiết bị)
  const m2DateStr = m2.ngayKy || m2.nt_tgd || m2.nt_hd || m2.nt_tt1;
  const m2DateInfo = parseDateInfo(m2DateStr);
  const rawM2Percent = m2DateInfo ? getTimelinePercent(m2DateInfo, startMonth + 3) : startPercent + widthPercent * 0.7;
  const m2Percent = Math.max(m1Percent + 2, Math.min(m3Percent - 1, rawM2Percent));

  // Trạng thái mốc
  const isM1Signed = !!m1.ngayKy;
  const isM2Signed = !!m2.ngayKy;
  const isM3Signed = !!m3.ngayKy;

  const isM1Submitting = !isM1Signed && !!m1.ngayTrinh;
  const isM2Submitting = !isM2Signed && !!m2.ngayTrinh;
  const isM3Submitting = !isM3Signed && !!m3.ngayTrinh;

  // Kiểm tra chậm tiến độ
  const isDelayed =
    project.tienDoThucTe &&
    project.tienDoTgdDuyet &&
    new Date(project.tienDoThucTe) > new Date(project.tienDoTgdDuyet);

  let barGradient = 'from-blue-600 to-indigo-600';
  if (isM3Signed) {
    barGradient = 'from-emerald-600 to-teal-600';
  } else if (isDelayed) {
    barGradient = 'from-amber-500 to-rose-600';
  }

  // Mốc thời gian hiện tại (Tháng 8/2026)
  const currentMonth = 8;
  const currentMarkerLeft = ((currentMonth - 1) / 12) * 100 + 4.166;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[320px] select-none py-0.5">
      {/* 1. Thước đo 12 Tháng - Gọn gàng, rõ ràng */}
      <div className="grid grid-cols-12 gap-0.5 text-[9px] text-center font-mono">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((mNum) => {
          const isCurrent = mNum === currentMonth;
          const isInSpan = mNum >= startMonth && mNum <= endMonth;
          return (
            <div
              key={mNum}
              className={`py-0.5 rounded transition-colors text-[8.5px] font-bold ${
                isCurrent
                  ? 'bg-red-500 text-white font-black shadow-xs'
                  : isInSpan
                  ? 'bg-slate-200/90 text-slate-800 font-extrabold'
                  : 'text-slate-400'
              }`}
              title={isCurrent ? 'Tháng hiện tại (Tháng 8/2026)' : `Tháng ${mNum}`}
            >
              T{mNum}
            </div>
          );
        })}
      </div>

      {/* 2. Đường Gantt Bar: HĐ ➔ M3 (Xây lắp) */}
      <div className="relative h-6 bg-slate-100 rounded-md border border-slate-300 shadow-xs flex items-center overflow-hidden">
        {/* Lưới phân chia 12 tháng */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[1px] bg-slate-200 pointer-events-none"
            style={{ left: `${((i + 1) / 12) * 100}%` }}
          />
        ))}

        {/* Thanh tiến độ Gantt Bar */}
        <div
          className={`absolute h-4 rounded bg-gradient-to-r ${barGradient} shadow-xs flex items-center justify-between px-1.5 text-white transition-all duration-300`}
          style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
          title={`Tiến độ xây lắp: ${formatDate(project.ngayHopDong)} ➔ ${formatDate(m3DateStr)}`}
        >
          <span className="font-mono font-bold text-[8px] tracking-tight flex items-center gap-0.5 drop-shadow-xs">
            HĐ:{formatShortDate(project.ngayHopDong)}
          </span>
          <span className="font-mono font-bold text-[8px] tracking-tight flex items-center gap-0.5 drop-shadow-xs ml-auto">
            {isM3Signed ? '✓' : '🏁'} M3:{formatShortDate(m3DateStr)}
          </span>
        </div>

        {/* Mốc làm dấu M1 (XD thô) trên thanh */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${m1Percent}%` }}
          title={`M1 (XD thô): ${formatDate(m1DateStr)} ${isM1Signed ? '✓ Đã ký' : ''}`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border border-white shadow-xs ${
              isM1Signed ? 'bg-emerald-600 text-white' : isM1Submitting ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
            }`}
          >
            {isM1Signed ? '✓' : '1'}
          </span>
        </div>

        {/* Mốc làm dấu M2 (ME thiết bị) trên thanh */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${m2Percent}%` }}
          title={`M2 (ME thiết bị): ${formatDate(m2DateStr)} ${isM2Signed ? '✓ Đã ký' : ''}`}
        >
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black border border-white shadow-xs ${
              isM2Signed ? 'bg-emerald-600 text-white' : isM2Submitting ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
            }`}
          >
            {isM2Signed ? '✓' : '2'}
          </span>
        </div>

        {/* Vạch đỏ chỉ tháng hiện tại (T8) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-20 pointer-events-none"
          style={{ left: `${currentMarkerLeft}%` }}
          title="Thời điểm hiện tại: T8/2026"
        />
      </div>

      {/* 3. Dòng thời gian 4 mốc rõ ràng, ngắn gọn */}
      <div className="grid grid-cols-4 gap-1 text-[8.5px] font-mono text-center">
        {/* Mốc HĐ */}
        <div
          className="bg-blue-50/80 border border-blue-200 rounded px-1 py-0.5 text-blue-900"
          title={`Ký Hợp Đồng: ${formatDate(project.ngayHopDong)}`}
        >
          <span className="font-sans font-bold text-[7.5px] text-blue-600 block">HỢP ĐỒNG</span>
          <span className="font-extrabold text-blue-950">{formatShortDate(project.ngayHopDong)}</span>
        </div>

        {/* Mốc M1 */}
        <div
          className={`border rounded px-1 py-0.5 ${
            isM1Signed
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isM1Submitting
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
          title={`M1 - XD Phần thô: ${formatDate(m1DateStr)}`}
        >
          <span className="font-sans font-bold text-[7.5px] block text-slate-500">
            {isM1Signed ? '✓ M1 (THÔ)' : 'M1 (THÔ)'}
          </span>
          <span className="font-extrabold">{formatShortDate(m1DateStr)}</span>
        </div>

        {/* Mốc M2 */}
        <div
          className={`border rounded px-1 py-0.5 ${
            isM2Signed
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : isM2Submitting
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
          title={`M2 - ME Thiết bị: ${formatDate(m2DateStr)}`}
        >
          <span className="font-sans font-bold text-[7.5px] block text-slate-500">
            {isM2Signed ? '✓ M2 (ME TB)' : 'M2 (ME TB)'}
          </span>
          <span className="font-extrabold">{formatShortDate(m2DateStr)}</span>
        </div>

        {/* Mốc M3 */}
        <div
          className={`border rounded px-1 py-0.5 ${
            isM3Signed
              ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black ring-1 ring-emerald-300'
              : isM3Submitting
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
              : 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
          }`}
          title={`M3 - Hoàn thành xây lắp XD+ME: ${formatDate(m3DateStr)}`}
        >
          <span className="font-sans font-black text-[7.5px] block text-slate-600">
            {isM3Signed ? '✓ M3 (XÂY LẮP)' : '🏁 M3 (XÂY LẮP)'}
          </span>
          <span className="font-black">{formatShortDate(m3DateStr)}</span>
        </div>
      </div>
    </div>
  );
};
