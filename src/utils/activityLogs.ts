import { BchActivityLog, Project, UserProfile } from '../types';
import * as XLSX from 'xlsx';

export const BCH_LOGS_STORAGE_KEY = 'cvb_bch_activity_logs_v2';

export const getBchActivityLogs = (): BchActivityLog[] => {
  try {
    const data = localStorage.getItem(BCH_LOGS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load BCH activity logs from localStorage', e);
  }
  return [];
};

export const saveBchActivityLog = (
  logInput: Omit<BchActivityLog, 'id' | 'timestamp'> & { timestamp?: string }
): BchActivityLog => {
  const newLog: BchActivityLog = {
    ...logInput,
    id: `bch_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: logInput.timestamp || new Date().toISOString(),
  };

  try {
    const currentLogs = getBchActivityLogs();
    const updatedLogs = [newLog, ...currentLogs].slice(0, 500); // Lưu tối đa 500 logs gần nhất
    localStorage.setItem(BCH_LOGS_STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Failed to save BCH activity log', e);
  }

  return newLog;
};

export const clearBchActivityLogs = () => {
  try {
    localStorage.removeItem(BCH_LOGS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear BCH activity logs', e);
  }
};

/**
 * Format relative time in Vietnamese (e.g. "Vừa xong", "5 phút trước", "2 giờ trước", "Hôm qua", "14/08/2026 14:20")
 */
export const formatRelativeTime = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60 && diffSeconds >= 0) {
      return 'Vừa xong';
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60 && diffMinutes > 0) {
      return `${diffMinutes} phút trước`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24 && diffHours > 0) {
      return `${diffHours} giờ trước`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays < 7 && diffDays > 1) {
      return `${diffDays} ngày trước`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
};

export const formatFullDateTime = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
};

export const generateSeedActivityLogs = (projects: Project[]): BchActivityLog[] => {
  const officers = [
    {
      name: 'Nguyễn Văn Bình',
      role: 'Chỉ Huy Trưởng ME-CK',
      email: 'nguyenvanbinh@buildcost.vn',
    },
    {
      name: 'Trần Đình Trọng',
      role: 'Kỹ Sư QCQS ME-CK',
      email: 'trandinhtrong.qcqs@buildcost.vn',
    },
    {
      name: 'Lê Hoàng Nam',
      role: 'Chỉ Huy Phó ME-CK',
      email: 'lehoangnam.bch@buildcost.vn',
    },
    {
      name: 'Phạm Minh Đức',
      role: 'Kỹ Sư Hồ Sơ Nghiệm Thu',
      email: 'phamminhduc.qs@buildcost.vn',
    },
    {
      name: 'Hoàng Kim Long',
      role: 'Kỹ Sư Giám Sát Hiện Trường',
      email: 'hoangkimlong.me@buildcost.vn',
    },
    {
      name: 'Vũ Quốc Cường',
      role: 'Chuyên Viên Thanh Toán QLDA',
      email: 'vuquoccuong.pda@buildcost.vn',
    },
  ];

  const logs: BchActivityLog[] = [];
  const now = new Date();

  // Tạo seed logs dựa trên các dự án thực tế
  const activeProjects = projects.slice(0, 15);

  activeProjects.forEach((proj, idx) => {
    const officer = officers[idx % officers.length];
    const minutesAgo = (idx + 1) * 22; // cách nhau 22 phút
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000).toISOString();

    if (idx % 3 === 0) {
      // Mốc nghiệm thu
      logs.push({
        id: `seed_bch_${idx}_1`,
        timestamp,
        userName: officer.name,
        userRole: officer.role,
        userEmail: officer.email,
        actionType: 'QUICK_MILESTONE',
        actionTitle: 'Cập nhật tiến độ Mốc Nghiệm Thu QCQS',
        projectId: proj.id,
        projectCode: proj.maCongTrinh,
        contractNo: proj.soHopDong,
        projectName: proj.tenCongTrinh,
        details: `Cập nhật ngày trình và xác nhận ký nghiệm thu mốc hoàn thành lắp đặt hệ thống cơ điện (Trạng thái: Đang trình ký duyệt)`,
        diffSummary: `NT HĐ: 15/07/2026 → Ngày Trình: 18/07/2026 (Chờ ký duyệt A-B)`,
      });
    } else if (idx % 3 === 1) {
      // Tiến độ tổng thể
      logs.push({
        id: `seed_bch_${idx}_2`,
        timestamp,
        userName: officer.name,
        userRole: officer.role,
        userEmail: officer.email,
        actionType: 'QUICK_PROGRESS',
        actionTitle: 'Cập nhật % Tiến độ thi công thực tế',
        projectId: proj.id,
        projectCode: proj.maCongTrinh,
        contractNo: proj.soHopDong,
        projectName: proj.tenCongTrinh,
        details: `Cập nhật sản lượng thi công thực tế tại công trường đạt ${proj.tienDoThucTe}% (Kế hoạch: ${proj.tienDoHopDong}%)`,
        diffSummary: `Tiến độ thực tế: ${proj.tienDoThucTe}% | TGĐ Duyệt: ${proj.tienDoTgdDuyet}%`,
      });
    } else {
      // Đợt thanh toán
      logs.push({
        id: `seed_bch_${idx}_3`,
        timestamp,
        userName: officer.name,
        userRole: officer.role,
        userEmail: officer.email,
        actionType: 'ADD_PAYMENT',
        actionTitle: 'Khai báo đợt giải ngân / thanh toán mới',
        projectId: proj.id,
        projectCode: proj.maCongTrinh,
        contractNo: proj.soHopDong,
        projectName: proj.tenCongTrinh,
        details: `Trình hồ sơ thanh toán khối lượng nghiệm thu giai đoạn hoàn tất thí nghiệm & vận hành chạy thử`,
        diffSummary: `Trạng thái: Đang trình ký duyệt chi | Giữ lại bảo hành: 5%`,
      });
    }
  });

  return logs;
};

export const exportActivityLogsToExcel = (logs: BchActivityLog[]) => {
  const exportData = logs.map((log, index) => ({
    STT: index + 1,
    'Thời Gian Ghi Nhận': formatFullDateTime(log.timestamp),
    'Họ và Tên Cán Bộ BCH': log.userName,
    'Chức Vụ / Bộ Phận': log.userRole,
    'Email Công Việc': log.userEmail,
    'Loại Thao Tác': getActionTypeLabel(log.actionType),
    'Tiêu Đề Thao Tác': log.actionTitle,
    'Số Hợp Đồng': log.contractNo || '-',
    'Mã Công Trình': log.projectCode || '-',
    'Tên Công Trình': log.projectName || '-',
    'Chi Tiết Thay Đổi': log.details || '-',
    'Tóm Tắt Biến Động': log.diffSummary || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSu_BCH_NhapLieu');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 }, // STT
    { wch: 22 }, // Thời gian
    { wch: 24 }, // Họ tên
    { wch: 25 }, // Chức vụ
    { wch: 30 }, // Email
    { wch: 22 }, // Loại thao tác
    { wch: 35 }, // Tiêu đề
    { wch: 20 }, // Số HĐ
    { wch: 16 }, // Mã CT
    { wch: 35 }, // Tên CT
    { wch: 45 }, // Chi tiết
    { wch: 35 }, // Biến động
  ];

  XLSX.writeFile(
    workbook,
    `BaoCao_LichSu_BanChiHuy_NhapLieu_${new Date().toISOString().split('T')[0]}.xlsx`
  );
};

export const getActionTypeLabel = (type: string): string => {
  switch (type) {
    case 'CREATE_PROJECT':
      return 'Tạo Hợp Đồng Mới';
    case 'UPDATE_PROJECT':
      return 'Chỉnh Sửa Toàn Bộ HĐ';
    case 'QUICK_MILESTONE':
      return 'Cập Nhật Mốc Nghiệm Thu';
    case 'QUICK_PROGRESS':
      return 'Cập Nhật % Tiến Độ';
    case 'ADD_PAYMENT':
      return 'Thêm Đợt Thanh Toán';
    case 'IMPORT_EXCEL':
      return 'Import Dữ Liệu Excel';
    case 'DELETE_PROJECT':
      return 'Xóa Hợp Đồng';
    case 'REORDER_PROJECT':
      return 'Đổi Thứ Tự Ưu Tiên';
    default:
      return 'Cập Nhật Dữ Liệu';
  }
};
