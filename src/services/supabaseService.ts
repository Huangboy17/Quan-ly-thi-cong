/**
 * Supabase Service Layer — thay thế localStorage
 * Mapping camelCase (TypeScript) ↔ snake_case (PostgreSQL)
 */
import { supabase } from '../lib/supabase';
import type { Project, BchActivityLog, UserProfile, AppNotification } from '../types';

// ═══════════════════════════════════════════════
// PROJECTS — CRUD Operations
// ═══════════════════════════════════════════════

/** Lấy toàn bộ danh sách dự án từ Supabase */
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ fetchProjects error:', error);
    throw error;
  }
  return (data ?? []).map(mapDbRowToProject);
}

/** Thêm mới hoặc cập nhật 1 dự án */
export async function upsertProject(project: Project): Promise<void> {
  const row = mapProjectToDbRow(project);
  const { error } = await supabase
    .from('projects')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('❌ upsertProject error:', error);
    throw error;
  }
}

/** Upsert nhiều dự án cùng lúc (bulk add/import/duplicate) */
export async function upsertManyProjects(projects: Project[]): Promise<void> {
  if (projects.length === 0) return;
  const rows = projects.map(mapProjectToDbRow);
  const { error } = await supabase
    .from('projects')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('❌ upsertManyProjects error:', error);
    throw error;
  }
}

/** Xóa 1 dự án theo ID */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ deleteProject error:', error);
    throw error;
  }
}

/** Xóa nhiều dự án cùng lúc */
export async function deleteManyProjects(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from('projects')
    .delete()
    .in('id', ids);

  if (error) {
    console.error('❌ deleteManyProjects error:', error);
    throw error;
  }
}

/** Xóa toàn bộ rồi insert lại (dùng khi reset sample / reorder) */
export async function replaceAllProjects(projects: Project[]): Promise<void> {
  // Xóa toàn bộ
  const { error: delErr } = await supabase
    .from('projects')
    .delete()
    .neq('id', '__never_match__'); // delete all rows

  if (delErr) {
    console.error('❌ replaceAllProjects delete error:', delErr);
    throw delErr;
  }

  // Insert lại
  if (projects.length > 0) {
    const rows = projects.map(mapProjectToDbRow);
    // Insert theo batch 50 rows để tránh payload quá lớn
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: insErr } = await supabase
        .from('projects')
        .insert(batch);
      if (insErr) {
        console.error('❌ replaceAllProjects insert error:', insErr);
        throw insErr;
      }
    }
  }
}

// ═══════════════════════════════════════════════
// BCH ACTIVITY LOGS — CRUD Operations
// ═══════════════════════════════════════════════

/** Lấy danh sách nhật ký BCH (tối đa 500, mới nhất trước) */
export async function fetchActivityLogs(): Promise<BchActivityLog[]> {
  const { data, error } = await supabase
    .from('bch_activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(500);

  if (error) {
    console.error('❌ fetchActivityLogs error:', error);
    throw error;
  }
  return (data ?? []).map(mapDbRowToLog);
}

/** Thêm 1 nhật ký hoạt động */
export async function insertActivityLog(log: BchActivityLog): Promise<void> {
  const row = mapLogToDbRow(log);
  const { error } = await supabase
    .from('bch_activity_logs')
    .insert(row);

  if (error) {
    console.error('❌ insertActivityLog error:', error);
    throw error;
  }
}

/** Thêm nhiều nhật ký cùng lúc (seed data) */
export async function insertManyActivityLogs(logs: BchActivityLog[]): Promise<void> {
  if (logs.length === 0) return;
  const rows = logs.map(mapLogToDbRow);
  const { error } = await supabase
    .from('bch_activity_logs')
    .insert(rows);

  if (error) {
    console.error('❌ insertManyActivityLogs error:', error);
    throw error;
  }
}

/** Xóa toàn bộ nhật ký */
export async function clearActivityLogs(): Promise<void> {
  const { error } = await supabase
    .from('bch_activity_logs')
    .delete()
    .neq('id', '__never_match__');

  if (error) {
    console.error('❌ clearActivityLogs error:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════

export async function signUpUser(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

// ═══════════════════════════════════════════════
// USER PROFILES
// ═══════════════════════════════════════════════

/** Lấy profile theo ID */
export async function fetchUserProfile(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('❌ fetchUserProfile error:', error);
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    email: data.email,
    accountType: data.account_type,
    parentId: data.parent_id,
    status: data.status,
    maxMembers: data.max_members,
    updatedAt: data.updated_at,
  };
}

/** Cập nhật thông tin profile của chính mình */
export async function updateMyProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({
      full_name: updates.fullName,
      role: updates.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('❌ updateMyProfile error:', error);
    throw error;
  }
}

/** Lấy danh sách toàn bộ profile (Dành cho admin) */
export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchAllProfiles error:', error);
    return [];
  }
  
  return (data || []).map(row => ({
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    email: row.email,
    accountType: row.account_type,
    parentId: row.parent_id,
    status: row.status,
    maxMembers: row.max_members,
    updatedAt: row.updated_at,
  }));
}

/** Cập nhật trạng thái profile */
export async function updateProfileStatus(id: string, status: 'active' | 'pending' | 'blocked' | 'archived'): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('❌ updateProfileStatus error:', error);
    throw error;
  }
}

