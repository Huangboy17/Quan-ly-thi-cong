import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types';
import { fetchAllProfiles, updateProfileStatus } from '../../services/supabaseService';
import { 
  Users, Activity, UserPlus, Ban, MoreVertical, 
  Search, Shield, Building2, UserCircle, X,
  CheckCircle2, AlertCircle, Trash2, Unlock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await fetchAllProfiles();
    setProfiles(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (e: React.MouseEvent, id: string, status: 'active' | 'pending' | 'blocked' | 'archived') => {
    e.stopPropagation();
    try {
      if (!id) return;
      await updateProfileStatus(id, status);
      await loadProfiles();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const q = search.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    );
  });

  const level1Profiles = filteredProfiles
    .filter(p => p.accountType === 'level_1' || p.accountType === 'super_admin')
    .map(p => {
      // Tính toán subCount tự động bằng cách đếm số tài khoản có parentId trỏ về id của mình
      const subCount = profiles.filter(sub => sub.parentId === p.id).length;
      return { ...p, subCount };
    });

  // KPIs
  const total = profiles.length;
  const active = profiles.filter(p => p.status === 'active').length;
  const pending = profiles.filter(p => p.status === 'pending').length;
  const blocked = profiles.filter(p => p.status === 'blocked').length;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-50 dark:bg-[#090e1a] text-slate-800 dark:text-slate-200">
      {/* Header & Compact KPI (shrink-0) */}
      <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111a2e]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Quản Trị Hệ Thống
            </h2>
            <p className="text-sm text-slate-500 mt-1">Quản lý phân cấp tài khoản & phê duyệt thành viên</p>
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            <KpiCard icon={<Users />} label="Tổng số" value={total} color="bg-blue-100 text-blue-700" />
            <KpiCard icon={<Activity />} label="Hoạt động" value={active} color="bg-emerald-100 text-emerald-700" />
            <KpiCard icon={<UserPlus />} label="Chờ duyệt" value={pending} color="bg-amber-100 text-amber-700" />
            <KpiCard icon={<Ban />} label="Đã khóa" value={blocked} color="bg-rose-100 text-rose-700" />
          </div>
        </div>
      </div>

      {/* Toolbar (shrink-0) */}
      <div className="shrink-0 p-3 bg-white/50 dark:bg-[#111a2e]/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm Tên, Email..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-[#1a233a] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table (flex-1 min-h-0 overflow-y-auto) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#1a233a] text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2 px-4 font-medium">Tên & Email</th>
                <th className="py-2 px-4 font-medium">Chức vụ</th>
                <th className="py-2 px-4 font-medium">Loại TK</th>
                <th className="py-2 px-4 font-medium">Hạn mức Cấp 2</th>
                <th className="py-2 px-4 font-medium">Trạng thái</th>
                <th className="py-2 px-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : level1Profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Không tìm thấy tài khoản nào.</td>
                </tr>
              ) : (
                level1Profiles.map(p => (
                  <tr 
                    key={p.id || p.email} 
                    className="hover:bg-slate-50 dark:hover:bg-[#162032] transition-colors cursor-pointer group"
                    onClick={() => p.accountType === 'level_1' && setSelectedProfile(p)}
                  >
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
                          {p.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-[13px]">{p.fullName}</div>
                          <div className="text-[11px] text-slate-500">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-[13px] text-slate-600 dark:text-slate-400">
                      {p.role || 'Không xác định'}
                    </td>
                    <td className="py-2 px-4">
                      {p.accountType === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Building2 className="w-3 h-3" /> Cấp 1
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      {p.accountType === 'level_1' ? (
                        <div className="flex items-center gap-1.5 text-[12px] font-medium">
                          <span className={p.subCount === p.maxMembers ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}>
                            {p.subCount || 0}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-500">{p.maxMembers || 0}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-2 px-4 text-right">
                      {p.accountType !== 'super_admin' && (
                        <div className="relative inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownActions 
                            onApprove={(e) => handleUpdateStatus(e, p.id!, 'active')}
                            onBlock={(e) => handleUpdateStatus(e, p.id!, 'blocked')}
                            onArchive={(e) => handleUpdateStatus(e, p.id!, 'archived')}
                            onUnlock={(e) => handleUpdateStatus(e, p.id!, 'active')}
                            currentStatus={p.status}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProfile && (
        <Level2Drawer 
          profile={selectedProfile} 
          allProfiles={profiles}
          onClose={() => setSelectedProfile(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
};

// --- Sub components ---

const KpiCard = ({ icon, label, value, color }: any) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1a233a] shrink-0`}>
    <div className={`p-1 rounded-md ${color}`}>
      {React.cloneElement(icon, { className: 'w-4 h-4' })}
    </div>
    <div className="flex flex-col">
      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider leading-none mb-1">{label}</span>
      <span className="text-sm font-bold leading-none">{value}</span>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  switch (status) {
    case 'active':
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Hoạt động</span>;
    case 'pending':
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Chờ duyệt</span>;
    case 'blocked':
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800">Đã khóa</span>;
    default:
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Không rõ</span>;
  }
};

const DropdownActions = ({ onApprove, onBlock, onArchive, onUnlock, currentStatus }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#1a233a] border border-slate-200 dark:border-slate-700 rounded-md shadow-lg z-20 py-1 flex flex-col text-[13px]">
            {currentStatus === 'pending' && (
              <button onClick={(e) => { setOpen(false); onApprove(e); }} className="text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt TK
              </button>
            )}
            {currentStatus === 'blocked' && (
              <button onClick={(e) => { setOpen(false); onUnlock(e); }} className="text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 flex items-center gap-2">
                <Unlock className="w-3.5 h-3.5" /> Mở khóa
              </button>
            )}
            {currentStatus === 'active' && (
              <button onClick={(e) => { setOpen(false); onBlock(e); }} className="text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-600 flex items-center gap-2">
                <Ban className="w-3.5 h-3.5" /> Khóa TK
              </button>
            )}
            <button onClick={(e) => { setOpen(false); onArchive(e); }} className="text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Xóa TK
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// --- Detail Drawer for Level 1 ---
const Level2Drawer = ({ profile, allProfiles, onClose, onUpdateStatus }: any) => {
  const members = allProfiles.filter((p: UserProfile) => p.parentId === profile.id);
  const activeMembers = members.filter((p: UserProfile) => p.status === 'active').length;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#090e1a] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[calc(100vh-48px)] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Sticky Header */}
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 lg:px-6 bg-gradient-to-r from-slate-50 to-white dark:from-[#111a2e] dark:to-[#090e1a] border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
              {profile.fullName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">{profile.fullName}</h3>
                <StatusBadge status={profile.status} />
              </div>
              <div className="text-xs text-slate-500">{profile.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50 dark:bg-[#090e1a]">
          
          {/* Info & KPI Grid (Fixed Top) */}
          <div className="shrink-0 p-4 lg:px-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-[#111a2e] border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">Loại TK</div>
              <div className="font-semibold text-sm">Cấp 1 (Khách hàng)</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">Hạn mức TV</div>
              <div className="font-semibold text-sm">{profile.maxMembers || 0}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">TV Hiện tại</div>
              <div className="font-semibold text-sm text-blue-600">{members.length}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-medium mb-1">TV Hoạt động</div>
              <div className="font-semibold text-sm text-emerald-600">{activeMembers}</div>
            </div>
          </div>

          {/* Member List Table (Scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:px-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold text-sm">Danh sách Thành viên (Cấp 2)</h4>
            </div>
            
            <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-[#1a233a] text-slate-500 dark:text-slate-400 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-medium">Tên & Email</th>
                    <th className="py-2 px-3 font-medium">Chức vụ</th>
                    <th className="py-2 px-3 font-medium">Trạng thái</th>
                    <th className="py-2 px-3 font-medium text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">Chưa có thành viên nào.</td>
                    </tr>
                  ) : (
                    members.map((m: UserProfile) => (
                      <tr key={m.id || m.email} className="hover:bg-slate-50 dark:hover:bg-[#162032] group">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            <div>
                              <div className="font-medium text-[13px]">{m.fullName}</div>
                              <div className="text-[11px] text-slate-500">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[12px] text-slate-600 dark:text-slate-400">{m.role || '-'}</td>
                        <td className="py-2 px-3"><StatusBadge status={m.status} /></td>
                        <td className="py-2 px-3 text-right">
                          <div className="relative inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownActions 
                              onApprove={(e: any) => onUpdateStatus(e, m.id!, 'active')}
                              onBlock={(e: any) => onUpdateStatus(e, m.id!, 'blocked')}
                              onArchive={(e: any) => onUpdateStatus(e, m.id!, 'archived')}
                              onUnlock={(e: any) => onUpdateStatus(e, m.id!, 'active')}
                              currentStatus={m.status}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
