import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Calendar, Sparkles, Building2, Save, UserCheck, User, Briefcase, Mail } from 'lucide-react';
import { Project, MilestoneData, MilestoneInfo } from '../types';
import { formatDate } from '../utils/helpers';
import { getSavedUserProfile, saveUserProfileToStorage } from './UserProfileModal';

interface QuickMilestoneModalProps {
  isOpen: boolean;
  project: Project | null;
  milestoneInfo: MilestoneInfo | null;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export const QuickMilestoneModal: React.FC<QuickMilestoneModalProps> = ({
  isOpen,
  project,
  milestoneInfo,
  onClose,
  onSave,
}) => {
  const [ntHd, setNtHd] = useState('');
  const [ntTgd, setNtTgd] = useState('');
  const [ntTt1, setNtTt1] = useState('');
  const [ntTt2, setNtTt2] = useState('');
  const [ntTt3, setNtTt3] = useState('');
  const [ngayTrinh, setNgayTrinh] = useState('');
  const [ngayKy, setNgayKy] = useState('');
  const [ghiChu, setGhiChu] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Chỉ Huy Trưởng ME-CK');
  const [authorEmail, setAuthorEmail] = useState('');

  useEffect(() => {
    const savedUser = getSavedUserProfile();
    if (savedUser) {
      setAuthorName(savedUser.fullName || '');
      setAuthorRole(savedUser.role || 'Chỉ Huy Trưởng ME-CK');
      setAuthorEmail(savedUser.email || '');
    }

    if (project && milestoneInfo) {
      const data: MilestoneData = project.milestones?.[milestoneInfo.key] || {};
      setNtHd(data.nt_hd || '');
      setNtTgd(data.nt_tgd || '');
      setNtTt1(data.nt_tt1 || '');
      setNtTt2(data.nt_tt2 || '');
      setNtTt3(data.nt_tt3 || '');
      setNgayTrinh(data.ngayTrinh || '');
      setNgayKy(data.ngayKy || '');
      setGhiChu(project.ghiChu || '');
    }
  }, [project, milestoneInfo, isOpen]);

  if (!isOpen || !project || !milestoneInfo) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleQuickSignToday = () => {
    setNgayKy(todayStr);
    if (!ngayTrinh) {
      setNgayTrinh(todayStr);
    }
  };

  const handleQuickSubmitToday = () => {
    setNgayTrinh(todayStr);
    setNgayKy('');
  };

  const handleQuickClearStatus = () => {
    setNgayTrinh('');
    setNgayKy('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAuthor = authorName.trim()
      ? `${authorName.trim()} (${authorRole || 'BCH'})`
      : project.updatedBy || 'BCH Công Trường';

    if (authorName.trim() && authorEmail.trim()) {
      saveUserProfileToStorage({
        fullName: authorName.trim(),
        role: authorRole,
        email: authorEmail.trim(),
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedMilestones = {
      ...(project.milestones || {}),
      [milestoneInfo.key]: {
        nt_hd: ntHd || undefined,
        nt_tgd: ntTgd || undefined,
        nt_tt1: ntTt1 || undefined,
        nt_tt2: ntTt2 || undefined,
        nt_tt3: ntTt3 || undefined,
        ngayTrinh: ngayTrinh || undefined,
        ngayKy: ngayKy || undefined,
      },
    };

    const updatedProject: Project = {
      ...project,
      milestones: updatedMilestones,
      ghiChu: ghiChu || project.ghiChu,
      updatedAt: new Date().toISOString(),
      updatedBy: cleanAuthor,
    };

    onSave(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Cập Nhật Real-time:</span>
                <span className="text-emerald-400 font-bold">{milestoneInfo.label}</span>
              </h3>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                {project.maCongTrinh} — {project.soHopDong}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold truncate">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{project.tenCongTrinh}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-2">
            {project.duAn}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Quick Action Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Thao Tác Nhanh Trạng Thái Mốc
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleQuickSignToday}
                className="py-2 px-2.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>✅ Đã Ký Hôm Nay</span>
              </button>
              <button
                type="button"
                onClick={handleQuickSubmitToday}
                className="py-2 px-2.5 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>⏳ Đang Trình Duyệt</span>
              </button>
              <button
                type="button"
                onClick={handleQuickClearStatus}
                className="py-2 px-2.5 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>⚪ Chưa Trình/Chưa Ký</span>
              </button>
            </div>
          </div>

          {/* Date Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            {/* NT Hợp Đồng */}
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                1. NT HỢP ĐỒNG (nt_hd)
              </label>
              <input
                type="date"
                value={ntHd}
                onChange={(e) => setNtHd(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* NT Duyệt TGĐ */}
            <div>
              <label className="text-[10.5px] font-bold text-blue-700 block mb-1">
                2. NT DUYỆT TGĐ (nt_tgd)
              </label>
              <input
                type="date"
                value={ntTgd}
                onChange={(e) => setNtTgd(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* NT Thực Tế L1 */}
            <div>
              <label className="text-[10.5px] font-bold text-emerald-700 block mb-1">
                3. NT THỰC TẾ LẦN 1 (nt_tt1)
              </label>
              <input
                type="date"
                value={ntTt1}
                onChange={(e) => setNtTt1(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Gia Hạn L2 */}
            <div>
              <label className="text-[10.5px] font-bold text-purple-700 block mb-1">
                4. GIA HẠN LẦN 2 (nt_tt2 - Tùy chọn)
              </label>
              <input
                type="date"
                value={ntTt2}
                onChange={(e) => setNtTt2(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>

            {/* Ngày Trình Hồ Sơ */}
            <div>
              <label className="text-[10.5px] font-bold text-amber-700 block mb-1">
                5. NGÀY TRÌNH HỒ SƠ (ngayTrinh)
              </label>
              <input
                type="date"
                value={ngayTrinh}
                onChange={(e) => setNgayTrinh(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-bold"
              />
            </div>

            {/* Ngày Ký Hồ Sơ */}
            <div>
              <label className="text-[10.5px] font-bold text-emerald-800 block mb-1">
                6. NGÀY KÝ DUYỆT (ngayKy)
              </label>
              <input
                type="date"
                value={ngayKy}
                onChange={(e) => setNgayKy(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-2.5 py-1.5 rounded-md border border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Khai báo Cán bộ BCH Nhập liệu */}
          <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 border-b border-indigo-200/70 pb-1.5">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Cán Bộ Ban Chỉ Huy Nhập Liệu *
              </span>
              <span className="text-[10px] text-indigo-600 font-normal">Tự động ghi nhận lịch sử</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Bình"
                  className="w-full bg-white text-xs text-slate-900 px-2 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Chức vụ *</label>
                <input
                  type="text"
                  required
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="VD: Chỉ Huy Trưởng"
                  className="w-full bg-white text-xs text-slate-900 px-2 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Email công việc *</label>
                <input
                  type="email"
                  required
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="VD: nguyenvanbinh@buildcost.vn"
                  className="w-full bg-white text-xs text-slate-900 px-2 py-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
              Ghi Chú Tiến Độ / Vướng Mắc Nghiệm Thu
            </label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="VD: Đã nghiệm thu phần thô đạt chuẩn, đang chờ ký hồ sơ..."
              className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cập Nhật Real-time</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