/** Xóa tài khoản triệt để (auth.users + user_profiles) qua Edge Function */
export async function deleteAccount(targetUserId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not logged in');

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ target_user_id: targetUserId }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    console.error('❌ deleteAccount error:', data);
    throw new Error(data.error || 'Failed to delete account');
  }
}

// ═══════════════════════════════════════════════
// REALTIME — Subscribe to changes
// ═══════════════════════════════════════════════

/** Đăng ký lắng nghe thay đổi bảng projects realtime */
export function subscribeToProjects(
  onChangeCallback: () => void
) {
  const channel = supabase
    .channel('projects-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      () => {
        onChangeCallback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Đăng ký lắng nghe thay đổi bảng activity logs realtime */
export function subscribeToActivityLogs(
  onChangeCallback: () => void
) {
  const channel = supabase
    .channel('logs-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bch_activity_logs' },
      () => {
        onChangeCallback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ═══════════════════════════════════════════════
// MAPPING HELPERS: camelCase ↔ snake_case
// ═══════════════════════════════════════════════

function mapDbRowToProject(row: any): Project {
  return {
    id: row.id,
    soHopDong: row.so_hop_dong ?? '',
    maCongTrinh: row.ma_cong_trinh ?? '',
    tenCongTrinh: row.ten_cong_trinh ?? '',
    duAn: row.du_an ?? '',
    chuDauTu: row.chu_dau_tu ?? '',
    diaPhuong: row.dia_phuong ?? '',
    nhaThau: row.nha_thau ?? '',
    tuVanGiamSat: row.tu_van_giam_sat ?? '',
    nhomChiPhi: row.nhom_chi_phi ?? 'Phần Xây dựng',

    tamUngPercent: row.tam_ung_percent ?? 0,
    tamUngAmount: row.tam_ung_amount ?? 0,
    tamUngNgay: row.tam_ung_ngay ?? '',
    tamUngGhiChu: row.tam_ung_ghi_chu ?? '',
    paymentSchedule: row.payment_schedule ?? [],

    giaTriHdSauVat: row.gia_tri_hd_sau_vat ?? 0,
    giaTriHdTruocVat: row.gia_tri_hd_truoc_vat ?? 0,
    vatAmount: row.vat_amount ?? 0,
    luyKeDaChi: row.luy_ke_da_chi ?? 0,
    chiTraTrongKy: row.chi_tra_trong_ky ?? 0,
    conLaiChuaChi: row.con_lai_chua_chi ?? 0,
    soDotThanhToan: row.so_dot_thanh_toan ?? 0,
    paymentBatches: row.payment_batches ?? [],

    ngayHopDong: row.ngay_hop_dong ?? '',
    tienDoHopDong: row.tien_do_hop_dong ?? '',
    tienDoTgdDuyet: row.tien_do_tgd_duyet ?? '',
    tienDoThucTe: row.tien_do_thuc_te ?? '',

    milestones: row.milestones ?? {},
    customMilestones: row.custom_milestones ?? [],

    ghiChu: row.ghi_chu ?? '',
    updatedBy: row.updated_by ?? '',
    updatedAt: row.updated_at ?? '',
    createdAt: row.created_at ?? '',
  };
}

function mapProjectToDbRow(p: Project): Record<string, any> {
  const row: Record<string, any> = {
    id: p.id,
    so_hop_dong: p.soHopDong ?? '',
    ma_cong_trinh: p.maCongTrinh ?? '',
    ten_cong_trinh: p.tenCongTrinh ?? '',
    du_an: p.duAn ?? '',
    chu_dau_tu: p.chuDauTu ?? '',
    dia_phuong: p.diaPhuong ?? '',
    nha_thau: p.nhaThau ?? '',
    tu_van_giam_sat: p.tuVanGiamSat ?? '',
    nhom_chi_phi: p.nhomChiPhi ?? 'Phần Xây dựng',

    tam_ung_percent: p.tamUngPercent ?? 0,
    tam_ung_amount: p.tamUngAmount ?? 0,
    tam_ung_ngay: p.tamUngNgay ?? '',
    tam_ung_ghi_chu: p.tamUngGhiChu ?? '',
    payment_schedule: p.paymentSchedule ?? [],

    gia_tri_hd_sau_vat: p.giaTriHdSauVat ?? 0,
    gia_tri_hd_truoc_vat: p.giaTriHdTruocVat ?? 0,
    vat_amount: p.vatAmount ?? 0,
    luy_ke_da_chi: p.luyKeDaChi ?? 0,
    chi_tra_trong_ky: p.chiTraTrongKy ?? 0,
    con_lai_chua_chi: p.conLaiChuaChi ?? 0,
    so_dot_thanh_toan: p.soDotThanhToan ?? 0,
    payment_batches: p.paymentBatches ?? [],

    ngay_hop_dong: p.ngayHopDong ?? '',
    tien_do_hop_dong: p.tienDoHopDong ?? '',
    tien_do_tgd_duyet: p.tienDoTgdDuyet ?? '',
    tien_do_thuc_te: p.tienDoThucTe ?? '',

    milestones: p.milestones ?? {},
    custom_milestones: p.customMilestones ?? [],

    ghi_chu: p.ghiChu ?? '',
    updated_by: p.updatedBy ?? '',
    updated_at: p.updatedAt || new Date().toISOString(),
  };

  if (p.createdAt) {
    row.created_at = p.createdAt;
  }
  return row;
}

function mapDbRowToLog(row: any): BchActivityLog {
  return {
    id: row.id,
    timestamp: row.timestamp ?? '',
    userName: row.user_name ?? '',
    userRole: row.user_role ?? '',
    userEmail: row.user_email ?? '',
    actionType: row.action_type ?? '',
    actionTitle: row.action_title ?? '',
    projectId: row.project_id ?? '',
    projectCode: row.project_code ?? '',
    contractNo: row.contract_no ?? '',
    projectName: row.project_name ?? '',
    details: row.details ?? '',
    diffSummary: row.diff_summary ?? '',
  };
}

function mapLogToDbRow(log: BchActivityLog): Record<string, any> {
  return {
    id: log.id,
    timestamp: log.timestamp || new Date().toISOString(),
    user_name: log.userName ?? '',
    user_role: log.userRole ?? '',
    user_email: log.userEmail ?? '',
    action_type: log.actionType ?? '',
    action_title: log.actionTitle ?? '',
    project_id: log.projectId ?? '',
    project_code: log.projectCode ?? '',
    contract_no: log.contractNo ?? '',
    project_name: log.projectName ?? '',
    details: log.details ?? '',
    diff_summary: log.diffSummary ?? '',
  };
}

// ═══════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════

export async function fetchMyNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ fetchMyNotifications error:', error);
    return [];
  }
  return data || [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('❌ markNotificationAsRead error:', error);
  }
}

export function subscribeToNotifications(
  userId: string,
  onChangeCallback: () => void
) {
  const channel = supabase
    .channel('notifications-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
      () => {
        onChangeCallback();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
