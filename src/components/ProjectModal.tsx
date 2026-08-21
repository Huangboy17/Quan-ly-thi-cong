import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Building2,
  Calendar,
  ListCheck,
  Plus,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Sparkles,
  DollarSign,
  UserCheck,
  Mail,
  Briefcase,
  User,
  MapPin,
  Edit3,
  List,
  Percent,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import {
  Project,
  MILESTONE_DEFINITIONS,
  ProjectMilestones,
  MilestoneData,
  MilestoneInfo,
  CostGroup,
  PaymentDotSchedule,
} from '../types';
import {
  MAJOR_PROJECTS,
  PROVINCES_63,
  SUPERVISION_CONSULTANTS,
  INVESTORS,
  DEFAULT_COST_GROUPS,
} from '../data/sampleData';
import { formatBillionVN, formatVND } from '../utils/helpers';
import { getSavedUserProfile, saveUserProfileToStorage } from './UserProfileModal';

interface ProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (project: Project) => void;
  currentUserProfile: any; // Using any or importing UserProfile
}

const emptyMilestones = (): ProjectMilestones => {
  return {
    m1: {},
    m2: {},
    m3: {},
    m4: {},
    m5: {},
    m6: {},
    m7: {},
    m8: { customLabel: 'Khác' },
  };
};

