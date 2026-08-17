import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Layers,
  Sparkles,
  ClipboardPaste,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';
import { Project, CostGroup, MILESTONE_DEFINITIONS, ProjectMilestones } from '../types';
import { COST_GROUPS, SAMPLE_PROJECT_NAMES } from '../data/sampleData';
import { formatBillionVN, formatVND } from '../utils/helpers';

interface BulkAddProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (projects: Project[]) => void;
  existingProjectsCount: number;
}

interface DraftRow {
  tempId: string;
  soHopDong: string;
  maCongTrinh: string;
  tenCongTrinh: string;
  duAn: string;
  nhaThau: string;
  nhomChiPhi: CostGroup;
  giaTriHdSauVat: number;
  tienDoHopDong: string;
  tienDoTgdDuyet: string;
  tienDoThucTe: string;
  ghiChu: string;
}

const PRESET_ME_PACKAGES = [
  'Gói 01: Cung cấp & Lắp đặt Hệ thống Chiller và Điều hòa Thông gió (HVAC)',
  'Gói 02: Thi công Trạm Biến Áp 2000kVA & Máy Phát Điện Dự Phòng',
  'Gói 03: Thi công Hệ thống PCCC, Bơm Chữa Cháy & Báo Cháy Tự Động',
  'Gói 04: Lắp đặt Tủ Bảng Điện Tổng MSB & Thang Máng Cáp Trục Đứng',
  'Gói 05: Thi công Hệ thống Cấp Thoát Nước & Xử Lý Nước Thải Sinh Hoạt',
  'Gói 06: Lắp đặt Hệ thống Điện Nhẹ ELV, CCTV, Mạng LAN & Âm Thanh PA',
  'Gói 07: Lắp đặt Hệ thống Quản Lý Tòa Nhà Thông Minh BMS & Tự Động Hóa',
  'Gói 08: Thi công Hệ thống Chống Sét, Tiếp Địa An Toàn & Đèn Chiếu Sáng',
];

const PRESET_CONTRACTORS = [
  'Công Ty CP Cơ Điện Đoàn Nhất (ME)',
  'Công Ty CP Kỹ Thuật REE M&E',
  'Công Ty TNHH PCCC & Cơ Điện Thăng Long',
  'Công Ty CP Kỹ Thuật Lạnh Searefico',
  'Công Ty TNHH Thiết Bị Điện & Tự Động Hóa Schneider',
  'Công Ty CP Xây Lắp & Dịch Vụ Thương Mại Hải Phát',
];

