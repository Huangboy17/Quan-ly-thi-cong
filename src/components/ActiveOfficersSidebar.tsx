import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Activity,
  Radio,
  ChevronRight,
  ChevronLeft,
  Circle,
  Clock,
  Sparkles,
  UserCheck,
  Send,
  MessageSquare,
  FileCheck,
  Percent,
  CreditCard,
  Building2,
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  RefreshCw,
  Bell,
  Eye,
} from 'lucide-react';
import { UserProfile, BchActivityLog, Project } from '../types';
import { formatRelativeTime } from '../utils/activityLogs';

export interface ActiveOfficer {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  status: 'TYPING' | 'ONLINE' | 'SAVED_JUST_NOW' | 'REVIEWING';
  currentAction: string;
  contractCode?: string;
  contractName?: string;
  lastActive: string; // ISO string or relative time
  isCurrentUser?: boolean;
}

interface ActiveOfficersSidebarProps {
  currentUserProfile: UserProfile | null;
  bchLogs: BchActivityLog[];
  projects: Project[];
  onOpenUserProfileModal: () => void;
  onOpenBchLogs: () => void;
  onSelectProjectContract?: (contractNo: string) => void;
}

const DEFAULT_OFFICERS: Omit<ActiveOfficer, 'isCurrentUser'>[] = [
  {
    id: 'off_1',
    name: 'Nguyễn Văn Bình',
    role: 'Chỉ Huy Trưởng ME-CK',
    email: 'nguyenvanbinh@buildcost.vn',
    avatarColor: 'from-blue-600 to-indigo-700',
    status: 'TYPING',
    currentAction: 'Đang nhập ngày trình Mốc 4 Nghiệm Thu...',
    contractCode: 'HĐ-CT04',
    contractName: 'Trạm Xử Lý Nước Thải & Cơ Điện',
    lastActive: new Date(Date.now() - 1000 * 20).toISOString(),
  },
  {
    id: 'off_2',
    name: 'Trần Đình Trọng',
    role: 'Kỹ Sư QCQS ME-CK',
    email: 'trandinhtrong.qcqs@buildcost.vn',
    avatarColor: 'from-emerald-600 to-teal-700',
    status: 'SAVED_JUST_NOW',
    currentAction: 'Vừa lưu tiến độ thực tế 88.5%',
    contractCode: 'HĐ-CT08',
    contractName: 'Tòa Nhà Khách Sạn 5 Sao Central',
    lastActive: new Date(Date.now() - 1000 * 55).toISOString(),
  },
  {
    id: 'off_3',
    name: 'Lê Hoàng Nam',
    role: 'Chỉ Huy Phó ME-CK',
    email: 'lehoangnam.bch@buildcost.vn',
    avatarColor: 'from-purple-600 to-indigo-800',
    status: 'REVIEWING',
    currentAction: 'Đang rà soát hồ sơ thanh toán Đợt 3',
    contractCode: 'HĐ-CT12',
    contractName: 'Nhà Máy Dược Phẩm Tiêu Chuẩn GMP',
    lastActive: new Date(Date.now() - 1000 * 180).toISOString(),
  },
  {
    id: 'off_4',
    name: 'Phạm Minh Đức',
    role: 'Kỹ Sư Hồ Sơ Nghiệm Thu',
    email: 'phamminhduc.qs@buildcost.vn',
    avatarColor: 'from-amber-600 to-orange-700',
    status: 'TYPING',
    currentAction: 'Đang ký nghiệm thu Mốc 6...',
    contractCode: 'HĐ-CT01',
    contractName: 'Trung Tâm Thương Mại & Căn Hộ',
    lastActive: new Date(Date.now() - 1000 * 35).toISOString(),
  },
  {
    id: 'off_5',
    name: 'Hoàng Kim Long',
    role: 'Kỹ Sư Giám Sát Hiện Trường',
    email: 'hoangkimlong.me@buildcost.vn',
    avatarColor: 'from-rose-600 to-pink-700',
    status: 'ONLINE',
    currentAction: 'Trực tuyến sẵn sàng cập nhật',
    contractCode: 'HĐ-CT19',
    contractName: 'Cụm Công Trình Giáo Dục Quốc Tế',
    lastActive: new Date(Date.now() - 1000 * 320).toISOString(),
  },
];

