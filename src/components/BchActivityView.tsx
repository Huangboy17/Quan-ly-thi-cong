import React, { useState, useMemo } from 'react';
import {
  BchActivityLog,
  Project,
  UserProfile,
  BchActionType,
} from '../types';
import {
  formatRelativeTime,
  formatFullDateTime,
  exportActivityLogsToExcel,
  getActionTypeLabel,
  saveBchActivityLog,
  generateSeedActivityLogs,
} from '../utils/activityLogs';
import {
  Clock,
  User,
  ShieldCheck,
  Building,
  FileSpreadsheet,
  Trash2,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  History,
  Eye,
  PlusCircle,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronRight,
  Send,
  MessageSquare,
  HardHat,
  FolderGit2,
} from 'lucide-react';

interface BchActivityViewProps {
  logs: BchActivityLog[];
  projects?: Project[];
  currentUserProfile?: UserProfile;
  onClearLogs?: () => void;
  onSelectProject?: (projName: string) => void;
  onViewProject?: (project: Project) => void;
  onOpenUserProfileModal?: () => void;
  onAddManualLog?: (newLog: BchActivityLog) => void;
}

export const BchActivityView: React.FC<BchActivityViewProps> = ({
  logs = [],
  projects = [],
  currentUserProfile = {
    fullName: 'Kỹ Sư Ban Chỉ Huy',
    role: 'Chỉ Huy Trưởng ME-CK',
    email: 'bch.me@buildcost.vn',
  },
  onClearLogs,
  onSelectProject,
  onViewProject,
  onOpenUserProfileModal,
  onAddManualLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('ALL');
  const [selectedActionType, setSelectedActionType] = useState('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'TABLE'>('TIMELINE');
  const [isNewLogModalOpen, setIsNewLogModalOpen] = useState(false);

  // New Log Form State
  const [formName, setFormName] = useState(currentUserProfile.fullName);
  const [formRole, setFormRole] = useState(currentUserProfile.role);
  const [formEmail, setFormEmail] = useState(currentUserProfile.email);
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || '');
  const [formActionType, setFormActionType] = useState<BchActionType>('QUICK_MILESTONE');
  const [formTitle, setFormTitle] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formDiff, setFormDiff] = useState('');

  // Get unique officers
  const uniqueOfficers = useMemo(() => {
    const officersMap = new Map<string, { name: string; role: string; email: string }>();
    logs.forEach((log) => {
      if (log.userName && !officersMap.has(log.userName)) {
        officersMap.set(log.userName, {
          name: log.userName,
          role: log.userRole,
          email: log.userEmail,
        });
      }
    });
    return Array.from(officersMap.values());
  }, [logs]);

  // Unique Action Types
  const actionTypes: { value: string; label: string }[] = [
    { value: 'ALL', label: 'Tất Cả Thao Tác' },
    { value: 'QUICK_MILESTONE', label: 'Cập Nhật Mốc Nghiệm Thu' },
    { value: 'QUICK_PROGRESS', label: 'Cập Nhật % Tiến Độ' },
    { value: 'ADD_PAYMENT', label: 'Thêm Đợt Giải Ngân' },
    { value: 'CREATE_PROJECT', label: 'Tạo Hợp Đồng Mới' },
    { value: 'UPDATE_PROJECT', label: 'Chỉnh Sửa Hợp Đồng' },
    { value: 'IMPORT_EXCEL', label: 'Import Dữ Liệu Excel' },
    { value: 'DELETE_PROJECT', label: 'Xóa Hợp Đồng' },
  ];

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.actionTitle?.toLowerCase().includes(q);
        const matchUser = log.userName?.toLowerCase().includes(q);
        const matchEmail = log.userEmail?.toLowerCase().includes(q);
        const matchContract = log.contractNo?.toLowerCase().includes(q);
        const matchProject = log.projectName?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        if (
          !matchTitle &&
          !matchUser &&
          !matchEmail &&
          !matchContract &&
          !matchProject &&
          !matchDetails
        ) {
          return false;
        }
      }

      // Officer
      if (selectedOfficer !== 'ALL' && log.userName !== selectedOfficer) {
        return false;
      }

      // Action Type
      if (selectedActionType !== 'ALL' && log.actionType !== selectedActionType) {
        return false;
      }

      // Project Filter
      if (
        selectedProjectFilter !== 'ALL' &&
        log.projectName !== selectedProjectFilter &&
        log.contractNo !== selectedProjectFilter
      ) {
        return false;
      }

      return true;
    });
  }, [logs, searchQuery, selectedOfficer, selectedActionType, selectedProjectFilter]);

  // Handle Manual Log Submission
  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Vui lòng nhập Tiêu đề hoạt động!');
      return;
    }

    const matchedProj = projects.find((p) => p.id === formProjectId);

    const newLogItem = saveBchActivityLog({
      userName: formName.trim() || 'Cán Bộ BCH',
      userRole: formRole.trim() || 'Kỹ Sư QCQS',
      userEmail: formEmail.trim() || 'bch@buildcost.vn',
      actionType: formActionType,
      actionTitle: formTitle.trim(),
      projectId: matchedProj?.id,
      projectCode: matchedProj?.maCongTrinh,
      contractNo: matchedProj?.soHopDong,
      projectName: matchedProj?.tenCongTrinh,
      details: formDetails.trim() || 'Đã ghi nhận nhật ký hiện trường & cập nhật hồ sơ nghiệm thu.',
      diffSummary: formDiff.trim() || 'Ghi nhận trực tiếp từ hiện trường công trình',
    });

    if (onAddManualLog) {
      onAddManualLog(newLogItem);
    }

    // Reset and close
    setFormTitle('');
    setFormDetails('');
    setFormDiff('');
    setIsNewLogModalOpen(false);
  };

  // Seed sample logs
  const handleSeedDemoLogs = () => {
    if (projects.length === 0) {
      alert('Không tìm thấy danh sách dự án để tạo nhật ký mẫu.');
      return;
    }
    const seed = generateSeedActivityLogs(projects);
    seed.forEach((item) => {
      saveBchActivityLog(item);
      if (onAddManualLog) onAddManualLog(item);
    });
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'CREATE_PROJECT':
        return {
          label: 'Tạo Hợp Đồng',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'QUICK_MILESTONE':
        return {
          label: 'Mốc Nghiệm Thu',
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />,
        };
      case 'QUICK_PROGRESS':
        return {
          label: '% Tiến Độ Thi Công',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-700" />,
        };
      case 'ADD_PAYMENT':
        return {
          label: 'Thanh Toán Đợt',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          icon: <Calendar className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'UPDATE_PROJECT':
        return {
          label: 'Sửa Hồ Sơ HĐ',
          badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-700" />,
        };
      case 'IMPORT_EXCEL':
        return {
          label: 'Import Excel',
          badgeClass: 'bg-teal-100 text-teal-900 border-teal-300 font-semibold',
          icon: <FolderGit2 className="w-3.5 h-3.5 text-teal-700" />,
        };
      case 'DELETE_PROJECT':
        return {
          label: 'Xóa Hợp Đồng',
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-700" />,
        };
      default:
        return {
          label: 'Cập Nhật BCH',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
          icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  return (
    <div className="space-y-4 text-slate-800 animate-fadeIn">
      {/* 1. Header & Quick Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10.5px] font-bold px-2.5 py-0.5 rounded-md">
              <HardHat className="w-3.5 h-3.5 text-indigo-700" />
              AUDIT LOG &amp; NHẬT KÝ BAN CHỈ HUY
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Real-time Active
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Lịch Sử Thao Tác &amp; Nhật Ký Nhập Liệu Ban Chỉ Huy
          </h2>
          <p className="text-xs text-slate-500">
            Truy vết chi tiết toàn bộ hoạt động cập nhật mốc nghiệm thu, điều chỉnh tiến độ, duyệt hồ sơ và thanh toán đợt của các cán bộ kỹ thuật.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewLogModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Ghi Nhật Ký BCH Mới</span>
          </button>

          <button
            onClick={() => exportActivityLogsToExcel(filteredLogs)}
            disabled={filteredLogs.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel Nhật Ký</span>
          </button>

          {logs.length === 0 && (
            <button
              onClick={handleSeedDemoLogs}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nạp Nhật Ký Mẫu BCH</span>
            </button>
          )}

          {logs.length > 0 && onClearLogs && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động Ban Chỉ Huy?')) {
                  onClearLogs();
                }
              }}
              className="bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-bold px-2.5 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Xóa toàn bộ lịch sử"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 uppercase">TỔNG LƯỢT THAO TÁC</span>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{logs.length}</div>
            <span className="text-[10.5px] text-indigo-700 font-semibold">{filteredLogs.length} hiển thị</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 uppercase">CÁN BỘ THAM GIA</span>
            <div className="text-xl font-black text-blue-900 font-mono mt-0.5">{uniqueOfficers.length}</div>
            <span className="text-[10.5px] text-blue-700 font-semibold">Chỉ Huy Trưởng, QCQS, Giám Sát</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 uppercase">CẬP NHẬT MỐC NT</span>
            <div className="text-xl font-black text-emerald-800 font-mono mt-0.5">
              {logs.filter((l) => l.actionType === 'QUICK_MILESTONE').length}
            </div>
            <span className="text-[10.5px] text-emerald-700 font-semibold">Biên bản nghiệm thu A-B</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10.5px] font-bold text-slate-500 uppercase">HOẠT ĐỘNG GẦN NHẤT</span>
            <div className="text-xs font-black text-slate-900 truncate mt-1">
              {logs[0] ? formatRelativeTime(logs[0].timestamp) : 'Chưa có'}
            </div>
            <span className="text-[10px] text-slate-500 truncate block">
              {logs[0] ? logs[0].userName : '-'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2.5">
        <div className="flex flex-col lg:flex-row gap-2.5 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cán bộ, số HĐ, nội dung thao tác..."
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition bg-slate-50/50"
            />
          </div>

          {/* Filters & View Modes */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Filter by Officer */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedOfficer}
                onChange={(e) => setSelectedOfficer(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL">-- Tất cả cán bộ --</option>
                {uniqueOfficers.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Action Type */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedActionType}
                onChange={(e) => setSelectedActionType(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                {actionTypes.map((at) => (
                  <option key={at.value} value={at.value}>
                    {at.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle View Mode */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs">
              <button
                onClick={() => setViewMode('TIMELINE')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  viewMode === 'TIMELINE'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dòng Thời Gian
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng Chi Tiết
              </button>
            </div>

            {/* Reset Filter Button */}
            {(searchQuery || selectedOfficer !== 'ALL' || selectedActionType !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedOfficer('ALL');
                  setSelectedActionType('ALL');
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border border-slate-300"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Content Area: Timeline or Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Chưa có dữ liệu nhật ký phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy thực hiện cập nhật mốc nghiệm thu, nhập hợp đồng mới, hoặc nhấn nút dưới đây để tạo nhật ký mẫu Ban Chỉ Huy.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setIsNewLogModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ghi Nhật Ký BCH Đầu Tiên</span>
            </button>
            <button
              onClick={handleSeedDemoLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 border border-slate-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Tạo 15 Logs Mẫu</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'TIMELINE' ? (
        /* TIMELINE STREAM VIEW */
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const badge = getActionBadge(log.actionType);
            const matchedProject = projects.find(
              (p) => p.id === log.projectId || p.soHopDong === log.contractNo
            );

            return (
              <div
                key={log.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  {/* Left: Officer & Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Action Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.badgeClass}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {/* Relative & Full Time */}
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        ({formatFullDateTime(log.timestamp)})
                      </span>
                    </div>

                    {/* Officer Info */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-900 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        {log.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{log.userName}</span>
                          <span className="text-[10px] bg-slate-100 text-indigo-900 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                            {log.userRole}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.userEmail}</div>
                      </div>
                    </div>

                    {/* Action Title & Project Link */}
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        {log.actionTitle}
                      </h4>

                      {(log.contractNo || log.projectName) && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-slate-100 text-slate-800 text-[10.5px] font-mono font-bold px-2 py-0.5 rounded border border-slate-300">
                            HĐ: {log.contractNo || '-'}
                          </span>
                          <span className="text-xs text-slate-700 font-semibold truncate max-w-md">
                            {log.projectName}
                          </span>
                          {log.projectCode && (
                            <span className="text-[10.5px] text-slate-500 font-mono">
                              ({log.projectCode})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details & Diff Summary */}
                    {log.details && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 font-medium">
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase">
                          Nội dung cập nhật:
                        </div>
                        <div>{log.details}</div>
                        {log.diffSummary && (
                          <div className="mt-1 pt-1 border-t border-slate-200 text-[11px] font-mono text-indigo-900 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Biến động: {log.diffSummary}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Action: Quick Jump to Contract */}
                  {matchedProject && onViewProject && (
                    <div className="shrink-0 pt-1">
                      <button
                        onClick={() => onViewProject(matchedProject)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem HĐ</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px]">
                  <th className="py-2.5 px-3">Thời Gian Real-time</th>
                  <th className="py-2.5 px-3">Cán Bộ BCH / QCQS</th>
                  <th className="py-2.5 px-3">Chức Vụ</th>
                  <th className="py-2.5 px-3">Thao Tác</th>
                  <th className="py-2.5 px-3">Hợp Đồng &amp; Công Trình</th>
                  <th className="py-2.5 px-3">Chi Tiết Biến Động</th>
                  <th className="py-2.5 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const badge = getActionBadge(log.actionType);
                  const matchedProject = projects.find(
                    (p) => p.id === log.projectId || p.soHopDong === log.contractNo
                  );

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatRelativeTime(log.timestamp)}</div>
                        <div className="text-[10px] text-slate-400">{formatFullDateTime(log.timestamp)}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-700 text-white text-[9px] flex items-center justify-center font-bold">
                            {log.userName.charAt(0)}
                          </div>
                          <span>{log.userName}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-indigo-900">{log.userRole}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{log.userEmail}</div>
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${badge.badgeClass}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-mono font-bold text-slate-800 text-[11px]">
                          {log.contractNo || '-'}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">{log.projectName}</div>
                      </td>

                      <td className="py-2.5 px-3 max-w-sm">
                        <div className="text-slate-800 text-[11.5px] font-medium line-clamp-2">
                          {log.details || log.actionTitle}
                        </div>
                        {log.diffSummary && (
                          <div className="text-[10.5px] text-indigo-700 font-mono font-semibold truncate mt-0.5">
                            {log.diffSummary}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {matchedProject && onViewProject && (
                          <button
                            onClick={() => onViewProject(matchedProject)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                          >
                            Xem HĐ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL: GHI NHẬT KÝ HOẠT ĐỘNG BAN CHỈ HUY MỚI */}
      {isNewLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-indigo-900 text-white">
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-indigo-300" />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Ghi Nhật Ký Hoạt Động Ban Chỉ Huy
                </h3>
              </div>
              <button
                onClick={() => setIsNewLogModalOpen(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="p-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cán Bộ Ghi Nhật Ký:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Họ và tên..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chức Vụ / Bộ Phận:
                  </label>
                  <input
                    type="text"
                    required
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Chỉ Huy Trưởng, QCQS..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Công Việc:
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="email@buildcost.vn"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hợp Đồng / Gói Thầu:
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.soHopDong} - {p.tenCongTrinh.slice(0, 25)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Loại Hoạt Động:
                  </label>
                  <select
                    value={formActionType}
                    onChange={(e) => setFormActionType(e.target.value as BchActionType)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900"
                  >
                    <option value="QUICK_MILESTONE">Cập nhật Mốc Nghiệm Thu</option>
                    <option value="QUICK_PROGRESS">Cập nhật % Tiến độ hiện trường</option>
                    <option value="ADD_PAYMENT">Khai báo Thanh Toán Đợt</option>
                    <option value="UPDATE_PROJECT">Kiểm tra hồ sơ nghiệm thu</option>
                    <option value="CREATE_PROJECT">Khởi tạo Hợp đồng mới</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tiêu Đề Hoạt Động:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="Ví dụ: Nghiệm thu hoàn thành lắp đặt ống gió tầng 5..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nội Dung Chi Tiết / Báo Cáo QCQS:
                </label>
                <textarea
                  rows={3}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ghi rõ tình trạng thực tế, kết quả kiểm tra, biên bản kèm theo..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tóm Tắt Biến Động (Diff / Chỉ số):
                </label>
                <input
                  type="text"
                  value={formDiff}
                  onChange={(e) => setFormDiff(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="Ví dụ: Tiến độ 75% -> 85% | Đã ký nghiệm thu Đợt 2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewLogModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lưu Nhật Ký BCH</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
