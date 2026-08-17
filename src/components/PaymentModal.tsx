import React, { useState } from 'react';
import { Project, PaymentBatch } from '../types';
import { X, CreditCard, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { formatVND, formatBillionVN } from '../utils/helpers';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProject?: Project;
  onSavePayment: (projectId: string, batch: PaymentBatch) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  projects,
  selectedProject,
  onSavePayment,
}) => {
  if (!isOpen) return null;

  const [projectId, setProjectId] = useState<string>(selectedProject?.id || projects[0]?.id || '');
  const [tenDot, setTenDot] = useState('Đợt 3: Hoàn thành xây lắp & T&C');
  const [ngayDeNghi, setNgayDeNghi] = useState(new Date().toISOString().split('T')[0]);
  const [ngayDuyetChi, setNgayDuyetChi] = useState('');
  const [giaTriSauVat, setGiaTriSauVat] = useState<number>(15000000000);
  const [vatRate, setVatRate] = useState<number>(0.1);
  const [trangThai, setTrangThai] = useState<'DA_CHI' | 'DANG_TRINH' | 'CHUA_CHI'>('DANG_TRINH');
  const [ghiChu, setGhiChu] = useState('');

  const curProj = projects.find((p) => p.id === projectId);
  const giaTriTruocVat = Math.round(giaTriSauVat / (1 + vatRate));
  const giaTriGiuLaiBaoHanh = Math.round(giaTriSauVat * 0.05);
  const giaTriThucNhan = giaTriSauVat - giaTriGiuLaiBaoHanh;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    const newBatch: PaymentBatch = {
      id: `batch_${Date.now()}`,
      dotSo: (curProj?.paymentBatches?.length || 0) + 1,
      tenDot,
      ngayDeNghi,
      ngayDuyetChi: ngayDuyetChi || undefined,
      giaTriTruocVat,
      vatRate,
      giaTriSauVat,
      giaTriGiuLaiBaoHanh,
      giaTriThucNhan,
      trangThai,
      ghiChu,
    };

    onSavePayment(projectId, newBatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0e1736] border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-fadeIn text-slate-100">
        {/* Header */}
        <div className="bg-[#131f47] px-4 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Nhập Đợt Thanh Toán / Giải Ngân</h3>
              <p className="text-[11px] text-slate-400">Ghi nhận hồ sơ nghiệm thu thanh toán & VAT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Select Contract */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1 uppercase">
              Chọn Hợp Đồng / Gói Thầu ME-CK:
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.soHopDong}] {p.tenCongTrinh} ({formatBillionVN(p.giaTriHdSauVat)})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Name & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Tên Đợt Thanh Toán:
              </label>
              <input
                type="text"
                value={tenDot}
                onChange={(e) => setTenDot(e.target.value)}
                placeholder="VD: Đợt 3: Hoàn thành xây lắp..."
                className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Trạng Thái Giải Ngân:
              </label>
              <select
                value={trangThai}
                onChange={(e) => setTrangThai(e.target.value as any)}
                className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value="DANG_TRINH">⏳ Đang Trình Ký Duyệt Chi</option>
                <option value="DA_CHI">✅ Đã Chi Trả (Giải Ngân Xong)</option>
                <option value="CHUA_CHI">⚪ Chưa Chi</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Ngày Đề Nghị Thanh Toán:
              </label>
              <input
                type="date"
                value={ngayDeNghi}
                onChange={(e) => setNgayDeNghi(e.target.value)}
                className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Ngày Duyệt Chi (Nếu có):
              </label>
              <input
                type="date"
                value={ngayDuyetChi}
                onChange={(e) => setNgayDuyetChi(e.target.value)}
                className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Amount & Calculation Preview */}
          <div className="bg-[#121c3b] p-3 rounded-xl border border-slate-700/80 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                Giá Trị Đề Nghị Thanh Toán (Sau VAT - VNĐ):
              </label>
              <input
                type="number"
                value={giaTriSauVat}
                onChange={(e) => setGiaTriSauVat(Number(e.target.value))}
                step={1000000}
                className="w-full bg-[#182552] text-white font-mono font-black text-sm px-3 py-2 rounded-lg border border-emerald-500/50 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-[11px]">
              <div className="bg-[#0b1329] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Trước VAT (10%)</span>
                <span className="font-bold text-slate-200">{formatBillionVN(giaTriTruocVat)}</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Giữ lại BH (5%)</span>
                <span className="font-bold text-indigo-400">{formatBillionVN(giaTriGiuLaiBaoHanh)}</span>
              </div>
              <div className="bg-[#0b1329] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Thực nhận (95%)</span>
                <span className="font-black text-emerald-400">{formatBillionVN(giaTriThucNhan)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Ghi Chú Hồ Sơ Nghiệm Thu:
            </label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Kèm hóa đơn VAT & biên bản nghiệm thu A-B..."
              className="w-full bg-[#152042] text-slate-100 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Đợt Thanh Toán</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