const DEFAULT_DOT_DEFINITIONS: { dot: number; label: string; code: string; defaultPct: number }[] = [
  { dot: 1, label: 'Đợt 1: XD_Phần thô', code: 'M1_RAW', defaultPct: 15 },
  { dot: 2, label: 'Đợt 2: ME_Tập kết TB', code: 'M2_ME_DELIVERY', defaultPct: 15 },
  { dot: 3, label: 'Đợt 3: XD+ME Xây lắp, T&C', code: 'M3_ERECTION_TC', defaultPct: 20 },
  { dot: 4, label: 'Đợt 4: VH Vận hành', code: 'M4_OPERATION', defaultPct: 10 },
  { dot: 5, label: 'Đợt 5: GPMT / PCCC', code: 'M5_PERMITS', defaultPct: 5 },
  { dot: 6, label: 'Đợt 6: Bàn giao', code: 'M6_HANDOVER', defaultPct: 5 },
  { dot: 7, label: 'Đợt 7: Quyết toán thanh lý', code: 'M7_LIQUIDATION', defaultPct: 5 },
  { dot: 8, label: 'Đợt 8: Khác / Bảo hành', code: 'M8_OTHER', defaultPct: 5 },
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  project,
  onClose,
  onSave,
  currentUserProfile,
}) => {
  // Section 1: Basic Contract Info
  const [soHopDong, setSoHopDong] = useState('');
  const [maCongTrinh, setMaCongTrinh] = useState('');
  const [tenCongTrinh, setTenCongTrinh] = useState('');
  const [duAn, setDuAn] = useState(MAJOR_PROJECTS[0]);

  // Province mode: DROPDOWN (63 provinces) or MANUAL
  const [diaPhuongMode, setDiaPhuongMode] = useState<'DROPDOWN' | 'MANUAL'>('DROPDOWN');
  const [diaPhuong, setDiaPhuong] = useState('Hà Nội');
  const [manualDiaPhuong, setManualDiaPhuong] = useState('');

  // Investor (Chủ đầu tư) - Manual text
  const [chuDauTu, setChuDauTu] = useState('Tập đoàn Vingroup - CTCP');

  // Supervision Consultant (Tư vấn giám sát) - Manual text / suggestion
  const [tuVanGiamSat, setTuVanGiamSat] = useState('Công ty CP Tư vấn Công nghệ, Thiết bị và Kiểm định Xây dựng - CONINCO');

  // Cost Groups list & custom additions
  const [customCostGroups, setCustomCostGroups] = useState<string[]>([]);
  const [nhomChiPhi, setNhomChiPhi] = useState<string>('Phần Xây dựng');
  const [isAddingNewCostGroup, setIsAddingNewCostGroup] = useState(false);
  const [newCostGroupName, setNewCostGroupName] = useState('');
  const [manualCostGroupText, setManualCostGroupText] = useState('');

  // Contract Financials
  const [giaTriHdSauVat, setGiaTriHdSauVat] = useState<number>(146300000000);
  const [luyKeDaChi, setLuyKeDaChi] = useState<number>(67500000000);

  // Advance Payment (Tạm ứng)
  const [tamUngPercent, setTamUngPercent] = useState<number>(20);
  const [tamUngAmount, setTamUngAmount] = useState<number>(29260000000);
  const [tamUngNgay, setTamUngNgay] = useState<string>('');
  const [tamUngGhiChu, setTamUngGhiChu] = useState<string>('Tạm ứng theo điều khoản hợp đồng');
  const [tamUngDaNhan, setTamUngDaNhan] = useState<boolean>(true);

  // 8 Payment Stages (Đợt 1 đến Đợt 8 / Khác)
  const [dotSchedules, setDotSchedules] = useState<PaymentDotSchedule[]>(() => {
    return DEFAULT_DOT_DEFINITIONS.map((def) => {
      const amt = Math.round((146300000000 * def.defaultPct) / 100);
      return {
        dot: def.dot,
        label: def.label,
        code: def.code,
        percent: def.defaultPct,
        amount: amt,
        ngayDuKien: '',
        ngayThucTe: '',
        isPaid: def.dot <= 2,
        ghiChu: '',
      };
    });
  });

  // Section 2: Project Overall Timeline
  const [ngayHopDong, setNgayHopDong] = useState('');
  const [tienDoHopDong, setTienDoHopDong] = useState('');
  const [tienDoTgdDuyet, setTienDoTgdDuyet] = useState('');
  const [tienDoThucTe, setTienDoThucTe] = useState('');

  // Section 3: 8 QCQS Milestones
  const [milestones, setMilestones] = useState<ProjectMilestones>(emptyMilestones());
  const [customMilestones, setCustomMilestones] = useState<MilestoneInfo[]>([]);
  const [ghiChu, setGhiChu] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');

  // Section 5: BCH Author Identity
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Chỉ Huy Trưởng ME-CK');
  const [authorEmail, setAuthorEmail] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newlyAddedKey, setNewlyAddedKey] = useState<string | null>(null);

  // Initialize or populate when project changes
  useEffect(() => {
    const savedUser = getSavedUserProfile();
    if (savedUser) {
      setAuthorName(savedUser.fullName || '');
      setAuthorRole(savedUser.role || 'Chỉ Huy Trưởng ME-CK');
      setAuthorEmail(savedUser.email || '');
    }

    if (project) {
      setSoHopDong(project.soHopDong || '');
      setMaCongTrinh(project.maCongTrinh || '');
      setTenCongTrinh(project.tenCongTrinh || '');
      setDuAn(project.duAn || MAJOR_PROJECTS[0]);

      // Investor
      setChuDauTu(project.chuDauTu || 'Tập đoàn Vingroup - CTCP');

      // Supervision Consultant
      setTuVanGiamSat(project.tuVanGiamSat || project.nhaThau || SUPERVISION_CONSULTANTS[0]);

      // Province
      if (project.diaPhuong) {
        if (PROVINCES_63.includes(project.diaPhuong)) {
          setDiaPhuongMode('DROPDOWN');
          setDiaPhuong(project.diaPhuong);
        } else {
          setDiaPhuongMode('MANUAL');
          setManualDiaPhuong(project.diaPhuong);
        }
      } else {
        setDiaPhuongMode('DROPDOWN');
        setDiaPhuong('Hà Nội');
      }

      // Cost Group
      const currentCostGroup = project.nhomChiPhi || 'Phần Xây dựng';
      const allKnownGroups = [...DEFAULT_COST_GROUPS, ...customCostGroups];
      if (allKnownGroups.includes(currentCostGroup)) {
        setNhomChiPhi(currentCostGroup);
      } else {
        setNhomChiPhi('Khác');
        setManualCostGroupText(currentCostGroup);
      }

      // Financials
      const contractVal = project.giaTriHdSauVat || 146300000000;
      setGiaTriHdSauVat(contractVal);
      setLuyKeDaChi(project.luyKeDaChi || 67500000000);

      // Advance
      const advPct = project.tamUngPercent !== undefined ? project.tamUngPercent : 20;
      const advAmt = project.tamUngAmount !== undefined ? project.tamUngAmount : Math.round((contractVal * advPct) / 100);
      setTamUngPercent(advPct);
      setTamUngAmount(advAmt);
      setTamUngNgay(project.tamUngNgay || '');
      setTamUngGhiChu(project.tamUngGhiChu || 'Tạm ứng theo hợp đồng');

      // Payment Schedule (8 Dots)
      if (project.paymentSchedule && project.paymentSchedule.length > 0) {
        setDotSchedules(project.paymentSchedule);
      } else {
        setDotSchedules(
          DEFAULT_DOT_DEFINITIONS.map((def) => {
            const amt = Math.round((contractVal * def.defaultPct) / 100);
            return {
              dot: def.dot,
              label: def.label,
              code: def.code,
              percent: def.defaultPct,
              amount: amt,
              ngayDuKien: '',
              ngayThucTe: '',
              isPaid: false,
              ghiChu: '',
            };
          })
        );
      }

      setNgayHopDong(project.ngayHopDong || '');
      setTienDoHopDong(project.tienDoHopDong || '');
      setTienDoTgdDuyet(project.tienDoTgdDuyet || '');
      setTienDoThucTe(project.tienDoThucTe || '');
      setMilestones(project.milestones ? { ...emptyMilestones(), ...project.milestones } : emptyMilestones());
      setCustomMilestones(project.customMilestones ? [...project.customMilestones] : []);
      setGhiChu(project.ghiChu || '');
      setUpdatedBy(project.updatedBy || '');
    } else {
      // New Project defaults
      setSoHopDong('');
      setMaCongTrinh('');
      setTenCongTrinh('');
      setDuAn(MAJOR_PROJECTS[0]);
      setChuDauTu('Tập đoàn Vingroup - CTCP');
      setTuVanGiamSat(SUPERVISION_CONSULTANTS[0]);
      setDiaPhuongMode('DROPDOWN');
      setDiaPhuong('Hà Nội');
      setManualDiaPhuong('');
      setNhomChiPhi('Phần Xây dựng');
      setManualCostGroupText('');

      const defaultVal = 146300000000;
      setGiaTriHdSauVat(defaultVal);
      setLuyKeDaChi(29260000000); // 20% default

      setTamUngPercent(20);
      setTamUngAmount(Math.round((defaultVal * 20) / 100));
      setTamUngNgay('');
      setTamUngGhiChu('Tạm ứng HĐ đợt 1');
      setTamUngDaNhan(true);

      setDotSchedules(
        DEFAULT_DOT_DEFINITIONS.map((def) => {
          const amt = Math.round((defaultVal * def.defaultPct) / 100);
          return {
            dot: def.dot,
            label: def.label,
            code: def.code,
            percent: def.defaultPct,
            amount: amt,
            ngayDuKien: '',
            ngayThucTe: '',
            isPaid: false,
            ghiChu: '',
          };
        })
      );

      setNgayHopDong('');
      setTienDoHopDong('');
      setTienDoTgdDuyet('');
      setTienDoThucTe('');
      setMilestones(emptyMilestones());
      setCustomMilestones([]);
      setGhiChu('');
      setUpdatedBy('');
    }
  }, [project, isOpen]);

  // Derived Financial calculations
  const giaTriHdTruocVat = useMemo(() => {
    return Math.round(giaTriHdSauVat / 1.1);
  }, [giaTriHdSauVat]);

  const vatAmount = useMemo(() => {
    return giaTriHdSauVat - giaTriHdTruocVat;
  }, [giaTriHdSauVat, giaTriHdTruocVat]);

  // Handle contract value changes -> auto recalculate advance and dot amounts based on active percentages
  const handleContractValueChange = (newVal: number) => {
    const val = Math.max(0, newVal);
    setGiaTriHdSauVat(val);

    // Recalculate advance amount
    const newAdvAmt = Math.round((val * tamUngPercent) / 100);
    setTamUngAmount(newAdvAmt);

    // Recalculate dot schedule amounts
    setDotSchedules((prev) =>
      prev.map((d) => ({
        ...d,
        amount: Math.round((val * d.percent) / 100),
      }))
    );
  };

  // Handle Advance % input
  const handleTamUngPercentChange = (pct: number) => {
    const p = Math.max(0, Math.min(100, pct));
    setTamUngPercent(p);
    const amt = Math.round((giaTriHdSauVat * p) / 100);
    setTamUngAmount(amt);
  };

  // Handle Advance amount input
  const handleTamUngAmountChange = (amt: number) => {
    const a = Math.max(0, amt);
    setTamUngAmount(a);
    const p = giaTriHdSauVat > 0 ? Number(((a / giaTriHdSauVat) * 100).toFixed(2)) : 0;
    setTamUngPercent(p);
  };

  // Handle Dot % input
  const handleDotPercentChange = (dotIndex: number, pct: number) => {
    const p = Math.max(0, Math.min(100, pct));
    setDotSchedules((prev) => {
      const copy = [...prev];
      const amt = Math.round((giaTriHdSauVat * p) / 100);
      copy[dotIndex] = {
        ...copy[dotIndex],
        percent: p,
        amount: amt,
      };
      return copy;
    });
  };

  // Handle Dot amount input
  const handleDotAmountChange = (dotIndex: number, amt: number) => {
    const a = Math.max(0, amt);
    setDotSchedules((prev) => {
      const copy = [...prev];
      const p = giaTriHdSauVat > 0 ? Number(((a / giaTriHdSauVat) * 100).toFixed(2)) : 0;
      copy[dotIndex] = {
        ...copy[dotIndex],
        amount: a,
        percent: p,
      };
      return copy;
    });
  };

  // Handle Dot detail update (date, paid, note)
  const handleDotDetailChange = (
    dotIndex: number,
    field: keyof PaymentDotSchedule,
    value: any
  ) => {
    setDotSchedules((prev) => {
      const copy = [...prev];
      copy[dotIndex] = {
        ...copy[dotIndex],
        [field]: value,
      };
      return copy;
    });
  };

  // Total Payment Percentages calculation
  const totalPaymentPercent = useMemo(() => {
    const dotsTotal = dotSchedules.reduce((acc, d) => acc + (d.percent || 0), 0);
    return Number((tamUngPercent + dotsTotal).toFixed(2));
  }, [tamUngPercent, dotSchedules]);

  const totalPaymentAmount = useMemo(() => {
    const dotsTotal = dotSchedules.reduce((acc, d) => acc + (d.amount || 0), 0);
    return tamUngAmount + dotsTotal;
  }, [tamUngAmount, dotSchedules]);

  // Quick Action: Reset to standard breakdown
  const handleApplyStandardRatios = () => {
    setTamUngPercent(20);
    const advAmt = Math.round((giaTriHdSauVat * 20) / 100);
    setTamUngAmount(advAmt);

    setDotSchedules((prev) =>
      prev.map((d) => {
        const def = DEFAULT_DOT_DEFINITIONS.find((item) => item.dot === d.dot);
        const p = def ? def.defaultPct : 10;
        return {
          ...d,
          percent: p,
          amount: Math.round((giaTriHdSauVat * p) / 100),
        };
      })
    );
    setToastMessage('Đã áp dụng mẫu phân bổ chuẩn 100% (20% Tạm ứng + 8 Đợt)');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize Lũy kế đã chi with paid items
  const handleCalculateDisbursedFromSchedule = () => {
    let disbursed = tamUngDaNhan ? tamUngAmount : 0;
    dotSchedules.forEach((d) => {
      if (d.isPaid) {
        disbursed += d.amount || 0;
      }
    });
    setLuyKeDaChi(disbursed);
    setToastMessage(`Đã cập nhật Lũy kế đã chi: ${formatBillionVN(disbursed)}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cost Groups management
  const allAvailableCostGroups = useMemo(() => {
    return [...DEFAULT_COST_GROUPS, ...customCostGroups];
  }, [customCostGroups]);

  const handleAddNewCostGroup = () => {
    if (!newCostGroupName.trim()) return;
    const name = newCostGroupName.trim();
    if (!allAvailableCostGroups.includes(name)) {
      setCustomCostGroups((prev) => [...prev, name]);
      setNhomChiPhi(name);
      setNewCostGroupName('');
      setIsAddingNewCostGroup(false);
      setToastMessage(`Đã thêm nhóm chi phí: "${name}"`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleRemoveCustomCostGroup = (nameToRemove: string) => {
    setCustomCostGroups((prev) => prev.filter((g) => g !== nameToRemove));
    if (nhomChiPhi === nameToRemove) {
      setNhomChiPhi(DEFAULT_COST_GROUPS[0]);
    }
  };

  // 8 QCQS Milestones manipulation
  const handleMilestoneChange = (
    key: string,
    field: keyof MilestoneData,
    value: string
  ) => {
    setMilestones((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }));
  };

  const handleAddCustomMilestone = () => {
    const nextNum = MILESTONE_DEFINITIONS.length + customMilestones.length + 1;
    const newKey = `m_custom_${Date.now()}`;
    const defaultLabel = `Đợt ${nextNum}: Mốc bổ sung`;
    const newMilestone: MilestoneInfo = {
      key: newKey,
      label: defaultLabel,
      code: `M${nextNum}_CUSTOM`,
      description: 'Đợt / mốc nghiệm thu tự bổ sung',
      isCustom: true,
    };
    setCustomMilestones((prev) => [...prev, newMilestone]);
    setMilestones((prev) => ({
      ...prev,
      [newKey]: { customLabel: defaultLabel },
    }));

    setToastMessage(`Đã thêm thành công: "${defaultLabel}"!`);
    setNewlyAddedKey(newKey);
    setTimeout(() => setToastMessage(null), 3500);
    setTimeout(() => setNewlyAddedKey(null), 4000);
  };

  const handleRemoveCustomMilestone = (key: string) => {
    setCustomMilestones((prev) => prev.filter((m) => m.key !== key));
    setMilestones((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maCongTrinh || !soHopDong || !tenCongTrinh) return;

    // Final selected Province
    const finalDiaPhuong = diaPhuongMode === 'MANUAL' ? manualDiaPhuong.trim() || 'Hà Nội' : diaPhuong;

    // Final selected Cost Group
    const finalNhomChiPhi = (nhomChiPhi === 'Khác' ? manualCostGroupText.trim() || 'Khác' : nhomChiPhi) as CostGroup;

    // BCH author identity
    const cleanAuthor = authorName.trim()
      ? `${authorName.trim()} (${authorRole || 'BCH'})`
      : updatedBy || 'BCH Công Trường';

    if (authorName.trim() && authorEmail.trim()) {
      saveUserProfileToStorage({
        fullName: authorName.trim(),
        role: authorRole,
        email: authorEmail.trim(),
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedProject: Project = {
      id: project ? project.id : `ct_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      soHopDong,
      maCongTrinh,
      tenCongTrinh,
      duAn,
      chuDauTu: chuDauTu.trim() || 'Tập đoàn Vingroup - CTCP',
      diaPhuong: finalDiaPhuong,
      nhaThau: tuVanGiamSat.trim() || SUPERVISION_CONSULTANTS[0],
      tuVanGiamSat: tuVanGiamSat.trim() || SUPERVISION_CONSULTANTS[0],
      nhomChiPhi: finalNhomChiPhi,

      // Advance & 8-stage Payment Schedule
      tamUngPercent,
      tamUngAmount,
      tamUngNgay,
      tamUngGhiChu,
      paymentSchedule: dotSchedules,

      // Financials
      giaTriHdSauVat,
      giaTriHdTruocVat,
      vatAmount,
      luyKeDaChi,
      chiTraTrongKy: Math.round(luyKeDaChi * 0.7),
      conLaiChuaChi: Math.max(0, giaTriHdSauVat - luyKeDaChi),

      // Overall Progress & Milestones
      ngayHopDong,
      tienDoHopDong,
      tienDoTgdDuyet,
      tienDoThucTe,
      milestones,
      customMilestones,
      ghiChu,
      updatedBy: cleanAuthor,
      updatedAt: new Date().toISOString(),
      userId: project ? project.userId : (currentUserProfile?.accountType === 'level_2' ? currentUserProfile.parentId : currentUserProfile?.id),
      assigneeId: project ? project.assigneeId : (currentUserProfile?.accountType === 'level_2' ? currentUserProfile.id : null),
    };

    onSave(updatedProject);
    onClose();
  };

  if (!isOpen) return null;

  const allMilestoneDefs = [...MILESTONE_DEFINITIONS, ...customMilestones];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-6xl w-full border border-slate-200 dark:border-slate-800 my-6 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg border border-blue-500/40 text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{project ? 'Cập Nhật Thông Tin Hợp Đồng & Kế Hoạch Nghiệm Thu ME-CK' : 'Thêm Mới Hợp Đồng / Gói Thầu ME-CK'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Kê khai thông tin hợp đồng, tư vấn giám sát, 63 tỉnh thành, nhóm chi phí và phân bổ dòng tiền % tạm ứng & 8 đợt thanh toán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Floating Toast Notification inside modal */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-lg animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[82vh] overflow-y-auto custom-scrollbar">
          {/* PHẦN 1: THÔNG TIN HỢP ĐỒNG & TÀI CHÍNH */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-900 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded text-[10px] font-black tracking-wide">
                  PHẦN 1
                </span>
                <h4 className="font-extrabold text-blue-950 dark:text-blue-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> Thông Tin Hợp Đồng & Tài Chính
                </h4>
              </div>
              <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                * Bắt buộc các trường chính
              </span>
            </div>

            {/* Dòng 1: Số Hợp Đồng, Mã Công Trình, Tên Công Trình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Số Hợp Đồng *
                </label>
                <input
                  type="text"
                  required
                  value={soHopDong}
                  onChange={(e) => setSoHopDong(e.target.value)}
                  placeholder="VD: HĐ-01-015/2026"
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Mã Công Trình *
                </label>
                <input
                  type="text"
                  required
                  value={maCongTrinh}
                  onChange={(e) => setMaCongTrinh(e.target.value)}
                  placeholder="VD: CT-015"
                  className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-mono font-black text-blue-700 dark:text-blue-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Tên Hợp Đồng / Công Trình *
                </label>
                <input
                  type="text"
                  required
                  value={tenCongTrinh}
                  onChange={(e) => setTenCongTrinh(e.target.value)}
                  placeholder="VD: Căn Hộ Cao Cấp Sunrise - Gói ME-CK"
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Dòng 2: Địa Phương (2 Lựa chọn: 63 Tỉnh Thành hoặc Gõ Tay), Chủ Đầu Tư (Gõ tay), Tư Vấn Giám Sát (Gõ tay) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
              {/* 1. Địa Phương (2 options: 63 tỉnh thành hoặc gõ tay) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Địa Phương *</span>
                  </label>
                  {/* Mode switcher toggle */}
                  <div className="inline-flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-md text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDiaPhuongMode('DROPDOWN')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        diaPhuongMode === 'DROPDOWN'
                          ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Chọn trong danh mục đủ 63 tỉnh thành Việt Nam"
                    >
                      63 Tỉnh Thành
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiaPhuongMode('MANUAL')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        diaPhuongMode === 'MANUAL'
                          ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Tự do gõ tay địa phương"
                    >
                      Gõ Tay
                    </button>
                  </div>
                </div>

                {diaPhuongMode === 'DROPDOWN' ? (
                  <select
                    value={diaPhuong}
                    onChange={(e) => setDiaPhuong(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-slate-800 font-bold text-rose-700 dark:text-rose-400"
                  >
                    {PROVINCES_63.map((prov) => (
                      <option key={prov} value={prov}>
                        📍 {prov}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualDiaPhuong}
                    onChange={(e) => setManualDiaPhuong(e.target.value)}
                    placeholder="VD: TP. Thủ Đức, Khu Công Nghệ Cao..."
                    className="w-full p-2 border border-rose-300 dark:border-rose-800 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-slate-800 font-bold text-rose-700 dark:text-rose-300"
                  />
                )}
              </div>

              {/* 2. Chủ Đầu Tư (Gõ tay) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Chủ Đầu Tư (Gõ tay) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tự do nhập</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="investor-suggestions"
                    value={chuDauTu}
                    onChange={(e) => setChuDauTu(e.target.value)}
                    placeholder="Nhập tên Chủ đầu tư (VD: Tập đoàn Vingroup...)"
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100"
                  />
                  <datalist id="investor-suggestions">
                    {INVESTORS.map((inv) => (
                      <option key={inv} value={inv} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 3. Tư Vấn Giám Sát (Gõ tay / gợi ý) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Tư Vấn Giám Sát *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tự do nhập</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="supervisor-suggestions"
                    value={tuVanGiamSat}
                    onChange={(e) => setTuVanGiamSat(e.target.value)}
                    placeholder="Nhập đơn vị Tư vấn giám sát (VD: CONINCO, APAVE...)"
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100"
                  />
                  <datalist id="supervisor-suggestions">
                    {SUPERVISION_CONSULTANTS.map((sc) => (
                      <option key={sc} value={sc} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Dòng 3: Nhóm Chi Phí với dấu (+) thêm bớt tùy ý và Khác tự gõ */}
            <div className="bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Nhóm Chi Phí *</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCostGroup(!isAddingNewCostGroup)}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>(+) Thêm Nhóm Mới</span>
                  </button>
                </div>
              </div>

              {/* Form thêm nhanh nhóm chi phí mới khi click (+) */}
              {isAddingNewCostGroup && (
                <div className="p-2.5 bg-indigo-50/80 dark:bg-indigo-950/60 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 animate-in fade-in">
                  <input
                    type="text"
                    value={newCostGroupName}
                    onChange={(e) => setNewCostGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm chi phí mới (VD: Phần Chi phí dự phòng)..."
                    className="flex-1 p-1.5 border border-indigo-300 dark:border-indigo-700 rounded text-xs bg-white dark:bg-slate-900 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCostGroup();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCostGroup}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition"
                  >
                    Thêm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCostGroup(false);
                      setNewCostGroupName('');
                    }}
                    className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Danh sách các nhóm chi phí dạng Radio Pills & Khác */}
              <div className="flex flex-wrap gap-2 pt-1">
                {allAvailableCostGroups.map((group) => {
                  const isSelected = nhomChiPhi === group;
                  const isCustom = customCostGroups.includes(group);
                  return (
                    <div
                      key={group}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                      onClick={() => setNhomChiPhi(group)}
                    >
                      <span>{group}</span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomCostGroup(group);
                          }}
                          className="hover:text-rose-300 p-0.5 rounded ml-1"
                          title="Xóa nhóm chi phí này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Option "Khác: tự gõ thủ công" */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    nhomChiPhi === 'Khác'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                  onClick={() => setNhomChiPhi('Khác')}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Khác (Tự gõ thủ công)</span>
                </div>
              </div>

              {/* Ô gõ tay khi chọn Khác */}
              {nhomChiPhi === 'Khác' && (
                <div className="pt-2">
                  <input
                    type="text"
                    required
                    value={manualCostGroupText}
                    onChange={(e) => setManualCostGroupText(e.target.value)}
                    placeholder="Nhập tên nhóm chi phí tùy ý..."
                    className="w-full p-2 border border-indigo-300 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 font-bold text-indigo-700 dark:text-indigo-300"
                  />
                </div>
              )}
            </div>

            {/* Dòng 4: GIÁ TRỊ HỢP ĐỒNG & TÍNH TOÁN TRƯỚC VAT */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl border border-blue-700 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-sm uppercase tracking-wider text-white">
                    Giá Trị Hợp Đồng & Cơ Cấu Tài Chính
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-blue-200">
                  <span>Trước VAT: <strong className="font-mono text-white text-sm">{formatBillionVN(giaTriHdTruocVat)}</strong></span>
                  <span>|</span>
                  <span>Thuế VAT 10%: <strong className="font-mono text-amber-300">{formatBillionVN(vatAmount)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-blue-200 mb-1">
                    Giá Trị HĐ Sau VAT (VNĐ) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={10000000}
                      required
                      value={giaTriHdSauVat}
                      onChange={(e) => handleContractValueChange(Number(e.target.value))}
                      className="w-full p-2.5 text-sm font-mono font-black text-blue-950 bg-white rounded-lg border border-blue-400 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-blue-800 text-xs">
                      ≈ {formatBillionVN(giaTriHdSauVat)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-200 mb-1">
                    Ngày Ký Hợp Đồng
                  </label>
                  <input
                    type="date"
                    value={ngayHopDong}
                    onChange={(e) => setNgayHopDong(e.target.value)}
                    className="w-full p-2 text-xs font-mono bg-white text-slate-900 rounded-lg border border-blue-400 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dòng 5: KẾ HOẠCH TẠM ỨNG & 8 ĐỢT THANH TOÁN (PERCENTAGE & AMOUNT AUTO-CALCULATION) */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              {/* Header for Payment Distribution */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Kế Hoạch % Tạm Ứng & 8 Đợt Thanh Toán Hợp Đồng</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gõ % để tự động tính tiền hoặc gõ tiền để tự quy đổi % tương ứng
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleApplyStandardRatios}
                    className="px-2.5 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>⚡ Mẫu Chuẩn (20% TƯ + 8 Đợt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCalculateDisbursedFromSchedule}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition flex items-center gap-1 cursor-pointer"
                    title="Tự động tính Lũy kế đã chi từ các đợt đã đánh dấu hoàn thành"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Tính Lũy Kế Đã Chi</span>
                  </button>
                </div>
              </div>

              {/* Status Bar of Total % */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    Tổng Cơ Cấu Phân Bổ (Tạm Ứng + 8 Đợt):
                  </span>
                  <span
                    className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-md ${
                      totalPaymentPercent === 100
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                        : totalPaymentPercent < 100
                        ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                        : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 border border-rose-300'
                    }`}
                  >
                    {totalPaymentPercent}%
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-semibold">
                    ≈ {formatBillionVN(totalPaymentAmount)} / {formatBillionVN(giaTriHdSauVat)}
                  </span>
                </div>

                <div>
                  {totalPaymentPercent === 100 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Chuẩn 100% Giá Trị Hợp Đồng
                    </span>
                  ) : totalPaymentPercent < 100 ? (
                    <span className="text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Còn thiếu {(100 - totalPaymentPercent).toFixed(1)}% để đủ 100%
                    </span>
                  ) : (
                    <span className="text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Đang vượt {(totalPaymentPercent - 100).toFixed(1)}% so với HĐ
                    </span>
                  )}
                </div>
              </div>

              {/* MỤC A: TẠM ỨNG HỢP ĐỒNG */}
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                      TẠM ỨNG
                    </span>
                    <h6 className="font-black text-amber-950 dark:text-amber-200 text-xs">
                      Tạm Ứng Hợp Đồng
                    </h6>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-300">
                    <input
                      type="checkbox"
                      checked={tamUngDaNhan}
                      onChange={(e) => setTamUngDaNhan(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 accent-amber-600"
                    />
                    <span>Đã giải ngân tạm ứng</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {/* Ô gõ % Tạm ứng */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      % Tạm Ứng HĐ
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={tamUngPercent}
                        onChange={(e) => handleTamUngPercentChange(Number(e.target.value))}
                        className="w-full p-2 pr-6 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-amber-950 dark:text-amber-200 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Ô số tiền Tạm ứng tự tính / gõ tay */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Số Tiền Tạm Ứng (VNĐ)
                    </label>
                    <input
                      type="number"
                      step={10000000}
                      value={tamUngAmount}
                      onChange={(e) => handleTamUngAmountChange(Number(e.target.value))}
                      className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 font-mono font-bold text-amber-950 dark:text-amber-200 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold block mt-0.5">
                      ≈ {formatBillionVN(tamUngAmount)}
                    </span>
                  </div>

                  {/* Ngày tạm ứng */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Ngày Tạm Ứng
                    </label>
                    <input
                      type="date"
                      value={tamUngNgay}
                      onChange={(e) => setTamUngNgay(e.target.value)}
                      className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>

                  {/* Ghi chú tạm ứng */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Ghi Chú Tạm Ứng
                    </label>
                    <input
                      type="text"
                      value={tamUngGhiChu}
                      onChange={(e) => setTamUngGhiChu(e.target.value)}
                      placeholder="Bảo lãnh tạm ứng, điều kiện giải ngân..."
                      className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* MỤC B: 8 ĐỢT THANH TOÁN (ĐỢT 1 -> ĐỢT 8 / KHÁC) */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Chi Tiết 8 Đợt Thanh Toán Nghiệm Thu (Gõ % Tự Động Tính Tiền):</span>
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                    8 Đợt theo tiến độ QCQS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {dotSchedules.map((dotItem, idx) => (
                    <div
                      key={dotItem.dot}
                      className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative group hover:border-indigo-300 dark:hover:border-indigo-600 transition"
                    >
                      {/* Dot Title */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-mono font-black text-[10px] flex items-center justify-center">
                            {dotItem.dot}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1" title={dotItem.label}>
                            {dotItem.label}
                          </span>
                        </div>

                        <label className="flex items-center gap-1 cursor-pointer" title="Đánh dấu đã thanh toán đợt này">
                          <input
                            type="checkbox"
                            checked={!!dotItem.isPaid}
                            onChange={(e) => handleDotDetailChange(idx, 'isPaid', e.target.checked)}
                            className="w-3.5 h-3.5 text-emerald-600 rounded accent-emerald-600"
                          />
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Đã chi</span>
                        </label>
                      </div>

                      {/* Inputs: % and Amount */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* % Input */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase text-indigo-800 dark:text-indigo-300">
                            % Thanh Toán
                          </label>
                          <div className="relative mt-0.5">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={dotItem.percent}
                              onChange={(e) => handleDotPercentChange(idx, Number(e.target.value))}
                              className="w-full p-1.5 pr-5 border border-indigo-200 dark:border-indigo-800 rounded bg-white dark:bg-slate-900 font-mono font-bold text-xs text-indigo-950 dark:text-indigo-200 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              %
                            </span>
                          </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                          <label className="block text-[9px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                            Số Tiền (VNĐ)
                          </label>
                          <input
                            type="number"
                            step={10000000}
                            value={dotItem.amount}
                            onChange={(e) => handleDotAmountChange(idx, Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono font-bold text-xs text-slate-900 dark:text-white outline-none mt-0.5 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Currency subtitle */}
                      <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                        <span>≈ {formatBillionVN(dotItem.amount)}</span>
                        <span className="text-[9px] text-slate-400">{dotItem.code}</span>
                      </div>

                      {/* Date & Note */}
                      <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-1.5">
                        <div>
                          <input
                            type="date"
                            value={dotItem.ngayDuKien || ''}
                            onChange={(e) => handleDotDetailChange(idx, 'ngayDuKien', e.target.value)}
                            className="w-full p-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono"
                            title="Ngày dự kiến / hoàn thành thanh toán"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={dotItem.ghiChu || ''}
                            onChange={(e) => handleDotDetailChange(idx, 'ghiChu', e.target.value)}
                            placeholder="Ghi chú đợt..."
                            className="w-full p-1 text-[10px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 truncate"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lũy kế đã chi Input display */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-900 dark:text-emerald-300">
                    Lũy Kế Đã Chi Hiện Tại (VNĐ)
                  </span>
                  <div className="text-sm font-mono font-black text-emerald-900 dark:text-emerald-200">
                    {formatBillionVN(luyKeDaChi)} ({giaTriHdSauVat > 0 ? Math.round((luyKeDaChi / giaTriHdSauVat) * 100) : 0}%)
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                    Nhập trực tiếp (nếu cần):
                  </label>
                  <input
                    type="number"
                    step={10000000}
                    value={luyKeDaChi}
                    onChange={(e) => setLuyKeDaChi(Number(e.target.value))}
                    className="p-1.5 text-xs font-mono font-bold border border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 outline-none w-44"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 2: CÁC THỜI GIAN CỦA DỰ ÁN (TIẾN ĐỘ TỔNG THỂ) */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-3">
            <div className="flex items-center gap-2 border-b border-indigo-200 dark:border-indigo-900 pb-2">
              <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                PHẦN 2
              </span>
              <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Các Thời Gian Của Dự Án (Tiến Độ Tổng Thể)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hợp Đồng (Ngày hoàn thành)
                </label>
                <input
                  type="date"
                  value={tienDoHopDong}
                  onChange={(e) => setTienDoHopDong(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  TGĐ Duyệt (Ngày cam kết)
                </label>
                <input
                  type="date"
                  value={tienDoTgdDuyet}
                  onChange={(e) => setTienDoTgdDuyet(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thực Tế (Ngày thực tế đạt được)
                </label>
                <input
                  type="date"
                  value={tienDoThucTe}
                  onChange={(e) => setTienDoThucTe(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* PHẦN 3: CHI TIẾT 8 MỐC NGHIỆM THU QCQS & TRÌNH KÝ HỒ SƠ */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                  PHẦN 3
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ListCheck className="w-4 h-4 text-emerald-600" /> Chi Tiết 8 Mốc Nghiệm Thu & Trình Ký Hồ Sơ
                </h4>
              </div>

              <button
                type="button"
                onClick={handleAddCustomMilestone}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Thêm Mốc Bổ Sung</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allMilestoneDefs.map((def, idx) => {
                const curM = milestones[def.key] || {};
                const isCustom = def.isCustom || idx >= 7;

                return (
                  <div
                    key={def.key}
                    id={`milestone-card-${def.key}`}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        {isCustom ? (
                          <input
                            type="text"
                            value={curM.customLabel || def.label}
                            onChange={(e) => handleMilestoneChange(def.key, 'customLabel', e.target.value)}
                            placeholder="Nhập tên mốc nghiệm thu..."
                            className="p-1 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none w-52"
                          />
                        ) : (
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{def.label}</span>
                        )}
                      </div>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomMilestone(def.key)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded"
                          title="Xóa mốc này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium">NT Hợp Đồng</label>
                        <input
                          type="date"
                          value={curM.nt_hd || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'nt_hd', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-blue-600 dark:text-blue-400 font-medium">NT TGĐ Duyệt</label>
                        <input
                          type="date"
                          value={curM.nt_tgd || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'nt_tgd', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">NT Thực Tế L1</label>
                        <input
                          type="date"
                          value={curM.nt_tt1 || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'nt_tt1', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-purple-600 dark:text-purple-400 font-medium">Gia Hạn L2</label>
                        <input
                          type="date"
                          value={curM.nt_tt2 || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'nt_tt2', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-amber-600 dark:text-amber-400 font-medium">Ngày Trình HS</label>
                        <input
                          type="date"
                          value={curM.ngayTrinh || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'ngayTrinh', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Ngày Ký HS</label>
                        <input
                          type="date"
                          value={curM.ngayKy || ''}
                          onChange={(e) => handleMilestoneChange(def.key, 'ngayKy', e.target.value)}
                          className="w-full p-1 text-[11px] border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 rounded font-mono font-bold text-emerald-900 dark:text-emerald-200"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHẦN 5: KHAI BÁO CÁN BỘ NHẬP LIỆU BAN CHỈ HUY */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                  PHẦN 5
                </span>
                <h4 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-700" /> Khai Báo Ban Chỉ Huy Công Trình Nhập Liệu
                </h4>
              </div>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700">
                Bắt buộc khai báo danh tính
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Họ và Tên Cán Bộ *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Bình"
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Chức Vụ *
                </label>
                <input
                  type="text"
                  required
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="VD: Chỉ Huy Trưởng / Kỹ Sư QCQS"
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Email Công Việc *
                </label>
                <input
                  type="email"
                  required
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="VD: nguyenvanbinh@buildcost.vn"
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 font-mono font-medium text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú Ban Chỉ Huy & QCQS
            </label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Nhập tình hình thi công, vướng mắc pháp lý hoặc lý do chậm ký..."
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{project ? 'Cập Nhật Hợp Đồng' : 'Lưu Hợp Đồng Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
