import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { UserCheck, ShieldAlert, X, Sparkles, Building2, Mail, Briefcase, User, CheckCircle2 } from 'lucide-react';

const USER_PROFILE_STORAGE_KEY = 'cvb_bch_user_profile';

export const getSavedUserProfile = (): UserProfile | null => {
  try {
    const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.fullName && parsed.role && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to get saved user profile', e);
  }
  return null;
};

export const saveUserProfileToStorage = (profile: UserProfile) => {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile to storage', e);
  }
};

interface UserProfileModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
  isRequired?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSaveProfile,
  initialProfile,
  isRequired = false,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Chỉ Huy Trưởng ME-CK');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialProfile) {
      setFullName(initialProfile.fullName || '');
      setRole(initialProfile.role || 'Chỉ Huy Trưởng ME-CK');
      setEmail(initialProfile.email || '');
    } else {
      const saved = getSavedUserProfile();
      if (saved) {
        setFullName(saved.fullName || '');
        setRole(saved.role || 'Chỉ Huy Trưởng ME-CK');
        setEmail(saved.email || '');
      }
    }
  }, [initialProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    const cleanRole = role.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanRole || !cleanEmail) {
      setErrorMsg('Vui lòng nhập đầy đủ Họ và tên, Chức vụ và Email.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Địa chỉ Email không hợp lệ.');
      return;
    }

    const profile: UserProfile = {
      fullName: cleanName,
      role: cleanRole,
      email: cleanEmail,
      updatedAt: new Date().toISOString(),
    };

    saveUserProfileToStorage(profile);
    onSaveProfile(profile);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[100] flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-4 flex justify-between items-center text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/40 text-blue-300 border border-blue-400/30">
              <UserCheck className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                Khai Báo Cán Bộ Nhập Liệu
              </h3>
              <p className="text-[11px] text-blue-200">
                Ban chỉ huy công trình &amp; Phòng QCQS ME-CK
              </p>
            </div>
          </div>
          {!isRequired && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notice Banner */}
        <div className="bg-blue-50/80 border-b border-blue-100 px-6 py-2.5 flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11.5px]">
            Bất kỳ cán bộ nào vào nhập liệu / cập nhật tiến độ cần khai báo <strong>Họ tên, Chức vụ &amp; Email</strong> để xác thực lịch sử chỉnh sửa và ghi nhận trách nhiệm hồ sơ nghiệm thu.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" /> Họ và tên Cán bộ *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn Bình"
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Chức vụ / Bộ phận *
            </label>
            <div className="space-y-1.5">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium cursor-pointer"
              >
                <option value="Chỉ Huy Trưởng ME-CK">Chỉ Huy Trưởng ME-CK</option>
                <option value="Chỉ Huy Phó ME-CK">Chỉ Huy Phó ME-CK</option>
                <option value="Kỹ Sư QCQS ME-CK">Kỹ Sư QCQS ME-CK</option>
                <option value="Kỹ Sư Giám Sát Hiện Trường">Kỹ Sư Giám Sát Hiện Trường</option>
                <option value="Kỹ Sư Hồ Sơ Nghiệm Thu">Kỹ Sư Hồ Sơ Nghiệm Thu</option>
                <option value="Chuyên Viên Thanh Toán QLDA">Chuyên Viên Thanh Toán QLDA</option>
                <option value="Ban Giám Đốc / Ban Quản Lý">Ban Giám Đốc / Ban Quản Lý</option>
                <option value="Khác">Chức vụ khác (Nhập bên dưới)</option>
              </select>

              {role === 'Khác' && (
                <input
                  type="text"
                  placeholder="Nhập tên chức vụ cụ thể..."
                  onChange={(e) => setRole(e.target.value || 'Khác')}
                  className="w-full px-3 py-1.5 bg-white text-slate-900 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-600" /> Địa chỉ Email công việc *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: nguyenvanbinh@buildcost.vn hoặc gmail.com"
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono font-medium transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {!isRequired && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận &amp; Bắt Đầu Nhập Liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
