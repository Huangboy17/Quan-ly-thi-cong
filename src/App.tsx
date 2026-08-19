import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Project,
  ActiveNavMenu,
  GlobalTimeFilter,
  PaymentBatch,
  BchActivityLog,
  UserProfile,
} from './types';
import { generate52SampleProjects } from './data/sampleData';
import {
  calculateKPISummary,
  calculateProjectStatus,
  exportProjectsToExcel,
  getProjectCompletionPercentage,
  isProjectInMonth,
  formatBillionVN,
  formatVND,
} from './utils/helpers';
import {
  generateSeedActivityLogs,
} from './utils/activityLogs';
import {
  fetchProjects as sbFetchProjects,
  upsertProject as sbUpsertProject,
  upsertManyProjects as sbUpsertMany,
  deleteProject as sbDeleteProject,
  deleteManyProjects as sbDeleteMany,
  replaceAllProjects as sbReplaceAll,
  fetchActivityLogs as sbFetchLogs,
  insertActivityLog as sbInsertLog,
  insertManyActivityLogs as sbInsertManyLogs,
  clearActivityLogs as sbClearLogs,
  fetchUserProfile as sbFetchUserProfile,
  updateMyProfile,
  subscribeToProjects,
  subscribeToActivityLogs,
} from './services/supabaseService';
import { exportProjectsToPdf, PdfColumnOptions } from './utils/exportPdf';
import { Header } from './components/Header';
import { TopFilterToolbar } from './components/TopFilterToolbar';
import { SidebarMenu } from './components/SidebarMenu';
import { DashboardView } from './components/DashboardView';
import { ContractsView } from './components/ContractsView';
import { PaymentsView } from './components/PaymentsView';
import { BchActivityView } from './components/BchActivityView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MemberManager } from './components/level1/MemberManager';
import { AuthForm } from './components/AuthForm';
import { ResetPassword } from './components/ResetPassword';
import { supabase } from './lib/supabase';
import { ActiveOfficersSidebar } from './components/ActiveOfficersSidebar';
import { ProjectModal } from './components/ProjectModal';
import { PaymentModal } from './components/PaymentModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DetailModal } from './components/DetailModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PdfExportModal, DEFAULT_PDF_COLUMN_OPTIONS } from './components/PdfExportModal';
import { UserProfileModal, getSavedUserProfile, saveUserProfileToStorage } from './components/UserProfileModal';
import { Toast } from './components/Toast';
import { Building2 } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeMenu, setActiveMenu] = useState<ActiveNavMenu>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [bchLogs, setBchLogs] = useState<BchActivityLog[]>([]);
  const [isPresenceSidebarOpen, setIsPresenceSidebarOpen] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<string>('ALL');

  // Global Time & Scope Filter
  const [globalFilter, setGlobalFilter] = useState<GlobalTimeFilter>({
    year: 'ALL',
    quarter: 'ALL',
    month: 'ALL',
    fromDate: '',
    toDate: '',
    duAn: 'ALL',
    nhomChiPhi: 'ALL',
    nhaThau: 'ALL',
    chuDauTu: 'ALL',
    diaPhuong: 'ALL',
    revenuePeriod: 'ALL',
  });

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSelectedProject, setPaymentSelectedProject] = useState<Project | undefined>(undefined);

  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const [isCloudActive] = useState(true);

  // Night Shift / Dark Mode State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cvb_theme_mode');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('cvb_theme_mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('cvb_theme_mode', 'light');
      }
    } catch (e) {
      console.warn('Failed to toggle theme in localStorage', e);
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'Đã bật Chế độ Ban Đêm (Eye-safe Dark Mode) cho công trường!'
          : 'Đã chuyển sang Chế độ Ban Ngày (Light Mode)!'
      );
      return next;
    });
  };

  // ═══ SUPABASE: Load initial data from cloud ═══
  const loadProjectsFromSupabase = useCallback(async () => {
    try {
      const data = await sbFetchProjects();
      if (data.length > 0) {
        setProjects(data);
      } else {
        // DB rỗng → nạp 52 mẫu lên Supabase
        const samples = generate52SampleProjects();
        setProjects(samples);
        await sbReplaceAll(samples);
        console.log('✅ Đã nạp 52 dự án mẫu lên Supabase');
      }
    } catch (e) {
      console.error('❌ Lỗi tải dữ liệu từ Supabase:', e);
    }
  }, []);

  const loadLogsFromSupabase = useCallback(async () => {
    try {
      const logs = await sbFetchLogs();
      if (logs.length > 0) {
        setBchLogs(logs);
      } else {
        // Seed logs nếu DB rỗng
        const seedLogs = generateSeedActivityLogs(projects);
        if (seedLogs.length > 0) {
          await sbInsertManyLogs(seedLogs);
          setBchLogs(seedLogs);
          console.log('✅ Đã nạp nhật ký mẫu BCH lên Supabase');
        }
      }
    } catch (e) {
      console.error('❌ Lỗi tải nhật ký từ Supabase:', e);
    }
  }, [projects]);

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setProjects([]);
        setBchLogs([]);
        setAuthLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // Recovery sets a session, we let it load profile or we can just proceed
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setAuthLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
      } else {
        // fallback
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setAuthLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await sbFetchUserProfile(userId);
      if (profile) {
        setUserProfile(profile);
      }
    } catch (e) {
      console.error('Lỗi tải Profile:', e);
    } finally {
      setAuthLoading(false);
      // Load data sau khi có profile (và session)
      loadProjectsFromSupabase();
      loadLogsFromSupabase();
    }
  };

  // ═══ SUPABASE: Realtime subscription ═══
  useEffect(() => {
    if (!session) return;
    const unsubProjects = subscribeToProjects(() => {
      console.log('🔄 Realtime: projects changed, reloading...');
      loadProjectsFromSupabase();
    });
    const unsubLogs = subscribeToActivityLogs(() => {
      console.log('🔄 Realtime: logs changed, reloading...');
      loadLogsFromSupabase();
    });
    return () => {
      unsubProjects();
      unsubLogs();
    };
  }, [session, loadProjectsFromSupabase, loadLogsFromSupabase]);

  useEffect(() => {
    if (userProfile?.accountType === 'super_admin' && activeMenu !== 'ADMIN_SYSTEM') {
      setActiveMenu('ADMIN_SYSTEM');
    }
  }, [userProfile?.accountType]);

  // Filtered projects according to global filter + global search
  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return projects.filter((p) => {
      // Contract Specific Filter (From Sidebar List)
      if (
        selectedContractId !== 'ALL' &&
        p.id !== selectedContractId &&
        p.maCongTrinh !== selectedContractId &&
        p.soHopDong !== selectedContractId
      ) {
        return false;
      }

      // Global Search
      if (query) {
        const matchQuery =
          p.maCongTrinh.toLowerCase().includes(query) ||
          p.soHopDong.toLowerCase().includes(query) ||
          p.tenCongTrinh.toLowerCase().includes(query) ||
          (p.nhaThau && p.nhaThau.toLowerCase().includes(query)) ||
          (p.chuDauTu && p.chuDauTu.toLowerCase().includes(query)) ||
          (p.diaPhuong && p.diaPhuong.toLowerCase().includes(query)) ||
          (p.duAn && p.duAn.toLowerCase().includes(query));
        if (!matchQuery) return false;
      }

      // Project Filter
      if (globalFilter.duAn !== 'ALL' && p.duAn !== globalFilter.duAn) {
        return false;
      }

      // Investor Filter (Chủ Đầu Tư)
      if (
        globalFilter.chuDauTu &&
        globalFilter.chuDauTu !== 'ALL' &&
        p.chuDauTu !== globalFilter.chuDauTu
      ) {
        return false;
      }

      // Province Filter (Địa Phương)
      if (
        globalFilter.diaPhuong &&
        globalFilter.diaPhuong !== 'ALL' &&
        p.diaPhuong !== globalFilter.diaPhuong
      ) {
        return false;
      }

      // Cost Group Filter
      if (globalFilter.nhomChiPhi !== 'ALL' && p.nhomChiPhi !== globalFilter.nhomChiPhi) {
        return false;
      }

      // Contractor Filter
      if (globalFilter.nhaThau !== 'ALL' && p.nhaThau !== globalFilter.nhaThau) {
        return false;
      }

      // Year Filter
      if (globalFilter.year !== 'ALL') {
        const checkYear = (d?: string) => d && d.startsWith(globalFilter.year);
        const hasYear =
          checkYear(p.ngayHopDong) ||
          checkYear(p.tienDoHopDong) ||
          checkYear(p.tienDoTgdDuyet) ||
          checkYear(p.tienDoThucTe);
        if (!hasYear && !p.soHopDong.includes(globalFilter.year)) {
          return false;
        }
      }

      // Month Filter
      if (globalFilter.month !== 'ALL') {
        const monthNum = globalFilter.month.padStart(2, '0');
        const checkMonth = (d?: string) => d && d.includes(`-${monthNum}-`);
        const hasMonth =
          checkMonth(p.ngayHopDong) ||
          checkMonth(p.tienDoHopDong) ||
          checkMonth(p.tienDoTgdDuyet) ||
          checkMonth(p.tienDoThucTe);
        if (!hasMonth) {
          return false;
        }
      }

      // From / To Date Filter
      if (globalFilter.fromDate) {
        if (p.ngayHopDong && p.ngayHopDong < globalFilter.fromDate) return false;
      }
      if (globalFilter.toDate) {
        if (p.ngayHopDong && p.ngayHopDong > globalFilter.toDate) return false;
      }

      return true;
    });
  }, [projects, searchQuery, globalFilter, selectedContractId]);

  // Total payments count
  const totalPaymentsCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.paymentBatches?.length || 3), 0);
  }, [projects]);

  const isResetPasswordRoute = window.location.pathname === '/reset-password';

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
      setProjects([]);
      setBchLogs([]);
      setActiveMenu('DASHBOARD');
      showToast('Đã đăng xuất thành công!');
    } catch (e: any) {
      console.error('Lỗi đăng xuất:', e);
      showToast('Có lỗi xảy ra khi đăng xuất!', 'error');
    }
  };

  if (isResetPasswordRoute) {
    return <ResetPassword />;
  }

  // Nếu đang tải Auth, hiển thị loading
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500">Đang tải dữ liệu hệ thống...</div>;
  }

  // Nếu chưa đăng nhập, hiển thị AuthForm
  if (!session) {
    return <AuthForm onSuccess={() => {}} />;
  }

  // Cảnh báo trạng thái tài khoản
  if (userProfile?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-amber-200 dark:border-amber-900/50">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Đang chờ phê duyệt</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tài khoản của bạn đã được ghi nhận và đang chờ Super Admin phê duyệt. Vui lòng quay lại sau!
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-blue-600 font-medium hover:underline">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (userProfile?.status === 'locked' || userProfile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-rose-200 dark:border-rose-900/50">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Tài khoản đã bị khóa/từ chối</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tài khoản của bạn không được phép truy cập hệ thống lúc này. Vui lòng liên hệ quản trị viên.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-blue-600 font-medium hover:underline">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  // Nếu đã đăng nhập nhưng chưa có thông tin profile (có thể trigger chưa chạy xong hoặc lỗi)
  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Đang đồng bộ hồ sơ...</p>
        <button 
          onClick={() => loadUserProfile(session.user.id)} 
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Log activity helper — ghi vào Supabase
  const logBchAction = (
    logInput: Omit<BchActivityLog, 'id' | 'timestamp'> & { timestamp?: string }
  ) => {
    const newLog: BchActivityLog = {
      ...logInput,
      id: `bch_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: logInput.timestamp || new Date().toISOString(),
    };
    setBchLogs((prev) => [newLog, ...prev]);
    sbInsertLog(newLog).catch((e) => console.error('❌ Lỗi lưu log:', e));
  };

  // Save projects — ghi vào Supabase (thay localStorage)
  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    // Đồng bộ toàn bộ lên Supabase
    sbUpsertMany(newProjects).catch((e) =>
      console.error('❌ Lỗi đồng bộ projects lên Supabase:', e)
    );
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3200);
  };

  // Handler Actions
  const handleOpenAddContract = () => {
    setEditingProject(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditContract = (p: Project) => {
    setEditingProject(p);
    setIsAddEditModalOpen(true);
  };

  const handleSaveProject = (p: Project) => {
    const idx = projects.findIndex((item) => item.id === p.id);
    let next: Project[];
    const officerName = userProfile?.fullName || p.updatedBy || 'Cán bộ BCH Công Trường';
    const officerRole = userProfile?.role || 'Kỹ Sư QCQS ME-CK';
    const officerEmail = userProfile?.email || 'bch.congtruong@buildcost.vn';

    if (idx !== -1) {
      const existing = projects[idx];
      next = [...projects];
      next[idx] = p;
      showToast(`Đã cập nhật hợp đồng ${p.soHopDong} thành công!`);

      const isMilestoneDiff = JSON.stringify(existing.milestones) !== JSON.stringify(p.milestones);
      const isProgressDiff = existing.tienDoThucTe !== p.tienDoThucTe;

      let actType: any = 'UPDATE_PROJECT';
      let actTitle = `Cập nhật hồ sơ hợp đồng: ${p.soHopDong}`;
      let actDetails = `Cập nhật thông tin hợp đồng [${p.soHopDong}] ${p.tenCongTrinh}`;
      let diffSummary = `Cán bộ thực hiện: ${officerName} (${officerRole})`;

      if (isMilestoneDiff) {
        actType = 'QUICK_MILESTONE';
        actTitle = `Cập nhật Mốc Nghiệm Thu QCQS: ${p.soHopDong}`;
        actDetails = `Cập nhật ngày trình và ngày ký hồ sơ nghiệm thu kỹ thuật cho ${p.tenCongTrinh}`;
        diffSummary = `Mốc NT: Tiến độ thực tế ${p.tienDoThucTe}% | Đồng bộ thời gian thực`;
      } else if (isProgressDiff) {
        actType = 'QUICK_PROGRESS';
        actTitle = `Cập nhật % Tiến độ thi công: ${p.soHopDong}`;
        actDetails = `Cập nhật sản lượng thi công thực tế tại công trường từ ${existing.tienDoThucTe || 0}% lên ${p.tienDoThucTe}%`;
        diffSummary = `Tiến độ thực tế: ${existing.tienDoThucTe || 0}% → ${p.tienDoThucTe}%`;
      }

      logBchAction({
        userName: officerName,
        userRole: officerRole,
        userEmail: officerEmail,
        actionType: actType,
        actionTitle: actTitle,
        projectId: p.id,
        projectCode: p.maCongTrinh,
        contractNo: p.soHopDong,
        projectName: p.tenCongTrinh,
        details: actDetails,
        diffSummary: diffSummary,
      });
    } else {
      next = [p, ...projects];
      showToast(`Đã thêm hợp đồng ${p.soHopDong} mới thành công!`);

      logBchAction({
        userName: officerName,
        userRole: officerRole,
        userEmail: officerEmail,
        actionType: 'CREATE_PROJECT',
        actionTitle: `Khai báo hợp đồng mới: ${p.soHopDong}`,
        projectId: p.id,
        projectCode: p.maCongTrinh,
        contractNo: p.soHopDong,
        projectName: p.tenCongTrinh,
        details: `Khai báo gói thầu: ${p.tenCongTrinh} | Giá trị: ${formatBillionVN(p.giaTriHdSauVat)} | Dự án: ${p.duAn || '-'}`,
        diffSummary: `Tạo mới HĐ ${p.soHopDong} | Phân bổ ${p.nhomChiPhi || '-'}`,
      });
    }
    saveProjects(next);
  };

  const handleDeleteProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận xóa hợp đồng',
      message: `Bạn có chắc chắn muốn xóa hợp đồng ${target?.soHopDong || ''} (${target?.tenCongTrinh || ''}) khỏi hệ thống?`,
      onConfirm: () => {
        const next = projects.filter((p) => p.id !== id);
        setProjects(next);
        sbDeleteProject(id).catch((e) => console.error('❌ Lỗi xóa project:', e));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Đã xóa hợp đồng khỏi hệ thống!', 'success');

        if (target) {
          logBchAction({
            userName: userProfile?.fullName || 'Cán bộ Quản Trị',
            userRole: userProfile?.role || 'Chỉ Huy Trưởng ME-CK',
            userEmail: userProfile?.email || 'admin.qcqs@buildcost.vn',
            actionType: 'DELETE_PROJECT',
            actionTitle: `Xóa hợp đồng: ${target.soHopDong}`,
            projectId: target.id,
            projectCode: target.maCongTrinh,
            contractNo: target.soHopDong,
            projectName: target.tenCongTrinh,
            details: `Xóa gói thầu "${target.tenCongTrinh}" khỏi cơ sở dữ liệu hệ thống.`,
            diffSummary: `Đã xóa HĐ ${target.soHopDong}`,
          });
        }
      },
    });
  };

  const handleResetSampleData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Khởi tạo lại 52 Hợp Đồng Mẫu',
      message:
        'Hành động này sẽ nạp lại toàn bộ 52 hợp đồng mẫu chuẩn hóa với đầy đủ số liệu tài chính, phân bổ dự án và 8 mốc nghiệm thu QCQS. Bạn có muốn tiếp tục?',
      onConfirm: async () => {
        try {
          const samples = generate52SampleProjects();
          setProjects(samples);
          await sbReplaceAll(samples);

          const seedLogs = generateSeedActivityLogs(samples);
          await sbClearLogs();
          await sbInsertManyLogs(seedLogs);
          setBchLogs(seedLogs);

          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          showToast('Đã nạp lại 52 hợp đồng mẫu & lịch sử Ban Chỉ Huy lên Supabase thành công!');
        } catch (e) {
          console.error('❌ Lỗi reset sample data:', e);
          showToast('Có lỗi khi nạp dữ liệu mẫu!', 'error');
        }
      },
    });
  };

  const handleExportExcel = () => {
    if (filteredProjects.length === 0) {
      showToast('Không có dữ liệu hợp đồng để xuất Excel!', 'error');
      return;
    }
    exportProjectsToExcel(filteredProjects);
    showToast('Đã xuất báo cáo Excel thành công!');
  };

  const handleOpenPaymentModal = (p?: Project) => {
    setPaymentSelectedProject(p);
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentBatch = (projectId: string, batch: PaymentBatch) => {
    const targetProject = projects.find((p) => p.id === projectId);
    const next = projects.map((p) => {
      if (p.id === projectId) {
        const currentBatches = p.paymentBatches || [];
        const updatedBatches = [batch, ...currentBatches];
        const newLuyKe =
          batch.trangThai === 'DA_CHI' ? (p.luyKeDaChi || 0) + batch.giaTriSauVat : p.luyKeDaChi;
        return {
          ...p,
          paymentBatches: updatedBatches,
          luyKeDaChi: newLuyKe,
          soDotThanhToan: updatedBatches.length,
          conLaiChuaChi: Math.max(0, (p.giaTriHdSauVat || 0) - newLuyKe),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    saveProjects(next);
    showToast(`Đã ghi nhận đợt thanh toán "${batch.tenDot}" thành công!`);

    logBchAction({
      userName: userProfile?.fullName || 'Cán bộ Ban Chỉ Huy',
      userRole: userProfile?.role || 'Chuyên Viên QLDA & Thanh Toán',
      userEmail: userProfile?.email || 'thanhtoan.bch@buildcost.vn',
      actionType: 'ADD_PAYMENT',
      actionTitle: `Khai báo đợt giải ngân: ${batch.tenDot}`,
      projectId: targetProject?.id,
      projectCode: targetProject?.maCongTrinh,
      contractNo: targetProject?.soHopDong,
      projectName: targetProject?.tenCongTrinh,
      details: `Đợt ${batch.dotSo}: ${batch.tenDot} - Giá trị: ${formatBillionVN(batch.giaTriSauVat)} (Trạng thái: ${batch.trangThai === 'DA_CHI' ? 'Đã chi trả' : 'Đang trình duyệt chi'})`,
      diffSummary: `Đề nghị thanh toán: ${formatBillionVN(batch.giaTriSauVat)} | Thực nhận: ${formatBillionVN(batch.giaTriThucNhan)}`,
    });
  };

  const handleImportExcelProjects = (imported: Project[]) => {
    const next = [...imported, ...projects];
    saveProjects(next);
    showToast(`Đã import thành công ${imported.length} hợp đồng từ Excel!`);

    logBchAction({
      userName: userProfile?.fullName || 'Cán bộ Ban Chỉ Huy',
      userRole: userProfile?.role || 'Kỹ Sư Quản Lý Chi Phí',
      userEmail: userProfile?.email || 'qs.excel@buildcost.vn',
      actionType: 'IMPORT_EXCEL',
      actionTitle: `Import dữ liệu từ file Excel`,
      details: `Đã nạp thành công ${imported.length} hợp đồng vào hệ thống quản lý chi phí & nghiệm thu.`,
      diffSummary: `Import ${imported.length} hợp đồng mới`,
    });
  };

  const handleViewDetail = (p: Project) => {
    setDetailProject(p);
    setIsDetailModalOpen(true);
  };

  // Bulk Operations Handlers
  const handleBulkAdd = (newItems: Project[]) => {
    if (!newItems.length) return;
    const next = [...newItems, ...projects];
    saveProjects(next);
    showToast(`Đã thêm thành công ${newItems.length} hợp đồng mới vào hệ thống!`);

    const officerName = userProfile?.fullName || 'Cán bộ BCH Công Trường';
    const officerRole = userProfile?.role || 'Kỹ Sư QCQS ME-CK';
    const officerEmail = userProfile?.email || 'bch.congtruong@buildcost.vn';

    logBchAction({
      userName: officerName,
      userRole: officerRole,
      userEmail: officerEmail,
      actionType: 'BULK_ADD',
      actionTitle: `Thêm hàng loạt ${newItems.length} hợp đồng`,
      details: `Đã khai báo hàng loạt ${newItems.length} gói thầu/hợp đồng mới với tổng giá trị ${formatBillionVN(
        newItems.reduce((acc, p) => acc + (p.giaTriHdSauVat || 0), 0)
      )}.`,
      diffSummary: `+${newItems.length} HĐ: ${newItems.slice(0, 3).map((p) => p.maCongTrinh).join(', ')}${newItems.length > 3 ? '...' : ''}`,
    });
  };

  const handleBulkDelete = (projectIds: string[]) => {
    if (!projectIds.length) return;
    const deletedProjects = projects.filter((p) => projectIds.includes(p.id));
    const next = projects.filter((p) => !projectIds.includes(p.id));
    setProjects(next);
    sbDeleteMany(projectIds).catch((e) => console.error('❌ Lỗi bulk delete:', e));
    showToast(`Đã xóa thành công ${projectIds.length} hợp đồng khỏi hệ thống!`);

    const officerName = userProfile?.fullName || 'Cán bộ Ban Chỉ Huy';
    const officerRole = userProfile?.role || 'Chỉ Huy Trưởng ME-CK';
    const officerEmail = userProfile?.email || 'admin.qcqs@buildcost.vn';

    logBchAction({
      userName: officerName,
      userRole: officerRole,
      userEmail: officerEmail,
      actionType: 'BULK_DELETE',
      actionTitle: `Xóa hàng loạt ${projectIds.length} hợp đồng`,
      details: `Đã xóa vĩnh viễn ${projectIds.length} gói thầu/hợp đồng khỏi cơ sở dữ liệu hệ thống.`,
      diffSummary: `Xóa ${projectIds.length} HĐ: ${deletedProjects.slice(0, 3).map((p) => p.maCongTrinh).join(', ')}${projectIds.length > 3 ? '...' : ''}`,
    });
  };

  const handleBulkUpdate = (projectIds: string[], updates: Partial<Project>) => {
    if (!projectIds.length) return;
    const next = projects.map((p) => {
      if (projectIds.includes(p.id)) {
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        // Recalculate remaining amount if value or payment batches were affected
        if (updates.giaTriHdSauVat !== undefined) {
          updated.conLaiChuaChi = Math.max(0, updates.giaTriHdSauVat - (p.luyKeDaChi || 0));
        }
        return updated;
      }
      return p;
    });

    saveProjects(next);
    showToast(`Đã cập nhật hàng loạt ${projectIds.length} hợp đồng thành công!`);

    const officerName = userProfile?.fullName || 'Cán bộ Ban Chỉ Huy';
    const officerRole = userProfile?.role || 'Kỹ Sư QCQS ME-CK';
    const officerEmail = userProfile?.email || 'bch.congtruong@buildcost.vn';

    const fieldsChanged = Object.keys(updates).join(', ');

    logBchAction({
      userName: officerName,
      userRole: officerRole,
      userEmail: officerEmail,
      actionType: 'BULK_UPDATE',
      actionTitle: `Cập nhật hàng loạt ${projectIds.length} hợp đồng`,
      details: `Đã cập nhật các trường [${fieldsChanged}] cho ${projectIds.length} hợp đồng đã chọn.`,
      diffSummary: `Cập nhật ${projectIds.length} HĐ (${fieldsChanged})`,
    });
  };

  const handleBulkDuplicate = (projectIds: string[]) => {
    if (!projectIds.length) return;
    const targets = projects.filter((p) => projectIds.includes(p.id));
    const now = new Date().toISOString();

    const duplicates: Project[] = targets.map((orig, i) => {
      const newId = `dup_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`;
      return {
        ...orig,
        id: newId,
        maCongTrinh: `${orig.maCongTrinh}_COPY`,
        soHopDong: `${orig.soHopDong}-COPY`,
        tenCongTrinh: `${orig.tenCongTrinh} (Bản sao)`,
        luyKeDaChi: 0,
        conLaiChuaChi: orig.giaTriHdSauVat,
        soDotThanhToan: 0,
        tienDoThucTe: 0,
        paymentBatches: [],
        createdAt: now,
        updatedAt: now,
      };
    });

    const next = [...duplicates, ...projects];
    saveProjects(next);
    showToast(`Đã nhân bản ${duplicates.length} hợp đồng thành công!`);

    const officerName = userProfile?.fullName || 'Cán bộ Ban Chỉ Huy';
    const officerRole = userProfile?.role || 'Kỹ Sư QCQS ME-CK';
    const officerEmail = userProfile?.email || 'bch.congtruong@buildcost.vn';

    logBchAction({
      userName: officerName,
      userRole: officerRole,
      userEmail: officerEmail,
      actionType: 'BULK_DUPLICATE',
      actionTitle: `Nhân bản hàng loạt ${duplicates.length} hợp đồng`,
      details: `Tạo bản sao độc lập cho ${duplicates.length} gói thầu/hợp đồng nhằm phục vụ giai đoạn phát sinh / phụ lục.`,
      diffSummary: `Nhân bản ${duplicates.length} HĐ mới`,
    });
  };

  const handleMoveProject = (idx: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= filteredProjects.length) return;

    const currentProject = filteredProjects[idx];
    const targetProject = filteredProjects[targetIdx];

    const masterIdxCurrent = projects.findIndex((p) => p.id === currentProject.id);
    const masterIdxTarget = projects.findIndex((p) => p.id === targetProject.id);

    if (masterIdxCurrent === -1 || masterIdxTarget === -1) return;

    const updatedProjects = [...projects];
    const temp = updatedProjects[masterIdxCurrent];
    updatedProjects[masterIdxCurrent] = updatedProjects[masterIdxTarget];
    updatedProjects[masterIdxTarget] = temp;

    saveProjects(updatedProjects);
  };

  const handleQuickExportPdf = async () => {
    if (filteredProjects.length === 0) {
      showToast('Không có dữ liệu hợp đồng phù hợp để xuất PDF!', 'error');
      return;
    }
    await handleExecuteExportPdf(DEFAULT_PDF_COLUMN_OPTIONS);
  };

  const handleExecuteExportPdf = async (
    columnOptions: PdfColumnOptions,
    selectedProjectIds?: string[]
  ) => {
    try {
      setIsExportingPdf(true);
      showToast('Đang khởi tạo báo cáo PDF chuyên nghiệp...', 'info');

      const kpiSummary = calculateKPISummary(filteredProjects);
      await exportProjectsToPdf({
        filteredProjects,
        selectedProjectIds,
        totalProjectsCount: projects.length,
        kpiSummary,
        statusFilter: 'ALL',
        selectedQuartile: null,
        selectedMonth: globalFilter.month,
        searchQuery,
        columnOptions,
      });

      setIsPdfModalOpen(false);
      showToast('Đã xuất báo cáo PDF thành công!');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      showToast('Có lỗi xảy ra khi tạo tệp PDF!', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="text-slate-800 dark:text-slate-100 antialiased min-h-screen flex flex-col bg-slate-50/90 dark:bg-[#0b0f19] font-sans transition-colors duration-200">
      {/* 1. Header (Brand, Global Search, Quick Actions, User Declaration, Dark Mode) */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={handleOpenAddContract}
        onOpenPaymentModal={() => handleOpenPaymentModal()}
        onExportExcel={handleExportExcel}
        onQuickExportPdf={handleQuickExportPdf}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        isExportingPdf={isExportingPdf}
        onResetSampleData={handleResetSampleData}
        isCloudActive={isCloudActive}
        totalProjects={projects.length}
        userProfile={userProfile}
        onOpenUserProfileModal={() => setIsUserProfileModalOpen(true)}
        onOpenBchLogs={() => setActiveMenu('BCH_LOGS')}
        isPresenceSidebarOpen={isPresenceSidebarOpen}
        onTogglePresenceSidebar={() => setIsPresenceSidebarOpen(!isPresenceSidebarOpen)}
        activePresenceCount={6}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onLogout={handleLogout}
        onNavigateToAdmin={() => setActiveMenu('ADMIN_SYSTEM')}
      />

      {/* 2. Top Filter Toolbar (Thời gian, Dự án, Nhóm CP, Nhà thầu, Chủ Đầu Tư, Địa Phương, Doanh Thu) */}
      <TopFilterToolbar
        filter={globalFilter}
        onChangeFilter={setGlobalFilter}
        onResetFilter={() => {
          setSelectedContractId('ALL');
          setGlobalFilter({
            year: 'ALL',
            quarter: 'ALL',
            month: 'ALL',
            fromDate: '',
            toDate: '',
            duAn: 'ALL',
            nhomChiPhi: 'ALL',
            nhaThau: 'ALL',
            chuDauTu: 'ALL',
            diaPhuong: 'ALL',
            revenuePeriod: 'ALL',
          });
          setSearchQuery('');
        }}
      />

      {/* 3. Main Workspace with Left Sidebar and View Content */}
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* Left Sidebar Menu */}
        <SidebarMenu
          userProfile={userProfile}
          activeMenu={activeMenu}
          onSelectMenu={setActiveMenu}
          projects={projects}
          totalContracts={projects.length}
          totalPaymentsCount={totalPaymentsCount}
          bchLogsCount={bchLogs.length}
          selectedContractId={selectedContractId}
          onSelectContract={(contractId) => {
            setSelectedContractId(contractId);
            if (contractId !== 'ALL') {
              if (activeMenu === 'BCH_LOGS') {
                setActiveMenu('CONTRACTS');
              }
            }
          }}
          selectedProject={globalFilter.duAn}
          onSelectProject={(proj) => setGlobalFilter({ ...globalFilter, duAn: proj })}
          onOpenAddProjectModal={handleOpenAddContract}
        />

        {/* Dynamic Center/Right Content Area */}
        <main className="flex-1 p-3 sm:p-4 overflow-y-auto max-w-full">
          {activeMenu === 'DASHBOARD' && (
            <DashboardView
              projects={filteredProjects}
              allProjects={projects}
              selectedContractId={selectedContractId}
              onSelectContract={setSelectedContractId}
              onResetContractSelection={() => setSelectedContractId('ALL')}
              globalFilter={globalFilter}
              onOpenAddContractModal={handleOpenAddContract}
              onOpenAddPaymentModal={() => handleOpenPaymentModal()}
              onViewProject={handleViewDetail}
              onSelectCostGroup={(cg) => {
                setGlobalFilter({ ...globalFilter, nhomChiPhi: cg });
                setActiveMenu('CONTRACTS');
              }}
              onSelectProject={(proj) => {
                setGlobalFilter({ ...globalFilter, duAn: proj });
                setActiveMenu('CONTRACTS');
              }}
            />
          )}

          {activeMenu === 'CONTRACTS' && (
            <ContractsView
              projects={filteredProjects}
              selectedContractId={selectedContractId}
              onResetContractSelection={() => setSelectedContractId('ALL')}
              onOpenAddModal={handleOpenAddContract}
              onOpenImportExcelModal={() => setIsExcelImportModalOpen(true)}
              onViewProject={handleViewDetail}
              onEditProject={handleOpenEditContract}
              onDeleteProject={handleDeleteProject}
              onMoveProject={handleMoveProject}
              onOpenPaymentBatchModal={handleOpenPaymentModal}
              onSaveProject={handleSaveProject}
              onBulkAdd={handleBulkAdd}
              onBulkDelete={handleBulkDelete}
              onBulkUpdate={handleBulkUpdate}
              onBulkDuplicate={handleBulkDuplicate}
            />
          )}

          {activeMenu === 'PAYMENTS' && (
            <PaymentsView
              projects={filteredProjects}
              onOpenAddPaymentModal={() => handleOpenPaymentModal()}
              onViewProject={handleViewDetail}
            />
          )}

          {activeMenu === 'BCH_LOGS' && (
            <BchActivityView
              logs={bchLogs}
              projects={projects}
              currentUserProfile={userProfile || undefined}
              onViewProject={handleViewDetail}
              onOpenUserProfileModal={() => setIsUserProfileModalOpen(true)}
              onAddManualLog={(newLog) => {
                setBchLogs((prev) => [newLog, ...prev]);
                showToast('Đã lưu nhật ký hoạt động Ban Chỉ Huy thành công!');
              }}
              onClearLogs={() => {
                sbClearLogs().catch((e) => console.error('❌ Lỗi xóa logs:', e));
                setBchLogs([]);
                showToast('Đã xóa toàn bộ nhật ký BCH.', 'info');
              }}
              onSelectProject={(projName) => {
                setGlobalFilter({ ...globalFilter, duAn: projName });
                setActiveMenu('CONTRACTS');
              }}
            />
          )}

          {activeMenu === 'ADMIN_SYSTEM' && (
            <AdminDashboard />
          )}

          {activeMenu === 'MEMBER_MANAGER' && userProfile && (
            <MemberManager currentUser={userProfile} />
          )}
        </main>

        {/* Right Vertical Bar: Real-time Active Officers & Typing Presence */}
        {isPresenceSidebarOpen && (
          <ActiveOfficersSidebar
            currentUserProfile={userProfile}
            bchLogs={bchLogs}
            projects={projects}
            onOpenUserProfileModal={() => setIsUserProfileModalOpen(true)}
            onOpenBchLogs={() => setActiveMenu('BCH_LOGS')}
            onSelectProjectContract={(contractNo) => {
              setSearchQuery(contractNo);
              setActiveMenu('CONTRACTS');
            }}
          />
        )}
      </div>

      {/* Footer System Status */}
      <footer className="bg-white text-slate-600 py-3 border-t border-slate-200 text-xs shrink-0 shadow-xs">
        <div className="max-w-[1920px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>[CVB] PHÒNG QCQS ME-CK — GIÁM SÁT NGHIỆM THU & QUẢN LÝ DÒNG TIỀN THANH TOÁN</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-medium text-[11px]">
            <span>
              Đang hiển thị: <strong className="text-slate-900 font-bold">{filteredProjects.length}</strong> / <strong className="text-slate-900 font-bold">{projects.length}</strong> Hợp đồng
            </span>
            <span className="text-slate-300">|</span>
            <span>Hệ thống: <strong className="text-emerald-600 font-bold">Đồng bộ CSDL Realtime</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        initialProfile={userProfile}
        onSaveProfile={(profile) => {
          setUserProfile(profile);
          // Sync basic profile info (fullName, role)
          updateMyProfile(profile.id!, { fullName: profile.fullName, role: profile.role })
            .catch((e) => console.error('❌ Lỗi cập nhật profile:', e));
          setIsUserProfileModalOpen(false);
          showToast(`Đã cập nhật thông tin thành công.`);
        }}
      />

      <ProjectModal
        isOpen={isAddEditModalOpen}
        project={editingProject}
        onClose={() => setIsAddEditModalOpen(false)}
        onSave={handleSaveProject}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        projects={projects}
        selectedProject={paymentSelectedProject}
        onClose={() => setIsPaymentModalOpen(false)}
        onSavePayment={handleSavePaymentBatch}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportProjects={handleImportExcelProjects}
      />

      <DetailModal
        isOpen={isDetailModalOpen}
        project={detailProject}
        onClose={() => setIsDetailModalOpen(false)}
        bchLogs={bchLogs}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <PdfExportModal
        isOpen={isPdfModalOpen}
        isExporting={isExportingPdf}
        totalProjects={filteredProjects.length}
        projects={filteredProjects}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={handleExecuteExportPdf}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} />
    </div>
  );
}
