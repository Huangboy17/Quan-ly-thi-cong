export interface MilestoneData {
  nt_hd?: string;   // NT Hợp đồng
  nt_tgd?: string;  // NT Duyệt TGĐ
  nt_tt1?: string;  // NT Thực tế Lần 1
  nt_tt2?: string;  // Gia hạn Lần 2
  nt_tt3?: string;  // Gia hạn Lần 3
  ngayTrinh?: string; // Ngày trình hồ sơ
  ngayKy?: string;    // Ngày ký hồ sơ
  customLabel?: string; // Tên đợt mốc tự nhập (cho Khác hoặc mốc thêm mới)
}

export type MilestoneKey = string;

export interface MilestoneInfo {
  key: MilestoneKey;
  label: string;
  code: string;
  description: string;
  isCustom?: boolean;
}

export const MILESTONE_DEFINITIONS: MilestoneInfo[] = [
  { key: 'm1', label: 'Đợt 1: XD_Phần thô', code: 'M1_RAW', description: 'Nghiệm thu Đợt 1: Phần thô xây dựng' },
  { key: 'm2', label: 'Đợt 2: ME_Tập kết thiết bị', code: 'M2_ME_DELIVERY', description: 'Nghiệm thu Đợt 2: Tập kết vật tư thiết bị ME' },
  { key: 'm3', label: 'Đợt 3: XD+ME_Hoàn thành xây lắp, chạy thử', code: 'M3_ERECTION_TC', description: 'Nghiệm thu Đợt 3: Hoàn thành xây lắp XD & ME, chạy thử T&C' },
  { key: 'm4', label: 'Đợt 4: VH_Vận hành', code: 'M4_OPERATION', description: 'Nghiệm thu Đợt 4: Vận hành thử nghiệm hệ thống ME' },
  { key: 'm5', label: 'Đợt 5: GPMT/ĐKMT', code: 'M5_PERMITS', description: 'Nghiệm thu Đợt 5: Giấy phép / Đăng ký môi trường & PCCC' },
  { key: 'm6', label: 'Đợt 6: Bàn giao công trình', code: 'M6_HANDOVER', description: 'Nghiệm thu Đợt 6: Bàn giao công trình đưa vào sử dụng' },
  { key: 'm7', label: 'Đợt 7: Thanh lý hợp đồng', code: 'M7_LIQUIDATION', description: 'Nghiệm thu Đợt 7: Thanh lý hợp đồng & quyết toán' },
  { key: 'm8', label: 'Khác', code: 'M8_OTHER', description: 'Tùy chọn mục nghiệm thu / đợt thanh toán khác' },
];

export type ProjectMilestones = Record<MilestoneKey, MilestoneData>;

export type CostGroup =
  | 'Phần Xây dựng'
  | 'Phần Công nghệ'
  | 'Phần Pháp lý'
  | 'Phần Vận hành'
  | 'Xây dựng – Thiết bị'
  | 'Tư vấn'
  | 'Chi phí QLDA'
  | 'Chi phí khác'
  | 'Lãi vay'
  | 'Lắp đặt ME-CK'
  | string;

export interface PaymentDotSchedule {
  dot: number;
  label: string;
  code: string;
  percent: number;
  amount: number;
  ngayDuKien?: string;
  ngayThucTe?: string;
  isPaid?: boolean;
  ghiChu?: string;
}

export interface PaymentBatch {
  id: string;
  dotSo: number;
  tenDot: string;
  ngayDeNghi: string;
  ngayDuyetChi?: string;
  giaTriTruocVat: number;
  vatRate: number;
  giaTriSauVat: number;
  giaTriGiuLaiBaoHanh?: number;
  giaTriThucNhan: number;
  trangThai: 'DA_CHI' | 'DANG_TRINH' | 'CHUA_CHI';
  ghiChu?: string;
}

export interface Project {
  id: string;
  soHopDong: string;
  maCongTrinh: string;
  tenCongTrinh: string;
  duAn: string;
  chuDauTu?: string; // Chủ đầu tư (gõ tay)
  diaPhuong?: string; // Địa phương / Tỉnh thành (63 tỉnh thành hoặc gõ tay)
  nhaThau: string; // Nhà thầu thi công / Tư vấn giám sát
  tuVanGiamSat?: string; // Tư vấn giám sát
  nhomChiPhi: CostGroup;