export const BulkAddProjectsModal: React.FC<BulkAddProjectsModalProps> = ({
  isOpen,
  onClose,
  onBulkAdd,
  existingProjectsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'GRID' | 'GENERATOR'>('GRID');

  // Multi-row Grid state
  const [rows, setRows] = useState<DraftRow[]>([
    {
      tempId: 'row_1',
      soHopDong: `HĐ-CT${existingProjectsCount + 1 < 10 ? '0' : ''}${existingProjectsCount + 1}`,
      maCongTrinh: `CT-ME-${existingProjectsCount + 1}`,
      tenCongTrinh: 'Hệ thống Cơ Điện ME Khối Tháp Văn Phòng',
      duAn: 'Dự Án Tổ Hợp Thương Mại & Căn Hộ Cao Cấp',
      nhaThau: 'Công Ty CP Kỹ Thuật REE M&E',
      nhomChiPhi: 'Lắp đặt ME-CK',
      giaTriHdSauVat: 15500000000,
      tienDoHopDong: '2026-10-15',
      tienDoTgdDuyet: '2026-10-25',
      tienDoThucTe: '45',
      ghiChu: 'Gói thầu cơ điện trọng điểm',
    },
    {
      tempId: 'row_2',
      soHopDong: `HĐ-CT${existingProjectsCount + 2 < 10 ? '0' : ''}${existingProjectsCount + 2}`,
      maCongTrinh: `CT-PCCC-${existingProjectsCount + 2}`,
      tenCongTrinh: 'Hệ thống Phòng Cháy Chữa Cháy & Báo Cháy Tự Động',
      duAn: 'Dự Án Tổ Hợp Thương Mại & Căn Hộ Cao Cấp',
      nhaThau: 'Công Ty TNHH PCCC & Cơ Điện Thăng Long',
      nhomChiPhi: 'Xây dựng – Thiết bị',
      giaTriHdSauVat: 8200000000,
      tienDoHopDong: '2026-11-20',
      tienDoTgdDuyet: '2026-11-30',
      tienDoThucTe: '30',
      ghiChu: 'Nghiệm thu theo tiến độ PCCC',
    },
    {
      tempId: 'row_3',
      soHopDong: `HĐ-CT${existingProjectsCount + 3 < 10 ? '0' : ''}${existingProjectsCount + 3}`,
      maCongTrinh: `CT-HVAC-${existingProjectsCount + 3}`,
      tenCongTrinh: 'Cung cấp & Lắp đặt Hệ thống Điều Hòa Không Khí Chiller',
      duAn: 'Dự Án Tổ Hợp Thương Mại & Căn Hộ Cao Cấp',
      nhaThau: 'Công Ty CP Kỹ Thuật Lạnh Searefico',
      nhomChiPhi: 'Lắp đặt ME-CK',
      giaTriHdSauVat: 22000000000,
      tienDoHopDong: '2026-12-10',
      tienDoTgdDuyet: '2026-12-20',
      tienDoThucTe: '15',
      ghiChu: 'Đã ký hợp đồng cung cấp thiết bị',
    },
  ]);

  // Batch Preset Generator state
  const [genProjectName, setGenProjectName] = useState(
    SAMPLE_PROJECT_NAMES[0] || 'Dự Án Khu Đô Thị Sinh Thái Central'
  );
  const [genCostGroup, setGenCostGroup] = useState<CostGroup>('Lắp đặt ME-CK');
  const [genContractPrefix, setGenContractPrefix] = useState('HĐ-BCH');
  const [genContractor, setGenContractor] = useState(PRESET_CONTRACTORS[0]);
  const [genAvgValue, setGenAvgValue] = useState<number>(12000000000);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    PRESET_ME_PACKAGES.slice(0, 4)
  );

  // Paste raw text modal
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  if (!isOpen) return null;

  // Add 1 row
  const handleAddRow = () => {
    const nextIdx = existingProjectsCount + rows.length + 1;
    const newRow: DraftRow = {
      tempId: `row_${Date.now()}_${Math.random()}`,
      soHopDong: `HĐ-CT${nextIdx < 10 ? '0' : ''}${nextIdx}`,
      maCongTrinh: `CT-ME-${nextIdx}`,
      tenCongTrinh: `Gói thầu thi công Cơ Điện #${nextIdx}`,
      duAn: genProjectName,
      nhaThau: 'Công Ty CP Cơ Điện Đoàn Nhất (ME)',
      nhomChiPhi: 'Lắp đặt ME-CK',
      giaTriHdSauVat: 10000000000,
      tienDoHopDong: '2026-11-30',
      tienDoTgdDuyet: '2026-12-10',
      tienDoThucTe: '0',
      ghiChu: '',
    };
    setRows([...rows, newRow]);
  };

  // Add multiple rows
  const handleAddMultipleRows = (count: number) => {
    const newRows: DraftRow[] = [];
    for (let i = 0; i < count; i++) {
      const nextIdx = existingProjectsCount + rows.length + i + 1;
      newRows.push({
        tempId: `row_${Date.now()}_${i}`,
        soHopDong: `HĐ-CT${nextIdx < 10 ? '0' : ''}${nextIdx}`,
        maCongTrinh: `CT-ME-${nextIdx}`,
        tenCongTrinh: `Gói thầu thi công #${nextIdx}`,
        duAn: genProjectName,
        nhaThau: 'Nhà Thầu Cơ Điện & Xây Lắp',
        nhomChiPhi: 'Lắp đặt ME-CK',
        giaTriHdSauVat: 5000000000,
        tienDoHopDong: '2026-12-31',
        tienDoTgdDuyet: '2027-01-15',
        tienDoThucTe: '0',
        ghiChu: '',
      });
    }
    setRows([...rows, ...newRows]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const newIdx = existingProjectsCount + rows.length + 1;
    const clone: DraftRow = {
      ...target,
      tempId: `row_${Date.now()}_clone`,
      soHopDong: `${target.soHopDong}-COPY`,
      maCongTrinh: `${target.maCongTrinh}-CP`,
      tenCongTrinh: `${target.tenCongTrinh} (Bản sao)`,
    };
    const next = [...rows];
    next.splice(index + 1, 0, clone);
    setRows(next);
  };

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof DraftRow, value: any) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  // Handle parsing from clipboard
  const handleApplyPastedText = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText.trim().split('\n');
    const parsedRows: DraftRow[] = [];

    lines.forEach((line, idx) => {
      const cols = line.split('\t').map((c) => c.trim());
      if (cols.length >= 2) {
        const nextIdx = existingProjectsCount + rows.length + idx + 1;
        const soHd = cols[0] || `HĐ-CT${nextIdx}`;
        const tenCt = cols[1] || `Gói thầu ${nextIdx}`;
        const maCt = cols[2] || `CT-${nextIdx}`;
        const nhaThau = cols[3] || 'Nhà Thầu Cơ Điện';
        const duAn = cols[4] || genProjectName;
        const valStr = cols[5] ? cols[5].replace(/[^0-9]/g, '') : '5000000000';
        const val = parseInt(valStr, 10) || 5000000000;

        parsedRows.push({
          tempId: `pasted_${Date.now()}_${idx}`,
          soHopDong: soHd,
          maCongTrinh: maCt,
          tenCongTrinh: tenCt,
          duAn: duAn,
          nhaThau: nhaThau,
          nhomChiPhi: 'Lắp đặt ME-CK',
          giaTriHdSauVat: val,
          tienDoHopDong: '2026-12-31',
          tienDoTgdDuyet: '2027-01-15',
          tienDoThucTe: '0',
          ghiChu: 'Nhập từ bảng dữ liệu',
        });
      }
    });

    if (parsedRows.length > 0) {
      setRows([...rows, ...parsedRows]);
      setIsPasteModalOpen(false);
      setPastedText('');
    }
  };

  // Handle Generator Submission
  const handleGenerateFromPreset = () => {
    if (selectedPackages.length === 0) return;

    const generatedRows: DraftRow[] = selectedPackages.map((pkgName, idx) => {
      const num = existingProjectsCount + rows.length + idx + 1;
      return {
        tempId: `gen_${Date.now()}_${idx}`,
        soHopDong: `${genContractPrefix}-${num < 10 ? '0' : ''}${num}`,
        maCongTrinh: `CT-BCH-${num}`,
        tenCongTrinh: pkgName,
        duAn: genProjectName,
        nhaThau: genContractor,
        nhomChiPhi: genCostGroup,
        giaTriHdSauVat: genAvgValue * (1 + (idx % 3) * 0.15),
        tienDoHopDong: '2026-12-31',
        tienDoTgdDuyet: '2027-01-20',
        tienDoThucTe: '0',
        ghiChu: `Tạo hàng loạt theo gói thầu dự án ${genProjectName}`,
      };
    });

    setRows([...rows, ...generatedRows]);
    setActiveTab('GRID');
  };

  // Submit all rows
  const handleSubmitAll = () => {
    if (rows.length === 0) return;

    // Convert draft rows into standardized Project objects
    const newProjects: Project[] = rows.map((r, idx) => {
      // Build default 8 milestones
      const milestones: ProjectMilestones = {};
      MILESTONE_DEFINITIONS.forEach((def, mIdx) => {
        milestones[def.key] = {
          nt_hd: '2026-10-15',
          nt_tgd: '2026-10-25',
          nt_tt1: undefined,
          nt_tt2: undefined,
          nt_tt3: undefined,
          ngayTrinh: undefined,
          ngayKy: undefined,
        };
      });

      const rawSauVat = Number(r.giaTriHdSauVat) || 0;
      const rawTruocVat = Math.round(rawSauVat / 1.1);
      const vat = rawSauVat - rawTruocVat;

      return {
        id: `proj_bulk_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
        soHopDong: r.soHopDong.trim() || `HĐ-CT${existingProjectsCount + idx + 1}`,
        maCongTrinh: r.maCongTrinh.trim() || `CT-${existingProjectsCount + idx + 1}`,
        tenCongTrinh: r.tenCongTrinh.trim() || `Công trình ${existingProjectsCount + idx + 1}`,
        duAn: r.duAn.trim() || 'Dự Án Trọng Điểm',
        chuDauTu: 'Tập đoàn Vingroup',
        diaPhuong: 'Hà Nội',
        nhaThau: r.nhaThau.trim() || 'Nhà Thầu Cơ Điện',
        nhomChiPhi: r.nhomChiPhi || 'Lắp đặt ME-CK',
        giaTriHdSauVat: rawSauVat,
        giaTriHdTruocVat: rawTruocVat,
        vatAmount: vat,
        luyKeDaChi: 0,
        chiTraTrongKy: 0,
        conLaiChuaChi: rawSauVat,
        ngayHopDong: '2026-01-15',
        tienDoHopDong: r.tienDoHopDong || '2026-12-31',
        tienDoTgdDuyet: r.tienDoTgdDuyet || '2027-01-15',
        tienDoThucTe: r.tienDoThucTe || '0',
        milestones: milestones,
        paymentBatches: [],
        ghiChu: r.ghiChu || '',
        updatedBy: 'Thêm Hàng Loạt (Ban Chỉ Huy)',
        updatedAt: new Date().toISOString(),
      };
    });

    onBulkAdd(newProjects);
    onClose();
  };

  const totalValue = rows.reduce((sum, r) => sum + (Number(r.giaTriHdSauVat) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-700/60 text-blue-200 ring-1 ring-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  THÊM HÀNG LOẠT HỢP ĐỒNG / GÓI THẦU MỚI
                </h3>
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Batch Multi-Row
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Nhập nhanh nhiều hợp đồng qua bảng dữ liệu đa dòng, dán từ Excel hoặc sinh tự động theo mẫu dự án.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('GRID')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'GRID'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bảng Nhập Nhanh Nhiều Dòng ({rows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('GENERATOR')}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'GENERATOR'
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Tạo Theo Mẫu Dự Án & Bộ Môn</span>
            </button>
          </div>

          {activeTab === 'GRID' && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Dán dữ liệu từ bảng tính Excel"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-blue-600" />
                <span>Dán từ Excel</span>
              </button>

              <button
                onClick={() => handleAddMultipleRows(3)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+3 Dòng</span>
              </button>

              <button
                onClick={handleAddRow}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm 1 Dòng</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
          {activeTab === 'GRID' ? (
            <div className="space-y-4">
              {/* Summary Stats Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 font-medium">Số hợp đồng sẽ thêm:</span>{' '}
                    <span className="font-bold text-blue-900">{rows.length} gói thầu</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Tổng giá trị hợp đồng:</span>{' '}
                    <span className="font-extrabold text-blue-900">{formatBillionVN(totalValue)}</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  Mỗi dòng sẽ được tự động khởi tạo 8 mốc nghiệm thu kỹ thuật chuẩn QCQS
                </span>
              </div>

              {/* Data Grid Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[460px] custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
                    <thead className="bg-slate-900 text-slate-200 uppercase text-[10.5px] font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 text-center w-12 border-b border-slate-800">#</th>
                        <th className="p-2.5 w-28 border-b border-slate-800">Số HĐ *</th>
                        <th className="p-2.5 w-28 border-b border-slate-800">Mã CT *</th>
                        <th className="p-2.5 w-64 border-b border-slate-800">Tên Gói Thầu / Công Trình *</th>
                        <th className="p-2.5 w-48 border-b border-slate-800">Dự Án</th>
                        <th className="p-2.5 w-44 border-b border-slate-800">Nhà Thầu</th>
                        <th className="p-2.5 w-36 border-b border-slate-800">Nhóm Chi Phí</th>
                        <th className="p-2.5 w-36 text-right border-b border-slate-800">Giá Trị Sau VAT (VNĐ)</th>
                        <th className="p-2.5 w-28 text-center border-b border-slate-800">Hạn TGĐ Duyệt</th>
                        <th className="p-2.5 w-20 text-center border-b border-slate-800">Tiến Độ %</th>
                        <th className="p-2.5 text-center w-24 sticky right-0 bg-slate-900 z-10">Thao Tác</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-400">
                            <p className="font-semibold text-slate-600">Chưa có dòng nào.</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Bấm "+ Thêm 1 Dòng" hoặc "Tạo Theo Mẫu" để bắt đầu.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, idx) => (
                          <tr key={row.tempId} className="hover:bg-blue-50/40 transition">
                            <td className="p-2 text-center font-bold text-slate-500 text-[11px]">
                              {idx + 1}
                            </td>

                            {/* Số HĐ */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.soHopDong}
                                onChange={(e) => handleUpdateRow(idx, 'soHopDong', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-blue-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                placeholder="HĐ-CT01"
                              />
                            </td>

                            {/* Mã CT */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.maCongTrinh}
                                onChange={(e) => handleUpdateRow(idx, 'maCongTrinh', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                placeholder="CT-ME-01"
                              />
                            </td>

                            {/* Tên Công Trình */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.tenCongTrinh}
                                onChange={(e) => handleUpdateRow(idx, 'tenCongTrinh', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500"
                                placeholder="Tên gói thầu..."
                              />
                            </td>

                            {/* Dự Án */}
                            <td className="p-1.5">
                              <select
                                value={row.duAn}
                                onChange={(e) => handleUpdateRow(idx, 'duAn', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 focus:bg-white cursor-pointer"
                              >
                                {SAMPLE_PROJECT_NAMES.map((pName) => (
                                  <option key={pName} value={pName}>
                                    {pName}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Nhà Thầu */}
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={row.nhaThau}
                                onChange={(e) => handleUpdateRow(idx, 'nhaThau', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:bg-white"
                                placeholder="Nhà thầu..."
                              />
                            </td>

                            {/* Nhóm Chi Phí */}
                            <td className="p-1.5">
                              <select
                                value={row.nhomChiPhi}
                                onChange={(e) =>
                                  handleUpdateRow(idx, 'nhomChiPhi', e.target.value as CostGroup)
                                }
                                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-800 focus:bg-white cursor-pointer"
                              >
                                {COST_GROUPS.map((cg) => (
                                  <option key={cg} value={cg}>
                                    {cg}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Giá Trị HĐ Sau VAT */}
                            <td className="p-1.5 text-right">
                              <input
                                type="number"
                                step="100000000"
                                value={row.giaTriHdSauVat}
                                onChange={(e) =>
                                  handleUpdateRow(idx, 'giaTriHdSauVat', Number(e.target.value))
                                }
                                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-right font-mono font-bold text-emerald-800 focus:bg-white"
                              />
                            </td>

                            {/* Hạn TGĐ Duyệt */}
                            <td className="p-1.5 text-center">
                              <input
                                type="date"
                                value={row.tienDoTgdDuyet}
                                onChange={(e) => handleUpdateRow(idx, 'tienDoTgdDuyet', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-1.5 py-1 text-xs text-center text-slate-700 focus:bg-white"
                              />
                            </td>

                            {/* Tiến Độ % */}
                            <td className="p-1.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={row.tienDoThucTe}
                                onChange={(e) => handleUpdateRow(idx, 'tienDoThucTe', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-1 text-xs text-center font-bold text-blue-900 focus:bg-white"
                              />
                            </td>

                            {/* Action Buttons */}
                            <td className="p-1.5 text-center sticky right-0 bg-white z-10">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateRow(idx)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                                  title="Nhân bản dòng này"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx)}
                                  className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                                  title="Xóa dòng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* TAB 2: BATCH PRESET GENERATOR */
            <div className="space-y-5 max-w-4xl mx-auto py-2">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Sinh Gói Thầu Mẫu Chuẩn Cho Dự Án
                  </h4>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Hệ thống sẽ tự động cấu hình các gói thầu cơ điện, PCCC, HVAC, trạm biến áp và cấp thoát nước theo dự án và đơn vị thi công bạn chọn.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Chọn Dự Án Trọng Điểm:
                  </label>
                  <select
                    value={genProjectName}
                    onChange={(e) => setGenProjectName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {SAMPLE_PROJECT_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Phân Bổ Nhóm Chi Phí:
                  </label>
                  <select
                    value={genCostGroup}
                    onChange={(e) => setGenCostGroup(e.target.value as CostGroup)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    {COST_GROUPS.map((cg) => (
                      <option key={cg} value={cg}>
                        {cg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Tiền Tố Số Hợp Đồng:
                  </label>
                  <input
                    type="text"
                    value={genContractPrefix}
                    onChange={(e) => setGenContractPrefix(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white text-slate-900"
                    placeholder="HĐ-ME-..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. Nhà Thầu Phụ Trách Mặc Định:
                  </label>
                  <select
                    value={genContractor}
                    onChange={(e) => setGenContractor(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                  >
                    {PRESET_CONTRACTORS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Package selection checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  5. Chọn Các Gói Thầu Cần Tạo ({selectedPackages.length}/{PRESET_ME_PACKAGES.length}):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_ME_PACKAGES.map((pkg) => {
                    const isChecked = selectedPackages.includes(pkg);
                    return (
                      <label
                        key={pkg}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPackages([...selectedPackages, pkg]);
                            } else {
                              setSelectedPackages(selectedPackages.filter((p) => p !== pkg));
                            }
                          }}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="leading-snug">{pkg}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateFromPreset}
                  disabled={selectedPackages.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Chuyển {selectedPackages.length} Gói Thầu Sang Bảng Nhập Liệu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Sẵn sàng nạp <strong className="text-blue-900 font-bold">{rows.length}</strong> hợp đồng mới vào hệ thống quản lý.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={rows.length === 0}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác Nhận Thêm {rows.length} Hợp Đồng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Paste Excel Clipboard Sub-modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl p-5 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardPaste className="w-4 h-4 text-blue-600" />
                Dán Dữ Liệu Từ Excel (Dạng Bảng / Tab)
              </h4>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Sao chép các dòng trong Excel (theo thứ tự: <strong>Số HĐ | Tên Gói Thầu | Mã CT | Nhà Thầu | Dự Án | Giá Trị</strong>) và dán vào ô bên dưới:
            </p>

            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="HĐ-ME01	Lắp đặt Chiller	CT-01	Công ty REE	Dự Án Central	15000000000&#10;HĐ-ME02	Trạm Biến Áp	CT-02	Công ty Schneider	Dự Án Central	8500000000"
              className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApplyPastedText}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              >
                Chuyển Thành Dòng Dữ Liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
