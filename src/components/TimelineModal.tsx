import React, { useState } from 'react';
import { X, Flag, CheckCircle2, Calendar, MapPin, Search } from 'lucide-react';
import { Project, MILESTONE_DEFINITIONS } from '../types';
import { calculateProjectStatus, formatDate } from '../utils/helpers';

interface TimelineModalProps {
  isOpen: boolean;
  projects: Project[];
  onClose: () => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  isOpen,
  projects,
  onClose,
}) => {
  const [timelineSearch, setTimelineSearch] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) => {
    const query = timelineSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      p.maCongTrinh.toLowerCase().includes(query) ||
      p.tenCongTrinh.toLowerCase().includes(query) ||
      p.soHopDong.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full border border-slate-200 my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800 text-white shrink-0">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-400" />
            <span>Biểu Đồ Gantt Timeline Cột Cờ Mốc (Tháng 1 - Tháng 12)</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar text-xs grow">
          {/* Top Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-lg text-indigo-900 flex flex-wrap justify-between items-center gap-3">
            <div>
              <span className="font-bold text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Theo Dõi Tiến Trình Timeline &amp; Các Cột Cờ Mốc
              </span>
              <p className="text-xs text-indigo-700 mt-0.5">
                Hiển thị mốc ký hợp đồng, các điểm dừng nghiệm thu dạng cột cờ/dấu chấm mốc và vạch chỉ báo **Mốc hiện tại (Tháng 8)**.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[10px]">
              <span className="px-2.5 py-1 bg-amber-500 text-white rounded-full font-bold shadow-sm flex items-center gap-1">
                <Flag className="w-3 h-3" /> Cột cờ: Điểm dừng NT
              </span>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full font-bold shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Hoàn thành ký
              </span>
              <span className="px-2.5 py-1 bg-red-600 text-white rounded-full font-bold shadow-sm flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Mốc Hiện Tại (Tháng 8)
              </span>
            </div>
          </div>

          {/* Search bar inside timeline */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={timelineSearch}
              onChange={(e) => setTimelineSearch(e.target.value)}
              placeholder="Lọc công trình trong timeline..."
              className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* 12 Months Header */}
          <div className="grid grid-cols-12 gap-1 bg-slate-900 text-white text-center font-bold text-[11px] p-2.5 rounded-lg shadow sticky top-0 z-10">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isCurrent = m === 8;
              return (
                <div
                  key={m}
                  className={`p-1 rounded ${
                    isCurrent
                      ? 'bg-red-600/90 border border-red-400 text-white shadow font-black flex items-center justify-center gap-0.5'
                      : ''
                  }`}
                >
                  {isCurrent && <MapPin className="w-3 h-3" />}
                  <span>Tháng {m} {isCurrent ? '(Hiện Tại)' : ''}</span>
                </div>
              );
            })}
          </div>

          {/* Timeline Projects List */}
          <div className="space-y-3">
            {filteredProjects.map((p) => {
              const statusObj = calculateProjectStatus(p);
              const mData = p.milestones || {};

              let startMonth = 1;
              let endMonth = 12;

              if (p.ngayHopDong) {
                const parts = p.ngayHopDong.split('-');
                if (parts.length >= 2) {
                  const m = parseInt(parts[1], 10);
                  if (!isNaN(m) && m >= 1 && m <= 12) startMonth = m;
                }
              }

              if (p.tienDoHopDong) {
                const parts = p.tienDoHopDong.split('-');
                if (parts.length >= 2) {
                  const m = parseInt(parts[1], 10);
                  if (!isNaN(m) && m >= 1 && m <= 12) endMonth = Math.max(startMonth, m);
                }
              } else {
                endMonth = Math.min(12, startMonth + 5);
              }

              const leftPercent = ((startMonth - 1) / 12) * 100;
              const widthPercent = Math.max(8.333, ((endMonth - startMonth + 1) / 12) * 100);

              // Current Month 8 Marker Left Percent
              const currentMarkerLeft = ((8 - 1) / 12) * 100 + 4.166;

              return (
                <div
                  key={p.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-700">{p.maCongTrinh}</span>
                      <span className="font-semibold text-slate-800">{p.tenCongTrinh}</span>
                      <span className="text-[10px] text-slate-400">({p.soHopDong})</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${statusObj.badgeClass}`}>
                      {statusObj.label}
                    </span>
                  </div>

                  {/* Gantt Bar with Milestones */}
                  <div className="relative h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center px-2">
                    {/* Background Month Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-r border-slate-200/60 h-full" />
                      ))}
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="absolute h-6 rounded-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow flex items-center px-2 text-[10px] text-white font-bold transition-all"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    >
                      <span className="truncate">T{startMonth} ➔ T{endMonth}</span>
                    </div>

                    {/* Milestone Flags along the timeline */}
                    {MILESTONE_DEFINITIONS.map((mDef, mIdx) => {
                      const data = mData[mDef.key] || {};
                      const dateStr = data.ngayKy || data.ngayTrinh || data.nt_tgd || data.nt_hd;
                      if (!dateStr) return null;

                      let month = 1;
                      const parts = dateStr.split('-');
                      if (parts.length >= 2) {
                        const parsedM = parseInt(parts[1], 10);
                        if (!isNaN(parsedM) && parsedM >= 1 && parsedM <= 12) month = parsedM;
                      }

                      const mLeft = ((month - 1) / 12) * 100 + 4.166;
                      const isSigned = !!data.ngayKy;

                      return (
                        <div
                          key={mDef.key}
                          className="absolute -top-1.5 transform -translate-x-1/2 flex flex-col items-center group z-20"
                          style={{ left: `${mLeft}%` }}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md cursor-pointer transition transform group-hover:scale-125 ${
                              isSigned
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                                : 'bg-amber-500 text-white ring-2 ring-amber-300'
                            }`}
                          >
                            {mIdx + 1}
                          </div>
                          {/* Tooltip on hover */}
                          <div className="hidden group-hover:flex absolute top-6 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-xl whitespace-nowrap z-30 flex-col items-center">
                            <span className="font-bold">{mDef.label}</span>
                            <span className="text-slate-300">
                              {isSigned ? `Đã ký: ${formatDate(data.ngayKy)}` : `Đã trình: ${formatDate(data.ngayTrinh)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current Month 8 Marker Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                      style={{ left: `${currentMarkerLeft}%` }}
                    >
                      <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-600 shadow-md animate-ping" />
                      <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-red-600 shadow-md" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium shadow transition cursor-pointer"
          >
            Đóng Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
