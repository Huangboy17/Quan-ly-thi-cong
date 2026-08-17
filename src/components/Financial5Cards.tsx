import React, { useMemo } from 'react';
import {
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Wallet,
  Percent,
  Receipt,
  RotateCcw,
  Building,
  TrendingUp,
  FileText,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Project } from '../types';
import {
  calculate5FinancialMetrics,
  formatBillionVN,
  formatVND,
} from '../utils/helpers';

interface Financial5CardsProps {
  projects: Project[];
  selectedContractId?: string;
  onResetContractSelection?: () => void;
  title?: string;
  className?: string;
}

export const Financial5Cards: React.FC<Financial5CardsProps> = ({
  projects,
  selectedContractId = 'ALL',
  onResetContractSelection,
  title,
  className = '',
}) => {
  const metrics = useMemo(() => {
    return calculate5FinancialMetrics(projects);
  }, [projects]);

  const isSingleContract =
    selectedContractId !== 'ALL' && projects.length === 1;
  const singleProject = isSingleContract ? projects[0] : null;

  return (
    <div className={`space-y-2.5 ${className}`} id="financial-5-kpi-container">
      {/* Context banner if filtered to single contract or group */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white px-3.5 py-2 rounded-xl shadow-xs border border-indigo-900/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-blue-500/30 border border-blue-400/40 text-blue-300 shrink-0">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                {title || '5 THẺ CHỈ SỐ TÀI CHÍNH TRƯỚC VAT'}
              </span>
              <span className="text-[10.5px] px-2 py-0.2 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {isSingleContract ? '1 Hợp Đồng Được Chọn' : `Toàn Bộ ${projects.length} Hợp Đồng / Công Trình`}
              </span>
            </div>
            {isSingleContract && singleProject && (
              <div className="text-[11px] text-slate-300 truncate flex items-center gap-2 mt-0.5 font-medium">
                <span className="text-white font-black bg-blue-600/60 px-1.5 py-0.2 rounded text-[10px] font-mono">
                  {singleProject.maCongTrinh}
                </span>
                <span className="font-bold text-amber-300">{singleProject.soHopDong}</span>
                <span className="text-slate-300 truncate">— {singleProject.tenCongTrinh}</span>
                {singleProject.diaPhuong && (
                  <span className="text-blue-300 flex items-center gap-0.5 shrink-0 text-[10px]">
                    <MapPin className="w-2.5 h-2.5" />
                    {singleProject.diaPhuong}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedContractId !== 'ALL' && onResetContractSelection && (
          <button
            onClick={onResetContractSelection}
            className="text-[11px] font-bold text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Quay lại xem toàn bộ hợp đồng"
          >
            <RotateCcw className="w-3 h-3 text-amber-300" />
            <span>Xem tất cả công trình</span>
          </button>
        )}
      </div>

      {/* 5 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3" id="financial-5-cards-grid">
        {/* CARD 1: Tổng GT HĐ Trước VAT */}
        <div
          id="kpi-card-1-tong-gt-hd"
          className="bg-white dark:bg-[#111a2e] p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs relative flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Tổng GT HĐ Trước VAT
              </span>
              <span className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Receipt className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-950 dark:text-white tracking-tight font-mono">
              {formatBillionVN(metrics.tongGiaTriHdTruocVat)}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 space-y-0.5">
              <div className="flex justify-between items-center">
                <span>Sau VAT:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                  {formatBillionVN(metrics.tongGiaTriHdSauVat)}
                </strong>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500">
                <span>Thuế VAT (10%):</span>
                <span className="font-mono">{formatBillionVN(metrics.vatAmount)}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-blue-700 dark:text-blue-400 font-bold">
            <span>{isSingleContract ? 'Hợp đồng gốc' : `${metrics.totalProjects} Hợp đồng`}</span>
            <span className="bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono">
              Trước Thuế
            </span>
          </div>
        </div>

        {/* CARD 2: LK Hết Kỳ Trước Trước VAT */}
        <div
          id="kpi-card-2-lk-ky-truoc"
          className="bg-white dark:bg-[#111a2e] p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs relative flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                LK Hết Kỳ Trước Trước VAT
              </span>
              <span className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <Calendar className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-950 dark:text-amber-200 tracking-tight font-mono">
              {formatBillionVN(metrics.luyKeKyTruocTruocVat)}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 space-y-0.5">
              <div className="text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                Đã giải ngân đến hết kỳ trước
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                Tương đương: {formatVND(metrics.luyKeKyTruocTruocVat)}
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 font-bold">
            <span>Lũy kế kỳ trước</span>
            <span className="bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-mono">
              Đã Chi
            </span>
          </div>
        </div>

        {/* CARD 3: LK Hết Kỳ Này Trước VAT */}
        <div
          id="kpi-card-3-lk-ky-nay"
          className="bg-white dark:bg-[#111a2e] p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs relative flex flex-col justify-between hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                LK Hết Kỳ Này Trước VAT
              </span>
              <span className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-950 dark:text-emerald-200 tracking-tight font-mono">
              {formatBillionVN(metrics.luyKeKyNayTruocVat)}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 space-y-0.5">
              <div className="flex justify-between items-center">
                <span>Phát sinh trong kỳ:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                  {formatBillionVN(metrics.chiTraTrongKyTruocVat)}
                </strong>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                (Gồm tạm ứng & các đợt TT)
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
            <span>Tổng thanh toán</span>
            <span className="bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
              Đến Nay
            </span>
          </div>
        </div>

        {/* CARD 4: Còn Lại Chưa TT Trước VAT */}
        <div
          id="kpi-card-4-con-lai-chua-tt"
          className="bg-white dark:bg-[#111a2e] p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs relative flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-600 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Còn Lại Chưa TT Trước VAT
              </span>
              <span className="p-1 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                <Building className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-950 dark:text-rose-200 tracking-tight font-mono">
              {formatBillionVN(metrics.conLaiChuaThanhToanTruocVat)}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 space-y-0.5">
              <div className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                Dư nợ hợp đồng còn lại trước thuế
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                Tương đương: {formatVND(metrics.conLaiChuaThanhToanTruocVat)}
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-rose-700 dark:text-rose-400 font-bold">
            <span>Dư nợ cần thanh toán</span>
            <span className="bg-rose-50 dark:bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-mono">
              Chưa TT
            </span>
          </div>
        </div>

        {/* CARD 5: Tỷ Lệ % Hoàn Thành So Với HĐ */}
        <div
          id="kpi-card-5-ty-le-hoan-thanh"
          className="bg-white dark:bg-[#111a2e] p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs relative flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                % Hoàn Thành So Với HĐ
              </span>
              <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-mono text-[10px] font-black">
                {metrics.tyLeHoanThanh}%
              </span>
            </div>

            <div className="text-lg sm:text-xl font-black text-indigo-950 dark:text-indigo-200 tracking-tight font-mono flex items-baseline gap-1.5">
              <span>{metrics.tyLeHoanThanh}%</span>
              <span className="text-[11px] text-slate-500 font-normal">giải ngân</span>
            </div>

            {/* Thanh đo trực quan (Progress Bar) */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.tyLeHoanThanh))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                <span>0%</span>
                <span>Đã giải ngân: {metrics.tyLeHoanThanh}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-indigo-700 dark:text-indigo-400 font-bold">
            <span>Tiến độ thực tế</span>
            <span className="bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-mono">
              Thanh đo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
