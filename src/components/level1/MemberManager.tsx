import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { Users, Plus, Search, ShieldAlert, CheckCircle2, Lock, MoreVertical, Building2 } from 'lucide-react';

interface MemberManagerProps {
  currentUser: UserProfile;
}

export const MemberManager: React.FC<MemberManagerProps> = ({ currentUser }) => {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [currentUser.id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('parent_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data.map(row => ({
        id: row.id,
        fullName: row.full_name,
        role: row.role,
        email: row.email,
        accountType: row.account_type,
        parentId: row.parent_id,
        status: row.status,
        maxMembers: row.max_members,
        updatedAt: row.updated_at,
      })));
    } catch (error) {
      console.error('Lỗi tải danh sách thành viên:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái tài khoản này thành ${newStatus}?`)) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: newStatus })
        .eq('id', memberId)
        .eq('parent_id', currentUser.id); // Guard

      if (error) throw error;
      await fetchMembers();
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      alert('Không thể cập nhật trạng thái');
    }
  };

  const activeCount = members.filter(m => m.status === 'active').length;
  const lockedCount = members.filter(m => m.status === 'locked').length;

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#090e1a] animate-fadeIn relative z-10">
      {/* Header */}
      <div className="flex-none bg-white dark:bg-[#111a2e] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            Quản lý Thành viên (Cấp 2)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý tài khoản nhân viên thuộc tổ chức của bạn. Hạn mức: {members.length} / {currentUser.maxMembers || 0}
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={members.length >= (currentUser.maxMembers || 0)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Thêm thành viên
        </button>
      </div>

      {/* KPI */}
      <div className="flex-none grid grid-cols-3 gap-4 p-6">
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{members.length}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Tổng thành viên</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{activeCount}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Đang hoạt động</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{lockedCount}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Đã khóa</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-none px-6 pb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium w-16 text-center">STT</th>
                  <th className="py-3 px-4 font-medium">Họ và Tên</th>
                  <th className="py-3 px-4 font-medium">Chức vụ</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-medium text-center w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Chưa có thành viên nào. Hãy thêm thành viên mới.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, index) => (
                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-4 text-center text-slate-500">{index + 1}</td>
                      <td className="py-2 px-4 font-medium text-slate-800 dark:text-slate-200">{member.fullName}</td>
                      <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{member.role}</td>
                      <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{member.email}</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          member.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {member.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <div className="relative group inline-block text-left">
                          <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-slate-500" />
                          </button>
                          <div className="absolute right-0 w-36 mt-1 origin-top-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="py-1">
                              {member.status === 'locked' ? (
                                <button
                                  onClick={() => handleUpdateStatus(member.id, 'active')}
                                  className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  Mở khóa
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(member.id, 'locked')}
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  Khóa tài khoản
                                </button>
                              )}
                            </div>
                          </div>
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

      {isCreateModalOpen && (
        <CreateMemberModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchMembers();
          }}
        />
      )}
    </div>
  );
};

const CreateMemberModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Nhân viên');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-level2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role_title: roleTitle
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo tài khoản');
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Tạo tài khoản Cấp 2</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email đăng nhập</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mật khẩu</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ và Tên</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chức vụ / Vai trò</label>
            <input type="text" required value={roleTitle} onChange={e => setRoleTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
