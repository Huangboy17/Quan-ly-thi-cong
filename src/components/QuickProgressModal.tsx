import React, { useState, useEffect } from 'react';
import { X, Calendar, Sparkles, Building2, Save, UserCheck, User, Briefcase, Mail } from 'lucide-react';
import { Project } from '../types';
import { getSavedUserProfile, saveUserProfileToStorage } from './UserProfileModal';

interface QuickProgressModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export const QuickProgressModal: React.FC<QuickProgressModalProps> = ({
  isOpen,
  project,
  onClose,
  onSave,
}) => {
  const [tienDoHopDong, setTienDoHopDong] = useState('');
  const [tienDoTgdDuyet, setTienDoTgdDuyet] = useState('');
  const [tienDoThucTe, setTienDoThucTe] = useState('');
  const [ngayHopDong, setNgayHopDong] = useState('');
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

    if (project) {
      setTienDoHopDong(project.tienDoHopDong || '');
      setTienDoTgdDuyet(project.tienDoTgdDuyet || '');
      setTienDoThucTe(project.tienDoThucTe || '');
      setNgayHopDong(project.ngayHopDong || '');
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

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

    const updatedProject: Project = {
      ...project,
      tienDoHopDong,
      tienDoTgdDuyet,
      tienDoThucTe,
      ngayHopDong: ngayHopDong || project.ngayHopDong,
      updatedAt: new Date().toISOString(),
      updatedBy: cleanAuthor,
    };
    onSave(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-indigo-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-indigo-900">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">
                Cập Nhật Tiến Độ: HĐ — TGĐ Duyệt — Thực Tế
              </h3>
              <p className="text-[11px] text-indigo-300 font-mono mt-0.5">
                {project.maCongTrinh} — {project.soHopDong}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold truncate">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{project.tenCongTrinh}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono shrink-0 ml-2">
            {project.duAn}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                📅 Ngày Ký Hợp Đồng Gốc
              </label>
              <input
                type="date"
                value={ngayHopDong}
                onChange={(e) => setNgayHopDong(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-1">
                  1. TIẾN ĐỘ HỢP ĐỒNG (HĐ)
                </label>
                <input
                  type="date"
                  value={tienDoHopDong}
                  onChange={(e) => setTienDoHopDong(e.target.value)}
                  className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-blue-700 block mb-1">
                  2. TIẾN ĐỘ TGĐ DUYỆT (TGĐ)
                </label>
                <input
                  type="date"
                  value={tienDoTgdDuyet}
                  onChange={(e) => setTienDoTgdDuyet(e.target.value)}
                  className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-800"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-emerald-700 block mb-1">
                  3. TIẾN ĐỘ THỰC TẾ (Thực tế)
                </label>
                <input
                  type="date"
                  value={tienDoThucTe}
                  onChange={(e) => setTienDoThucTe(e.target.value)}
                  className="w-full bg-white text-xs text-slate-900 px-3 py-2 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800"
                />
              </div>
            </div>

            {/* Khai báo Cán bộ Ban Chỉ Huy */}
            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 border-b border-indigo-200/70 pb-1">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Khai Báo Ban Chỉ Huy Nhập Liệu *
                </span>
                <span className="text-[10px] text-indigo-600 font-normal">Ghi nhận người sửa</span>
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
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Email *</label>
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
          </div>

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
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Cập Nhật Tiến Độ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
