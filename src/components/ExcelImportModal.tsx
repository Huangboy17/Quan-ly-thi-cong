import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { X, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Project, CostGroup } from '../types';
import { MAJOR_PROJECTS, CONTRACTORS, COST_GROUPS } from '../data/sampleData';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProjects: (projects: Project[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportProjects,
}) => {
  if (!isOpen) return null;

  const [file, setFile] = useState<File | null>(null);
  const [parsedProjects, setParsedProjects] = useState<Project[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setErrorMsg('Tệp Excel rỗng hoặc không đúng định dạng!');
          setIsProcessing(false);
          return;
        }

        const importedList: Project[] = rawData.map((row, idx) => {
          const soHd =
            row['Số Hợp Đồng'] ||
            row['[PHẦN 1] Số Hợp Đồng'] ||
            row['soHopDong'] ||
            `HĐ-IMPORT-${idx + 1}/2026`;
          const maCt =
            row['Mã Công Trình'] ||
            row['[PHẦN 1] Mã Công Trình'] ||
            row['maCongTrinh'] ||
            `CT-IMP-${String(idx + 1).padStart(3, '0')}`;
          const tenCt =
            row['Tên Công Trình'] ||
            row['[PHẦN 1] Tên Công Trình'] ||
            row['Tên Hợp Đồng'] ||
            row['tenCongTrinh'] ||
            `Công Trình Nhập Khẩu ${idx + 1}`;

          const duAn = row['Dự Án'] || row['duAn'] || MAJOR_PROJECTS[idx % MAJOR_PROJECTS.length];
          const nhaThau = row['Nhà Thầu'] || row['nhaThau'] || CONTRACTORS[idx % CONTRACTORS.length];
          const nhomChiPhi: CostGroup =
            row['Nhóm Chi Phí'] || row['nhomChiPhi'] || COST_GROUPS[idx % COST_GROUPS.length];

          const giaTriSauVat =
            Number(row['Giá Trị HĐ (Sau VAT)'] || row['giaTriHdSauVat']) || 120000000000;
          const luyKeDaChi =
            Number(row['Lũy Kế Đã Chi (Sau VAT)'] || row['luyKeDaChi']) ||
            Math.round(giaTriSauVat * 0.45);

          return {
            id: `imp_${Date.now()}_${idx}`,
            soHopDong: soHd,
            maCongTrinh: maCt,
            tenCongTrinh: tenCt,
            duAn,
            nhaThau,
            nhomChiPhi,
            giaTriHdSauVat: giaTriSauVat,
            giaTriHdTruocVat: Math.round(giaTriSauVat / 1.1),
            vatAmount: giaTriSauVat - Math.round(giaTriSauVat / 1.1),
            luyKeDaChi,
            chiTraTrongKy: Math.round(luyKeDaChi * 0.7),
            conLaiChuaChi: Math.max(0, giaTriSauVat - luyKeDaChi),
            ngayHopDong: row['Ngày Hợp Đồng'] || row['Ngày Ký HĐ'] || '2026-01-10',
            tienDoHopDong: row['Tiến Độ HĐ'] || row['Hạn HĐ'] || '2026-08-30',
            tienDoTgdDuyet: row['Tiến Độ TGĐ Duyệt'] || row['Hạn TGĐ Duyệt'] || '2026-07-25',
            tienDoThucTe: row['Tiến Độ Thực Tế'] || '2026-07-25',
            milestones: {
              m1: { ngayTrinh: '2026-07-05', ngayKy: '2026-07-09' },
              m2: { ngayTrinh: '2026-07-15', ngayKy: '2026-07-19' },
              m3: { ngayTrinh: '2026-07-25', ngayKy: '' },
              m4: {},
              m5: {},
              m6: {},
              m7: {},
              m8: { customLabel: 'Khác' },
            },
            ghiChu: row['Ghi Chú Ban Chỉ Huy'] || row['ghiChu'] || 'Nhập từ tệp Excel',
            updatedBy: 'Import Excel',
            updatedAt: new Date().toISOString(),
          };
        });

        setParsedProjects(importedList);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Lỗi xử lý file Excel. Vui lòng kiểm tra định dạng!');
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleApplyImport = () => {
    if (parsedProjects.length > 0) {
      onImportProjects(parsedProjects);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0e1736] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fadeIn text-slate-100">
        {/* Header */}
        <div className="bg-[#131f47] px-4 py-3.5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Import Hợp Đồng Từ Tệp Excel (.xlsx, .xls)</h3>
              <p className="text-[11px] text-slate-400">Nạp nhanh danh sách hợp đồng & gói thầu ME-CK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-[#142042]/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-file-upload"
            />
            <label htmlFor="excel-file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block">
                {file ? file.name : 'Nhấn vào đây để tải lên file Excel dữ liệu hợp đồng'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Hỗ trợ định dạng .xlsx, .xls (Xuất từ hệ thống hoặc template chuẩn)
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedProjects.length > 0 && (
            <div className="bg-[#121c3b] p-3 rounded-xl border border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã đọc thành công {parsedProjects.length} hợp đồng!
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-800 text-[11px]">
                {parsedProjects.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="font-mono text-blue-300">{p.soHopDong}</span>
                    <span className="text-slate-300 truncate max-w-[240px]">{p.tenCongTrinh}</span>
                    <span className="text-emerald-400 font-mono">
                      {(p.giaTriHdSauVat / 1000000000).toFixed(2)} Tỷ
                    </span>
                  </div>
                ))}
                {parsedProjects.length > 5 && (
                  <div className="text-center text-slate-500 pt-1 text-[10.5px]">
                    ...và {parsedProjects.length - 5} hợp đồng khác
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              disabled={parsedProjects.length === 0 || isProcessing}
              onClick={handleApplyImport}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Nạp {parsedProjects.length} Hợp Đồng Vào Hệ Thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
