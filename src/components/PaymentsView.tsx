import React, { useState, useEffect } from 'react';
import { Project, PaymentBatch } from '../types';
import { formatBillionVN, formatVND, formatDate } from '../utils/helpers';
import {
  CreditCard,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PaymentsViewProps {
  projects: Project[];
  onOpenAddPaymentModal: () => void;
  onViewProject: (p: Project) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  projects,
  onOpenAddPaymentModal,
  onViewProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DA_CHI' | 'DANG_TRINH' | 'CHUA_CHI'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(15);

  // Flatten all payment batches across all projects
  interface FlatPaymentBatch {
    project: Project;
    batch: PaymentBatch;
  }

  const allBatches: FlatPaymentBatch[] = [];
  projects.forEach((p) => {
    if (p.paymentBatches && p.paymentBatches.length > 0) {
      p.paymentBatches.forEach((b) => {
        allBatches.push({ project: p, batch: b });
      });
    }
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredBatches = allBatches.filter((item) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNo = item.project.soHopDong?.toLowerCase().includes(q);
      const matchName = item.project.tenCongTrinh?.toLowerCase().includes(q);
      const matchBatchName = item.batch.tenDot?.toLowerCase().includes(q);
      const matchContractor = item.project.nhaThau?.toLowerCase().includes(q);
      if (!matchNo && !matchName && !matchBatchName && !matchContractor) return false;
    }

    if (statusFilter !== 'ALL' && item.batch.trangThai !== statusFilter) {
      return false;
    }

    return true;
  });

  // Pagination calculations
  const totalItems = filteredBatches.length;
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = pageSize === 'ALL' ? 0 : (validCurrentPage - 1) * effectivePageSize;
  const endIndex = pageSize === 'ALL' ? totalItems : Math.min(totalItems, startIndex + effectivePageSize);
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  // Calculate totals
  let totalPaid = 0;
  let totalPending = 0;
  let totalRetention = 0;

  allBatches.forEach((b) => {
    if (b.batch.trangThai === 'DA_CHI') {
      totalPaid += b.batch.giaTriSauVat || 0;
      totalRetention += b.batch.giaTriGiuLaiBaoHanh || 0;
    } else if (b.batch.trangThai === 'DANG_TRINH') {
      totalPending += b.batch.giaTriSauVat || 0;
    }
  });

  return (
    <div className="space-y-3.5 text-slate-800 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Quản Lý Thanh Toán & Lịch Sử Giải Ngân
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chi tiết các đợt tạm ứng, đợt nghiệm thu ME-CK, giữ lại bảo hành 5% và giải ngân thực tế
          </p>
        </div>

        <button
          onClick={onOpenAddPaymentModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Nhập Thanh Toán Đợt</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ĐÃ GIẢI NGÂN (SAU VAT)
            </span>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {formatBillionVN(totalPaid)}
            </div>
            <span className="text-[10px] text-slate-500">
              {allBatches.filter((b) => b.batch.trangThai === 'DA_CHI').length} đợt đã thanh toán
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              HỒ SƠ ĐANG TRÌNH KÝ DUYỆT CHI
            </span>
            <div className="text-xl font-black text-amber-700 mt-0.5">
              {formatBillionVN(totalPending)}
            </div>
            <span className="text-[10px] text-slate-500">
              {allBatches.filter((b) => b.batch.trangThai === 'DANG_TRINH').length} đợt đang chờ TGĐ/Kế toán
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              GIỮ LẠI BẢO HÀNH (5%)
            </span>
            <div className="text-xl font-black text-indigo-700 mt-0.5">
              {formatBillionVN(totalRetention)}
            </div>
            <span className="text-[10px] text-slate-500">
              Giữ lại bảo hành chất lượng ME-CK
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm đợt, số HĐ, công trình..."
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">-- Tất cả Trạng Thái Đợt --</option>
            <option value="DA_CHI">✅ Đã Chi Trả</option>
            <option value="DANG_TRINH">⏳ Đang Trình Ký</option>
            <option value="CHUA_CHI">⚪ Chưa Chi</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Hiển thị <strong className="text-emerald-700 font-bold">{filteredBatches.length}</strong> / {allBatches.length} đợt thanh toán
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 shadow-xs uppercase tracking-wider text-[10.5px] border-b border-slate-300">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center font-bold">STT</th>
                <th className="py-2.5 px-3 min-w-[130px] font-bold">SỐ HỢP ĐỒNG</th>
                <th className="py-2.5 px-3 min-w-[180px] font-bold">TÊN ĐỢT THANH TOÁN</th>
                <th className="py-2.5 px-3 min-w-[180px] font-bold">CÔNG TRÌNH / DỰ ÁN</th>
                <th className="py-2.5 px-3 min-w-[110px] font-bold text-center">NGÀY ĐỀ NGHỊ</th>
                <th className="py-2.5 px-3 min-w-[110px] font-bold text-center">NGÀY DUYỆT CHI</th>
                <th className="py-2.5 px-3 min-w-[120px] font-bold text-right text-blue-900">
                  GIÁ TRỊ SAU VAT
                </th>
                <th className="py-2.5 px-3 min-w-[110px] font-bold text-right text-indigo-900">
                  BẢO HÀNH (5%)
                </th>
                <th className="py-2.5 px-3 min-w-[120px] font-bold text-right text-emerald-800">
                  THỰC NHẬN (95%)
                </th>
                <th className="py-2.5 px-3 min-w-[110px] font-bold text-center">TRẠNG THÁI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Không có đợt thanh toán nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((item, localIdx) => {
                  const globalIdx = startIndex + localIdx;
                  return (
                    <tr
                      key={`${item.project.id}_${item.batch.id}_${globalIdx}`}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => onViewProject(item.project)}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {globalIdx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-xs">
                        {item.project.soHopDong}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {item.batch.tenDot}
                        <div className="text-[10px] text-slate-500 font-normal">
                          Đợt số {item.batch.dotSo}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                          {item.project.tenCongTrinh}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {item.project.duAn}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {formatDate(item.batch.ngayDeNghi)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                        {item.batch.ngayDuyetChi ? formatDate(item.batch.ngayDuyetChi) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-900 text-xs">
                        {formatBillionVN(item.batch.giaTriSauVat)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-xs">
                        {formatBillionVN(item.batch.giaTriGiuLaiBaoHanh)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-xs">
                        {formatBillionVN(item.batch.giaTriThucNhan)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.batch.trangThai === 'DA_CHI' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✅ Đã Chi Trả
                          </span>
                        ) : item.batch.trangThai === 'DANG_TRINH' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            ⏳ Đang Trình Duyệt
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
                            ⚪ Chưa Chi
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination at the bottom */}
        <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 select-none">
          <div className="flex items-center gap-3">
            <span>
              Hiển thị <strong className="text-slate-900 font-bold">{totalItems > 0 ? startIndex + 1 : 0}</strong> -{' '}
              <strong className="text-slate-900 font-bold">{endIndex}</strong> trên tổng số{' '}
              <strong className="text-emerald-700 font-bold">{totalItems}</strong> đợt thanh toán
            </span>

            <div className="flex items-center gap-1 ml-2">
              <span className="text-slate-500 text-[11px]">Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                  setCurrentPage(1);
                }}
                className="bg-white text-slate-800 text-xs px-2 py-1 rounded border border-slate-300 focus:outline-none cursor-pointer"
              >
                <option value={10}>10 dòng / trang</option>
                <option value={15}>15 dòng / trang</option>
                <option value={25}>25 dòng / trang</option>
                <option value={50}>50 dòng / trang</option>
                <option value="ALL">Tất cả ({totalItems})</option>
              </select>
            </div>
          </div>

          {pageSize !== 'ALL' && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                title="Trang đầu"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - validCurrentPage) <= 1)
                  .map((pNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pNum - prev > 1;

                    return (
                      <React.Fragment key={pNum}>
                        {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(pNum)}
                          className={`min-w-[28px] h-7 px-2 rounded text-xs font-bold transition cursor-pointer ${
                            validCurrentPage === pNum
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {pNum}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 disabled:opacity-40 transition cursor-pointer"
                title="Trang cuối"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