export const ActiveOfficersSidebar: React.FC<ActiveOfficersSidebarProps> = ({
  currentUserProfile,
  bchLogs,
  projects,
  onOpenUserProfileModal,
  onOpenBchLogs,
  onSelectProjectContract,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [officers, setOfficers] = useState<ActiveOfficer[]>([]);
  const [pingMessage, setPingMessage] = useState<string | null>(null);

  // Dynamic simulation of online activity status
  useEffect(() => {
    // Current user officer
    const currentOfficer: ActiveOfficer = {
      id: 'current_user',
      name: currentUserProfile?.fullName || 'Cán bộ Hiện Tại (Bạn)',
      role: currentUserProfile?.role || 'Kỹ Sư Ban Chỉ Huy',
      email: currentUserProfile?.email || 'ban.chihuy@buildcost.vn',
      avatarColor: 'from-blue-700 to-cyan-600',
      status: 'ONLINE',
      currentAction: 'Đang mở bảng theo dõi QCQS Real-time',
      contractCode: 'Toàn Hệ Thống',
      contractName: 'Giám Sát 52 Hợp Đồng',
      lastActive: new Date().toISOString(),
      isCurrentUser: true,
    };

    setOfficers([currentOfficer, ...DEFAULT_OFFICERS]);

    // Interval to cycle realistic active statuses
    const interval = setInterval(() => {
      setOfficers((prev) => {
        return prev.map((off) => {
          if (off.isCurrentUser) return off;

          // random small state shifts
          const rand = Math.random();
          if (rand > 0.65) {
            const statuses: ActiveOfficer['status'][] = ['TYPING', 'ONLINE', 'SAVED_JUST_NOW', 'REVIEWING'];
            const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            let act = off.currentAction;
            if (nextStatus === 'TYPING') {
              act = 'Đang chỉnh sửa dữ liệu mốc QCQS...';
            } else if (nextStatus === 'SAVED_JUST_NOW') {
              act = 'Vừa ghi nhận dữ liệu lên Cloud!';
            } else if (nextStatus === 'REVIEWING') {
              act = 'Đang kiểm tra chéo số liệu HĐ';
            } else {
              act = 'Trực tuyến sẵn sàng';
            }

            return {
              ...off,
              status: nextStatus,
              currentAction: act,
              lastActive: new Date().toISOString(),
            };
          }
          return off;
        });
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [currentUserProfile]);

  const activeTypingCount = officers.filter((o) => o.status === 'TYPING' || o.status === 'SAVED_JUST_NOW').length;
  const onlineCount = officers.length;

  const handleSendPing = () => {
    setPingMessage('Đã phát tín hiệu Ping đồng bộ đến tất cả Ban Chỉ Huy!');
    setTimeout(() => setPingMessage(null), 3500);
  };

  return (
    <aside
      className={`relative transition-all duration-300 ease-in-out bg-white border-l border-slate-200 flex flex-col z-30 shrink-0 ${
        isExpanded ? 'w-80 sm:w-84' : 'w-16'
      }`}
    >
      {/* 1. Header Toolbar of the Vertical Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
        {isExpanded ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5 truncate">
                <span>BAN CHỈ HUY REAL-TIME</span>
              </h3>
              <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{onlineCount} cán bộ đang trực tuyến</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="relative p-1.5 rounded-lg bg-emerald-600 text-white" title="Ban Chỉ Huy Real-time">
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-white animate-ping" />
            </div>
          </div>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition cursor-pointer shrink-0"
          title={isExpanded ? 'Thu gọn thanh dọc' : 'Mở rộng thanh theo dõi'}
        >
          {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Main Stream of Officers */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2.5">
        {isExpanded ? (
          <>
            {/* Live Typing Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Hoạt Động Trực Tiếp</span>
                </div>
                <span className="bg-blue-200/80 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {activeTypingCount} đang thao tác
                </span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                Hệ thống tự động phát hiện và hiển thị các vị trí đang nhập liệu để tránh xung đột dữ liệu.
              </p>
            </div>

            {/* List of Officers */}
            <div className="space-y-2">
              {officers.map((officer) => {
                const initials = officer.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('')
                  .toUpperCase();

                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    <Circle className="w-1.5 h-1.5 fill-slate-400 text-slate-400" /> Trực tuyến
                  </span>
                );

                if (officer.status === 'TYPING') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-300 ring-1 ring-amber-400 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      Đang nhập liệu
                    </span>
                  );
                } else if (officer.status === 'SAVED_JUST_NOW') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Vừa lưu xong
                    </span>
                  );
                } else if (officer.status === 'REVIEWING') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      <Eye className="w-2.5 h-2.5 text-purple-600" /> Đang rà soát
                    </span>
                  );
                }

                return (
                  <div
                    key={officer.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      officer.isCurrentUser
                        ? 'bg-blue-50/70 border-blue-300 shadow-xs ring-1 ring-blue-400/50'
                        : officer.status === 'TYPING'
                        ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Top line: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar with dynamic ring */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-8 h-8 rounded-full bg-gradient-to-br ${officer.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
                          >
                            {initials}
                          </div>
                          {/* Live pulse dot */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                              officer.status === 'TYPING'
                                ? 'bg-amber-500 animate-ping'
                                : officer.status === 'SAVED_JUST_NOW'
                                ? 'bg-emerald-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                              officer.status === 'TYPING'
                                ? 'bg-amber-500'
                                : officer.status === 'SAVED_JUST_NOW'
                                ? 'bg-emerald-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {officer.name}
                            </h4>
                            {officer.isCurrentUser && (
                              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded shrink-0">
                                BẠN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate font-medium">
                            {officer.role}
                          </p>
                        </div>
                      </div>

                      {statusBadge}
                    </div>

                    {/* Action bubble / Context */}
                    <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-[10.5px]">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        {officer.status === 'TYPING' ? (
                          <Sparkles className="w-3 h-3 text-amber-600 animate-spin shrink-0" />
                        ) : (
                          <Activity className="w-3 h-3 text-blue-600 shrink-0" />
                        )}
                        <span className="truncate">{officer.currentAction}</span>
                      </div>

                      {officer.contractCode && (
                        <div className="mt-1 flex items-center justify-between gap-1 pt-1 border-t border-slate-200/60">
                          <span className="font-mono font-bold text-slate-800 text-[10px]">
                            {officer.contractCode}
                          </span>
                          <span className="text-slate-500 text-[9.5px] truncate max-w-[140px]">
                            {officer.contractName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Ping feedback */}
            {pingMessage && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10.5px] font-bold text-center animate-fadeIn">
                {pingMessage}
              </div>
            )}
          </>
        ) : (
          /* COLLAPSED MINI ICONS VIEW */
          <div className="flex flex-col items-center space-y-3 py-1">
            {officers.map((officer) => {
              const initials = officer.name
                .split(' ')
                .map((n) => n[0])
                .slice(-2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={officer.id}
                  className="relative group cursor-pointer"
                  onClick={() => setIsExpanded(true)}
                  title={`${officer.name} (${officer.role}) - ${officer.currentAction}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${officer.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-xs transition-transform group-hover:scale-110`}
                  >
                    {initials}
                  </div>

                  {/* Dot status */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                      officer.status === 'TYPING'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-emerald-500'
                    }`}
                  />

                  {/* Tooltip on hover */}
                  <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap pointer-events-none">
                    <div className="font-bold">{officer.name}</div>
                    <div className="text-[9.5px] text-slate-300">{officer.role}</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">{officer.currentAction}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bottom Quick Actions of the Vertical Bar */}
      {isExpanded ? (
        <div className="p-3 border-t border-slate-200 bg-slate-50/90 space-y-2 shrink-0">
          <button
            onClick={onOpenUserProfileModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Khai Báo Định Danh Cán Bộ</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleSendPing}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              title="Phát tín hiệu đồng bộ đến các ban chỉ huy"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ping Đồng Bộ</span>
            </button>

            <button
              onClick={onOpenBchLogs}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition cursor-pointer active:scale-95"
              title="Xem toàn bộ nhật ký sự kiện Ban Chỉ Huy"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Xem Nhật Ký</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-200 flex flex-col items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
            title="Mở rộng danh sách cán bộ"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
