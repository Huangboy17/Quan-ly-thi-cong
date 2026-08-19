import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Building2,
  FolderKanban,
  Plus,
  ChevronRight,
  History,
  Layers,
  Search,
  CheckCircle2,
  HardHat,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { ActiveNavMenu, Project, UserProfile } from '../types';
import { MAJOR_PROJECTS } from '../data/sampleData';

interface SidebarMenuProps {
  userProfile?: UserProfile | null;
  activeMenu: ActiveNavMenu;
  onSelectMenu: (menu: ActiveNavMenu) => void;
  projects?: Project[];
  totalContracts: number;
  totalPaymentsCount: number;
  bchLogsCount?: number;
  selectedContractId?: string;
  onSelectContract?: (contractId: string) => void;
  selectedProject?: string;
  onSelectProject?: (proj: string) => void;
  onOpenAddProjectModal?: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  userProfile,
  activeMenu,
  onSelectMenu,
  projects = [],
  totalContracts,
  totalPaymentsCount,
  bchLogsCount = 0,
  selectedContractId = 'ALL',
  onSelectContract,
  selectedProject = 'ALL',
  onSelectProject,
  onOpenAddProjectModal,
}) => {
  const [contractSearch, setContractSearch] = useState('');

  const menuItems: {
    id: ActiveNavMenu;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'DASHBOARD',
      label: 'Tổng quan Dashboard',
      subLabel: 'KPIs & Biểu đồ tiến độ',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'CONTRACTS',
      label: 'Quản lý Hợp đồng',
      subLabel: 'Tiến độ 8 mốc & Nghiệm thu',
      icon: <FileText className="w-4 h-4" />,
      badge: totalContracts,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    },
    {
      id: 'PAYMENTS',
      label: 'Quản lý Thanh toán',
      subLabel: 'Nhập đợt & Lịch sử chi',
      icon: <CreditCard className="w-4 h-4" />,
      badge: totalPaymentsCount,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    {
      id: 'BCH_LOGS',
      label: 'Lịch sử Ban Chỉ Huy',
      subLabel: 'Audit trail & Nhật ký QCQS',
      icon: <History className="w-4 h-4" />,
      badge: bchLogsCount > 0 ? `${bchLogsCount} Live` : 'Live',
      badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300 ring-1 ring-amber-400',
    },
  ];

  if (userProfile?.accountType === 'super_admin') {
    menuItems.push({
      id: 'ADMIN_SYSTEM',
      label: 'Quản trị hệ thống',
      subLabel: 'Phân cấp & Tài khoản',
      icon: <Layers className="w-4 h-4" />,
      badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-300',
    });
  }

  const currentSelection = selectedContractId !== 'ALL' ? selectedContractId : selectedProject;

  const handleSelect = (idOrCode: string) => {
    if (onSelectContract) {
      onSelectContract(idOrCode);
    } else if (onSelectProject) {
      onSelectProject(idOrCode);
    }
  };

  const filteredContracts = projects.filter((p) => {
    const q = contractSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.soHopDong.toLowerCase().includes(q) ||
      p.maCongTrinh.toLowerCase().includes(q) ||
      p.tenCongTrinh.toLowerCase().includes(q) ||
      (p.diaPhuong && p.diaPhuong.toLowerCase().includes(q)) ||
      (p.nhomChiPhi && p.nhomChiPhi.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-full lg:w-72 p-3 space-y-3 bg-slate-100/80 dark:bg-[#090e1a] border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex flex-col shrink-0 select-none">
      {/* ========================================================
          KHUNG 1: KHUNG VIỀN MENU QUẢN LÝ (Chức Năng Hệ Thống)
         ======================================================== */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#111a2e] shadow-xs overflow-hidden transition-all">
        {/* Header Khung Menu Quản Lý */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-[#131d33] dark:to-[#172542] border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                MENU QUẢN LÝ
              </span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-medium">
                Chức năng điều hành QCQS
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700/60">
            {menuItems.length} Mục
          </span>
        </div>

        {/* Danh Sách Nút Bấm Trong Khung Menu */}
        <nav className="p-2 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMenu(item.id)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25 border-blue-500'
                    : 'bg-slate-50/60 hover:bg-blue-50/50 dark:bg-[#0d1527] dark:hover:bg-[#16233b] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 transition ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-white dark:bg-[#1a2744] text-blue-600 dark:text-blue-400 border border-slate-200/70 dark:border-slate-700'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <div className={`text-xs font-bold leading-snug truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[10px] leading-tight truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.subLabel}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ml-1 shadow-2xs ${
                      isActive ? 'bg-white text-blue-700 font-black' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================
          KHUNG 2: KHUNG VIỀN DANH SÁCH MÃ HỢP ĐỒNG & CÔNG TRÌNH
         ======================================================== */}
      <div className="rounded-2xl border-2 border-indigo-200/90 dark:border-indigo-900/60 bg-white dark:bg-[#111a2e] shadow-xs overflow-hidden flex-1 flex flex-col transition-all">
        {/* Header Khung Danh Sách Hợp Đồng */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-[#151c33] dark:to-[#1c1d3b] border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-indigo-600 text-white shadow-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11.5px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
                HỢP ĐỒNG
              </span>
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 block font-medium">
                {projects.length} Hợp đồng / Công trình
              </span>
            </div>
          </div>

          <button
            onClick={onOpenAddProjectModal}
            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 text-[10.5px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 cursor-pointer flex items-center gap-1 transition active:scale-95 shadow-2xs"
            title="Thêm hợp đồng mới"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm gói</span>
          </button>
        </div>

        <div className="p-2.5 space-y-2 flex-1 flex flex-col">
          {/* Ô tìm kiếm nhanh mã HĐ / công trình */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã HĐ, tên công trình..."
              value={contractSearch}
              onChange={(e) => setContractSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
            />
          </div>

          {/* Nút: Tất cả các công trình */}
          <button
            onClick={() => handleSelect('ALL')}
            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer border ${
              currentSelection === 'ALL'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                : 'bg-slate-50/70 hover:bg-indigo-50/60 dark:bg-[#0d1527] dark:hover:bg-[#18233d] border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderKanban className={`w-3.5 h-3.5 ${currentSelection === 'ALL' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>Tất cả các công trình</span>
            </div>
            {currentSelection === 'ALL' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            ) : (
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {projects.length || totalContracts}
              </span>
            )}
          </button>

          {/* Danh Sách Toàn Bộ Các Mã Hợp Đồng */}
          <div className="space-y-1 overflow-y-auto max-h-[320px] custom-scrollbar pr-0.5">
            {filteredContracts.length === 0 ? (
              <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-[11px]">
                Không tìm thấy mã hợp đồng nào
              </div>
            ) : (
              filteredContracts.map((proj) => {
                const isSel =
                  currentSelection === proj.id ||
                  currentSelection === proj.soHopDong ||
                  currentSelection === proj.maCongTrinh;

                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelect(proj.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-xl text-[11px] flex items-center justify-between transition cursor-pointer border ${
                      isSel
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-100 font-bold border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400 shadow-xs'
                        : 'bg-white dark:bg-[#0e1628] hover:bg-slate-100 dark:hover:bg-[#162238] border-slate-200/60 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title={`[${proj.maCongTrinh}] ${proj.soHopDong} - ${proj.tenCongTrinh}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-1 truncate">
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded font-black shrink-0 ${
                          isSel
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700'
                        }`}
                      >
                        {proj.maCongTrinh}
                      </span>
                      <div className="truncate min-w-0">
                        <div className="font-mono font-bold text-[10.5px] text-slate-900 dark:text-slate-100 truncate leading-tight">
                          {proj.soHopDong}
                        </div>
                        <div className="text-[9.5px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                          {proj.tenCongTrinh}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {proj.diaPhuong && (
                        <span className="hidden sm:inline-block text-[8.5px] text-slate-400 dark:text-slate-500 font-medium max-w-[45px] truncate">
                          {proj.diaPhuong}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${
                          isSel ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'opacity-30'
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          KHUNG 3: KHUNG CHỈ SỐ NHANH & TRẠNG THÁI CÔNG TRƯỜNG
         ======================================================== */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#111a2e]/90 p-2.5 shadow-2xs flex items-center justify-between text-[10.5px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            QCQS Live Sync
          </span>
        </div>
        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
          v2.6 Real-time
        </span>
      </div>
    </aside>
  );
};