  // Tạm ứng & Kế hoạch thanh toán theo %
  tamUngPercent?: number; // % Tạm ứng (ví dụ 10, 20%)
  tamUngAmount?: number;  // Số tiền tạm ứng VNĐ
  tamUngNgay?: string;
  tamUngGhiChu?: string;
  paymentSchedule?: PaymentDotSchedule[];

  // Tài chính & Dòng tiền
  giaTriHdSauVat: number; // VNĐ
  giaTriHdTruocVat?: number; // VNĐ
  vatAmount?: number; // VNĐ
  luyKeDaChi: number; // VNĐ đã giải ngân
  chiTraTrongKy?: number; // VNĐ chi trong kỳ lọc
  conLaiChuaChi?: number; // VNĐ còn lại
  soDotThanhToan?: number;
  paymentBatches?: PaymentBatch[];

  ngayHopDong: string;
  tienDoHopDong: string;
  tienDoTgdDuyet: string;
  tienDoThucTe: string;
  milestones: ProjectMilestones;
  customMilestones?: MilestoneInfo[];
  ghiChu?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface OverdueMilestoneItem {
  milestoneKey: MilestoneKey;
  milestoneLabel: string;
  milestoneCode: string;
  plannedDate: string;
  actualDate?: string;
  daysOverdue: number;
  status: 'OVERDUE' | 'NEAR_DUE' | 'COMPLETED' | 'ON_TRACK';
  isOverdue: boolean;
  project: Project;
}

export interface UserProfile {
  id?: string;
  fullName: string;
  role: string;
  email: string;
  accountType?: 'super_admin' | 'level_1' | 'level_2';
  parentId?: string | null;
  status?: 'active' | 'pending' | 'blocked' | 'archived';
  maxMembers?: number;
  subCount?: number;
  updatedAt?: string;
}
  
export interface AppNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export type BchActionType =
  | 'CREATE_PROJECT'
  | 'UPDATE_PROJECT'
  | 'QUICK_MILESTONE'
  | 'QUICK_PROGRESS'
  | 'ADD_PAYMENT'
  | 'IMPORT_EXCEL'
  | 'DELETE_PROJECT'
  | 'BULK_ADD'
  | 'BULK_DELETE'
  | 'BULK_UPDATE'
  | 'BULK_DUPLICATE'
  | 'REORDER_PROJECT';

export interface BchActivityLog {
  id: string;
  timestamp: string; // ISO String
  userName: string;
  userRole: string;
  userEmail: string;
  actionType: BchActionType;
  actionTitle: string;
  projectId?: string;
  projectCode?: string;
  contractNo?: string;
  projectName?: string;
  details?: string;
  diffSummary?: string;
}

export type FilterStatus =
  | 'ALL'
  | 'CHAM_KY'
  | 'TRE_TIEN_DO'
  | 'GIA_HAN'
  | 'DANG_TRINH_KY'
  | 'HOAN_THANH'
  | 'DANG_THI_CONG';

export type SortOption =
  | 'DEFAULT'
  | 'MOST_DELAYED'
  | 'COMPLETION_DESC'
  | 'COMPLETION_ASC'
  | 'UPDATED_RECENT'
  | 'CODE_ASC'
  | 'VALUE_DESC'
  | 'VALUE_ASC';

export interface StatusInfo {
  key: FilterStatus;
  label: string;
  badgeClass: string;
  maxDaysInSigning?: number;
}

export type ActiveNavMenu =
  | 'DASHBOARD'
  | 'CONTRACTS'
  | 'PAYMENTS'
  | 'PROJECTS_OVERVIEW'
  | 'BCH_LOGS'
  | 'ADMIN_SYSTEM'
  | 'MEMBER_MANAGER';

export interface GlobalTimeFilter {
  year: string; // 'ALL' | '2024' | '2025' | '2026'
  quarter: string; // 'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  month: string; // 'ALL' | '1' .. '12'
  fromDate: string;
  toDate: string;
  duAn: string; // 'ALL' or specific project
  nhomChiPhi: string; // 'ALL' or specific cost group
  chuDauTu: string; // 'ALL' or specific investor (Chủ đầu tư)
  diaPhuong: string; // 'ALL' or specific province (Địa phương)
  revenuePeriod: string; // 'ALL' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR'
  nhaThau?: string; // legacy contractor filter
}
