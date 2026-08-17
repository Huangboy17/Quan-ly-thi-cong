import React, { useState } from 'react';
import { X, Building2, Calendar, FileCheck, CheckCircle2, Clock, History, UserCheck, Sparkles, User, Briefcase, Mail } from 'lucide-react';
import { Project, MILESTONE_DEFINITIONS, BchActivityLog } from '../types';
import { formatDate, calculateProjectStatus, formatBillionVN } from '../utils/helpers';
import { formatRelativeTime, formatFullDateTime, getActionTypeLabel } from '../utils/activityLogs';

interface DetailModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  bchLogs?: BchActivityLog[];
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  project,
  onClose,
  bchLogs = [],
}) => {
  const [activeTab, setActiveTab] = useState<'MILESTONES' | 'PAYMENT_SCHEDULE' | 'BCH_HISTORY'>('MILESTONES');

  if (!isOpen || !project) return null;

  const statusObj = calculateProjectStatus(project);
  const mData = project.milestones || {};

  // Logs for this specific project
  const projectLogs = bchLogs.filter(
    (l) =>
      l.projectId === project.id ||
      l.contractNo === project.soHopDong ||
      (l.projectCode && l.projectCode === project.maCongTrinh)
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold">
              Chi Tiết Hợp Đồng: <span className="text-blue-300">{project.maCongTrinh}</span> - {project.tenCongTrinh}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50/80 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('MILESTONES')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'MILESTONES'
                ? 'border-blue-600 text-blue-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>8 Mốc Nghiệm Thu QCQS</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT_SCHEDULE')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PAYMENT_SCHEDULE'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Kế Hoạch % Tạm Ứng & 8 Đợt TT</span>
          </button>

          <button
            onClick={() => setActiveTab('BCH_HISTORY')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BCH_HISTORY'
                ? 'border-indigo-600 text-indigo-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Lịch Sử Ban Chỉ Huy Nhập Liệu</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black">
              {projectLogs.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs grow">
          {/* Top Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mã & Số HĐ</span>
              <span className="font-black text-blue-700 text-sm">{project.maCongTrinh}</span>
              <span className="text-slate-600 text-[11px] block">{project.soHopDong}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Địa Phương & Nhóm Chi Phí</span>
              <span className="font-bold text-rose-700 text-xs">📍 {project.diaPhuong || 'Hà Nội'}</span>
              <span className="text-indigo-700 font-semibold block text-[11px]">{project.nhomChiPhi}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Tư Vấn Giám Sát</span>
              <span className="font-semibold text-slate-800 text-xs line-clamp-1">{project.tuVanGiamSat || project.nhaThau}</span>
              <span className="text-[10px] text-slate-500 block">CĐT: {project.chuDauTu || 'Vingroup'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Giá Trị Hợp Đồng</span>
              <span className="font-mono font-black text-blue-900 text-sm">{formatBillionVN(project.giaTriHdSauVat)}</span>
              <span className="text-emerald-700 font-bold block text-[10px]">
                Đã chi: {formatBillionVN(project.luyKeDaChi)} ({Math.round((project.luyKeDaChi / project.giaTriHdSauVat) * 100)}%)
              </span>
            </div>
          </div>

          {activeTab === 'PAYMENT_SCHEDULE' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800">Tạm Ứng Hợp Đồng</span>
                  <div className="text-sm font-bold text-amber-950 font-mono mt-0.5">
                    {project.tamUngPercent || 20}% = {formatBillionVN(project.tamUngAmount || Math.round(project.giaTriHdSauVat * 0.2))}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-500 font-medium">Ghi chú: </span>
                  <span className="font-semibold text-slate-800">{project.tamUngGhiChu || 'Tạm ứng hợp đồng'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                  Bảng Phân Bổ 8 Đợt Thanh Toán Nghiệm Thu ME-CK
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(project.paymentSchedule || []).map((dot) => (
                    <div key={dot.dot} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-900 text-xs">Đợt {dot.dot}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${dot.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {dot.isPaid ? 'Đã chi' : 'Chưa chi'}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 line-clamp-1">{dot.label}</div>
                      <div className="font-mono text-xs font-black text-indigo-900">
                        {dot.percent}% ({formatBillionVN(dot.amount)})
                      </div>
                      {dot.ngayDuKien && (
                        <div className="text-[10px] text-slate-500 font-mono">Ngày TT: {formatDate(dot.ngayDuKien)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'MILESTONES' ? (
            <>
              {/* Timelines summary */}
              <div className="grid grid-cols-3 gap-3 text-center font-mono">
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  <span className="block text-[10px] text-blue-600 font-sans font-bold">Tiến Độ Hợp Đồng</span>
                  <span className="font-black text-blue-900">{formatDate(project.tienDoHopDong)}</span>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200">
                  <span className="block text-[10px] text-indigo-600 font-sans font-bold">Tiến Độ TGĐ Duyệt</span>
                  <span className="font-black text-indigo-900">{formatDate(project.tienDoTgdDuyet)}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="block text-[10px] text-emerald-600 font-sans font-bold">Tiến Độ Thực Tế</span>
                  <span className="font-black text-emerald-900">{formatDate(project.tienDoThucTe)}</span>
                </div>
              </div>

              {/* 8 Milestone Cards */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Bảng 8 Mốc Nghiệm Thu QCQS ME-CK
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MILESTONE_DEFINITIONS.map((def, idx) => {
                    const data = mData[def.key] || {};
                    const isSigned = !!data.ngayKy;

                    return (
                      <div
                        key={def.key}
                        className={`p-3.5 rounded-xl border ${
                          isSigned
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-slate-200 bg-white'
                        } shadow-sm space-y-2`}
                      >
                        <div className="flex items-center justify-between font-bold border-b border-slate-200/60 pb-2">
                          <span className="text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {def.label}
                          </span>
                          {isSigned ? (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã ký ({formatDate(data.ngayKy)})
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Chưa hoàn thành
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                          <div className="bg-white p-1.5 rounded border border-slate-200">
                            <span className="block text-[8px] text-slate-400 font-sans">NT Hợp Đồng</span>
                            <span className="font-semibold text-slate-700">{formatDate(data.nt_hd)}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200">
                            <span className="block text-[8px] text-blue-600 font-sans">NT Duyệt TGĐ</span>
                            <span className="font-semibold text-blue-800">{formatDate(data.nt_tgd)}</span>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-slate-200">
                            <span className="block text-[8px] text-emerald-600 font-sans">NT Thực Tế L1</span>
                            <span className="font-semibold text-emerald-800">{formatDate(data.nt_tt1)}</span>
                          </div>
                          {data.nt_tt2 && (
                            <div className="bg-purple-50 p-1.5 rounded border border-purple-200">
                              <span className="block text-[8px] text-purple-600 font-sans">Gia Hạn L2</span>
                              <span className="font-semibold text-purple-800">{formatDate(data.nt_tt2)}</span>
                            </div>
                          )}
                          {data.nt_tt3 && (
                            <div className="bg-purple-50 p-1.5 rounded border border-purple-200">
                              <span className="block text-[8px] text-purple-600 font-sans">Gia Hạn L3</span>
                              <span className="font-semibold text-purple-800">{formatDate(data.nt_tt3)}</span>
                            </div>
                          )}
                          <div className="bg-amber-50 p-1.5 rounded border border-amber-200">
                            <span className="block text-[8px] text-amber-600 font-sans">Ngày Trình HS</span>
                            <span className="font-semibold text-amber-900">{formatDate(data.ngayTrinh)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              {project.ghiChu && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Ghi Chú Công Trường:</span>
                  <p className="text-slate-600 italic">{project.ghiChu}</p>
                </div>
              )}
            </>
          ) : (
            /* BCH HISTORY TAB FOR THIS PROJECT */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Nhật Ký Nhập Liệu Real-time của Ban Chỉ Huy ({projectLogs.length} sự kiện)
                </h4>
                <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Hợp đồng: {project.soHopDong}
                </span>
              </div>

              {projectLogs.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium">Chưa có lịch sử nhập liệu chi tiết cho hợp đồng này.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Các thao tác sửa mốc, tiến độ, giải ngân sẽ tự động ghi nhận vào đây theo thời gian thực.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {projectLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-200/60 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center">
                            {log.userName.charAt(0)}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{log.userName}</span>
                            <span className="text-[10px] text-indigo-700 font-medium ml-1.5">
                              ({log.userRole})
                            </span>
                          </div>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatRelativeTime(log.timestamp)}</span>
                          <span className="text-slate-400">({formatFullDateTime(log.timestamp)})</span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-slate-800">{log.actionTitle}</div>

                      {log.details && (
                        <div className="text-[11.5px] text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-200">
                          {log.details}
                        </div>
                      )}

                      {log.diffSummary && (
                        <div className="text-[11px] font-mono text-indigo-900 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{log.diffSummary}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium shadow transition cursor-pointer"
          >
            Đóng Chi Tiết
          </button>
        </div>
      </div>
    </div>
  );
};

