import React, { useState } from 'react';
import {
  X,
  Edit3,
  Building2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Percent,
  Calendar,
  Briefcase,
  FileText,
} from 'lucide-react';
import { Project, CostGroup } from '../types';
import { COST_GROUPS, SAMPLE_PROJECT_NAMES } from '../data/sampleData';
import { formatBillionVN } from '../utils/helpers';

interface BulkEditProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjects: Project[];
  onBulkUpdate: (projectIds: string[], updates: Partial<Project>) => void;
}

export const BulkEditProjectsModal: React.FC<BulkEditProjectsModalProps> = ({
  isOpen,
  onClose,
  selectedProjects,
  onBulkUpdate,
}) => {
  const [updateProjectName, setUpdateProjectName] = useState(false);
  const [targetProjectName, setTargetProjectName] = useState(SAMPLE_PROJECT_NAMES[0]);

  const [updateCostGroup, setUpdateCostGroup] = useState(false);
  const [targetCostGroup, setTargetCostGroup] = useState<CostGroup>('Lắp đặt ME-CK');

  const [updateContractor, setUpdateContractor] = useState(false);
  const [targetContractor, setTargetContractor] = useState('');

  const [updateProgress, setUpdateProgress] = useState(false);
  const [targetProgress, setTargetProgress] = useState('50');

  const [updateTgdDate, setUpdateTgdDate] = useState(false);
  const [targetTgdDate, setTargetTgdDate] = useState('2026-12-31');

  const [appendNote, setAppendNote] = useState(false);
  const [targetNote, setTargetNote] = useState('');

  if (!isOpen || selectedProjects.length === 0) return null;

  const totalValue = selectedProjects.reduce((sum, p) => sum + (p.giaTriHdSauVat || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Partial<Project> = {};

    if (updateProjectName) {
      updates.duAn = targetProjectName;
    }
    if (updateCostGroup) {
      updates.nhomChiPhi = targetCostGroup;
    }
    if (updateContractor && targetContractor.trim()) {
      updates.nhaThau = targetContractor.trim();
    }
    if (updateProgress) {
      updates.tienDoThucTe = targetProgress;
    }
    if (updateTgdDate && targetTgdDate) {
      updates.tienDoTgdDuyet = targetTgdDate;
    }
    if (appendNote && targetNote.trim()) {
      updates.ghiChu = targetNote.trim();
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    const ids = selectedProjects.map((p) => p.id);
    onBulkUpdate(ids, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/80 text-white ring-1 ring-white/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                CẬP NHẬT HÀNG LOẠT {selectedProjects.length} HỢP ĐỒNG
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Tùy chọn trường thông tin cần đồng bộ cho tất cả hợp đồng đã chọn.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected List Summary */}
        <div className="p-4 bg-blue-50/60 border-b border-blue-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900">Danh sách áp dụng:</span>
            <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-mono font-bold">
              {selectedProjects.length} hợp đồng
            </span>
          </div>
          <div className="text-slate-600 font-medium">
            Tổng giá trị: <strong className="text-blue-950 font-bold">{formatBillionVN(totalValue)}</strong>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
          <p className="text-slate-500 font-medium italic">
            * Tích chọn ô vuông tương ứng để kích hoạt cập nhật cho trường thông tin đó. Các trường không tích chọn sẽ giữ nguyên giá trị cũ.
          </p>

          {/* 1. Dự án */}
          <div className={`p-3.5 rounded-xl border transition ${updateProjectName ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateProjectName}
                onChange={(e) => setUpdateProjectName(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Chuyển sang Dự Án:</span>
            </label>

            {updateProjectName && (
              <div className="mt-2.5 pl-6">
                <select
                  value={targetProjectName}
                  onChange={(e) => setTargetProjectName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {SAMPLE_PROJECT_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Nhóm Chi Phí */}
          <div className={`p-3.5 rounded-xl border transition ${updateCostGroup ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateCostGroup}
                onChange={(e) => setUpdateCostGroup(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Phân Bổ Nhóm Chi Phí:</span>
            </label>

            {updateCostGroup && (
              <div className="mt-2.5 pl-6">
                <select
                  value={targetCostGroup}
                  onChange={(e) => setTargetCostGroup(e.target.value as CostGroup)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {COST_GROUPS.map((cg) => (
                    <option key={cg} value={cg}>
                      {cg}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Nhà Thầu */}
          <div className={`p-3.5 rounded-xl border transition ${updateContractor ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateContractor}
                onChange={(e) => setUpdateContractor(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Briefcase className="w-4 h-4 text-amber-600" />
              <span>Đổi Đơn Vị Nhà Thầu:</span>
            </label>

            {updateContractor && (
              <div className="mt-2.5 pl-6">
                <input
                  type="text"
                  value={targetContractor}
                  onChange={(e) => setTargetContractor(e.target.value)}
                  placeholder="Nhập tên nhà thầu mới..."
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 4. Tiến độ thực tế % */}
          <div className={`p-3.5 rounded-xl border transition ${updateProgress ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateProgress}
                onChange={(e) => setUpdateProgress(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Percent className="w-4 h-4 text-emerald-600" />
              <span>Cập Nhật % Sản Lượng Thi Công Thực Tế:</span>
            </label>

            {updateProgress && (
              <div className="mt-2.5 pl-6 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={targetProgress}
                  onChange={(e) => setTargetProgress(e.target.value)}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <span className="w-16 text-center py-1 bg-white border border-slate-300 rounded font-mono font-bold text-blue-900">
                  {targetProgress}%
                </span>
              </div>
            )}
          </div>

          {/* 5. Hạn Duyệt TGĐ */}
          <div className={`p-3.5 rounded-xl border transition ${updateTgdDate ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateTgdDate}
                onChange={(e) => setUpdateTgdDate(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>Điều Chỉnh Hạn TGĐ Duyệt Nghiệm Thu:</span>
            </label>

            {updateTgdDate && (
              <div className="mt-2.5 pl-6">
                <input
                  type="date"
                  value={targetTgdDate}
                  onChange={(e) => setTargetTgdDate(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 6. Ghi chú */}
          <div className={`p-3.5 rounded-xl border transition ${appendNote ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-400' : 'bg-slate-50 border-slate-200'}`}>
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={appendNote}
                onChange={(e) => setAppendNote(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Bổ Sung Ghi Chú Ban Chỉ Huy:</span>
            </label>

            {appendNote && (
              <div className="mt-2.5 pl-6">
                <textarea
                  rows={2}
                  value={targetNote}
                  onChange={(e) => setTargetNote(e.target.value)}
                  placeholder="Ghi chú thêm cho các hợp đồng này..."
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đồng Bộ {selectedProjects.length} Hợp Đồng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
