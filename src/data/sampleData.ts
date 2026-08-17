import { Project, ProjectMilestones, MilestoneKey, CostGroup, PaymentBatch } from '../types';

export const MAJOR_PROJECTS = [
  'Khu đô thị sinh thái Bắc Sông Hồng',
  'Khu phức hợp thương mại - dịch vụ Nam Hà Nội',
  'Khu đô thị mới Tây Hồ Tây mở rộng',
  'Khu công nghiệp và đô thị logistics Đông Bắc',
  'Khu đô thị ven biển Hải Phòng',
];

export const INVESTORS = [
  'Tập đoàn Vingroup - CTCP',
  'Tập đoàn Sun Group',
  'Masterise Homes (Tập đoàn Masterise)',
  'Tập đoàn Novaland',
  'Tổng Công ty Viglacera - CTCP',
  'Tập đoàn BRG Group',
  'Becamex IDC',
  'Tập đoàn Đất Xanh',
  'Khang Điền Group',
  'Tập đoàn Nam Long',
];

export const PROVINCES_63 = [
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cần Thơ',
  'Cao Bằng',
  'Đà Nẵng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Nội',
  'Hà Tĩnh',
  'Hải Dương',
  'Hải Phòng',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'TP. Hồ Chí Minh',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
];

export const PROVINCES = PROVINCES_63;

export const SUPERVISION_CONSULTANTS = [
  'Công ty CP Tư vấn Công nghệ, Thiết bị và Kiểm định Xây dựng - CONINCO',
  'Công ty TNHH APAVE Châu Á - Thái Bình Dương',
  'Tập đoàn Tư vấn Giám sát Artelia Việt Nam',
  'Công ty CP Tư vấn Xây dựng Công trình Vật liệu Xây dựng - CCBM',
  'Công ty CP Texo Tư vấn và Đầu tư',
  'Công ty TNHH Meinhardt Việt Nam',
  'Công ty TNHH Bureau Veritas Việt Nam',
  'Công ty CP Tư vấn Đầu tư & Xây dựng CDC',
  'Trung tâm SCQC Kiểm định & Giám sát Xây dựng',
  'Tổng Công ty Tư vấn Xây dựng Việt Nam - VNCC',
  'Công ty CP Tư vấn Xây dựng Nagecco',
];

export const CONTRACTORS = [
  'Công ty TNHH Minh Long MEP',
  'Công ty CP Hạ tầng Nam Việt',
  'Công ty CP Cơ điện Searefico',
  'Tập đoàn Xây dựng Hòa Bình',
  'Công ty CP Hawee Cơ điện',
  'Công ty CP Cơ điện REE',
  'Công ty TNHH Đầu tư & Xây dựng Coteccons',
  'Công ty CP Xây dựng Phục Hưng Holdings',
  'Công ty TNHH Kỹ thuật Sigma',
  'Công ty CP Kỹ thuật Nam Á ME',
  'Công ty CP Thiết bị & Dịch vụ Đồng Tâm',
  'Công ty CP Tư vấn Đầu tư & Xây dựng CDC',
];

export const DEFAULT_COST_GROUPS = [
  'Phần Xây dựng',
  'Phần Công nghệ',
  'Phần Pháp lý',
  'Phần Vận hành',
];

export const COST_GROUPS: CostGroup[] = [
  'Phần Xây dựng',
  'Phần Công nghệ',
  'Phần Pháp lý',
  'Phần Vận hành',
  'Xây dựng – Thiết bị',
  'Tư vấn',
  'Chi phí QLDA',
  'Chi phí khác',
  'Lãi vay',
  'Lắp đặt ME-CK',
];

export const SAMPLE_PROJECT_NAMES = [
  'Chung Cư High-Rise Sky Villa',
  'Nhà Máy Điện Tử Technic Sol',
  'Trung Tâm Thương Mại MegaMall',
  'Bệnh Viện Đa Khoa Quốc Tế',
  'Trường Đại Học Bách Khoa Cơ Sở 2',
  'Khu Đô Thị Xanh Ecopark',
  'Khách Sạn 5 Sao Resort & Spa',
  'Cảng Hàng Không Quốc Tế',
  'Tòa Nhà Văn Phòng Central Tower',
  'Nhà Máy Chế Biến Thực Phẩm',
  'Khu Công Nghiệp VSIP Phase 3',
  'Tháp Đôi Landmark 81 ME-CK',
  'Khu Căn Hộ Cao Cấp Sunrise Plaza',
  'Trung Tâm Dữ Liệu Data Center Tier 3',
  'Nhà Máy Dược Phẩm GMP-WHO',
  'Cụm Trường Học Liên Cấp Quốc Tế',
];

export function generate52SampleProjects(): Project[] {
  const list: Project[] = [];
  const projectNames = SAMPLE_PROJECT_NAMES;

  const milestoneKeys: MilestoneKey[] = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

  // Base financial distribution weights
  const baseValues = [
    91120000000, 146300000000, 215400000000, 84200000000, 320500000000,
    185600000000, 412000000000, 98700000000, 520000000000, 145000000000,
    275000000000, 360000000000, 195000000000, 480000000000, 89000000000,
  ];

  for (let i = 1; i <= 52; i++) {
    const code = `CT-${String(i).padStart(3, '0')}`;
    const name = `${projectNames[(i - 1) % projectNames.length]} - Giai Đoạn ${Math.ceil(i / 4)}`;
    const yearCode = i <= 20 ? '2025' : '2026';
    const hdNo = `HĐ-01-${String(i).padStart(3, '0')}/${yearCode}`;

    const parentProject = MAJOR_PROJECTS[(i - 1) % MAJOR_PROJECTS.length];
    const investor = INVESTORS[(i - 1) % INVESTORS.length];
    const province = PROVINCES[(i - 1) % PROVINCES.length];
    const contractor = CONTRACTORS[(i - 1) % CONTRACTORS.length];
    const costGroup = COST_GROUPS[(i - 1) % COST_GROUPS.length];

    // Contract value calculation
    const rawVal = baseValues[(i - 1) % baseValues.length] * (1 + (i % 5) * 0.15);
    const giaTriSauVat = Math.round(rawVal);
    const giaTriHdTruocVat = Math.round(giaTriSauVat / 1.1);
    const vatAmount = giaTriSauVat - giaTriHdTruocVat;

    // Disbursed ratio (between 25% and 85%)
    let disburseRate = 0.462;
    if (i % 7 === 0) disburseRate = 1.0; // Completed / Liquidated
    else if (i % 3 === 0) disburseRate = 0.65;
    else if (i % 2 === 0) disburseRate = 0.38;
    else disburseRate = 0.52;

    const luyKeDaChi = Math.round(giaTriSauVat * disburseRate);
    const chiTraTrongKy = Math.round(luyKeDaChi * 0.7);
    const conLaiChuaChi = giaTriSauVat - luyKeDaChi;

    const monthHd = ((i - 1) % 4) + 1;
    const dateHd = `2026-${String(monthHd).padStart(2, '0')}-10`;
    const dateTdHd = `2026-${String(Math.min(monthHd + 6, 12)).padStart(2, '0')}-30`;
    const dateTdTgd = `2026-${String(Math.min(monthHd + 5, 12)).padStart(2, '0')}-25`;

    const isLateTgd = i % 6 === 0;
    const dateTdTt = isLateTgd
      ? `2026-${String(Math.min(monthHd + 7, 12)).padStart(2, '0')}-15`
      : dateTdTgd;

    const mObj = {} as ProjectMilestones;
    const paymentBatches: PaymentBatch[] = [];

    // Milestone calculation
    milestoneKeys.forEach((mKey, idx) => {
      const baseDay = (i * 3 + idx * 4) % 28 + 1;
      const monthNum = idx < 4 ? 7 : 8;
      const monthStr = String(monthNum).padStart(2, '0');

      const ntHd = `2026-${monthStr}-01`;
      const ntTgd = `2026-${monthStr}-05`;
      const ntTt1 = `2026-${monthStr}-08`;
      const ntTt2 = i % 4 === 0 && idx === 1 ? `2026-${monthStr}-15` : '';
      const ntTt3 = '';

      const trinhDay = Math.max(1, (baseDay + idx) % 28);
      const trinhMonth = idx <= 2 ? 7 : trinhDay > 15 ? 7 : 8;
      let trinh = `2026-${String(trinhMonth).padStart(2, '0')}-${String(trinhDay).padStart(2, '0')}`;

      let ky = '';
      if (idx < 2 || (i % 3 === 0 && idx < 5)) {
        const kyDay = Math.min(28, trinhDay + 4);
        ky = `2026-${String(trinhMonth).padStart(2, '0')}-${String(kyDay).padStart(2, '0')}`;
      }

      // Bottlenecks for demonstration
      if ((i % 4 === 0 && idx === 3) || (i % 3 === 0 && idx === 5)) {
        trinh = '2026-07-20';
        ky = '';
      }

      if (i % 7 === 0) {
        const cDay = Math.min(28, 5 + idx * 3);
        trinh = `2026-07-${String(cDay).padStart(2, '0')}`;
        ky = `2026-07-${String(Math.min(28, cDay + 3)).padStart(2, '0')}`;
      }

      mObj[mKey] = {
        nt_hd: ntHd,
        nt_tgd: ntTgd,
        nt_tt1: ntTt1,
        nt_tt2: ntTt2,
        nt_tt3: ntTt3,
        ngayTrinh: trinh,
        ngayKy: ky,
      };

      // Generate payment batch corresponding to milestone
      if (idx <= 4) {
        const batchAmount = Math.round(giaTriSauVat * (idx === 0 ? 0.2 : 0.15));
        const isPaid = !!ky || (idx === 0 && i % 2 === 0);
        paymentBatches.push({
          id: `batch_${i}_${idx + 1}`,
          dotSo: idx + 1,
          tenDot:
            idx === 0
              ? 'Tạm ứng hợp đồng'
              : idx === 1
              ? 'Đợt 1 - XD Phần thô'
              : idx === 2
              ? 'Đợt 2 - ME Tập kết TB'
              : idx === 3
              ? 'Đợt 3 - Hoàn thành xây lắp'
              : 'Đợt 4 - Vận hành T&C',
          ngayDeNghi: trinh || `2026-07-15`,
          ngayDuyetChi: isPaid ? ky || `2026-07-22` : undefined,
          giaTriTruocVat: Math.round(batchAmount / 1.1),
          vatRate: 0.1,
          giaTriSauVat: batchAmount,
          giaTriGiuLaiBaoHanh: Math.round(batchAmount * 0.05),
          giaTriThucNhan: Math.round(batchAmount * 0.95),
          trangThai: isPaid ? 'DA_CHI' : trinh ? 'DANG_TRINH' : 'CHUA_CHI',
        });
      }
    });

    let note = 'Tiến độ bình thường, hồ sơ ME-CK đầy đủ';
    if (i % 4 === 0) note = 'Vướng mặt bằng hệ HVAC, đã xin gia hạn NT Lần 2';
    if (i % 5 === 0) note = '🚨 Chờ Chuyển nhượng PCCC & Giám định nghiệm thu hạng mục điện nặng';
    if (i % 7 === 0) note = 'Đã hoàn tất nghiệm thu thanh lý hợp đồng & quyết toán';

    list.push({
      id: `sample_${i}`,
      soHopDong: hdNo,
      maCongTrinh: code,
      tenCongTrinh: name,
      duAn: parentProject,
      chuDauTu: investor,
      diaPhuong: province,
      nhaThau: contractor,
      nhomChiPhi: costGroup,
      giaTriHdSauVat: giaTriSauVat,
      giaTriHdTruocVat,
      vatAmount,
      luyKeDaChi,
      chiTraTrongKy,
      conLaiChuaChi,
      soDotThanhToan: paymentBatches.length,
      paymentBatches,
      ngayHopDong: dateHd,
      tienDoHopDong: dateTdHd,
      tienDoTgdDuyet: dateTdTgd,
      tienDoThucTe: dateTdTt,
      milestones: mObj,
      ghiChu: note,
      updatedBy: `BCH ${code}`,
      updatedAt: new Date().toISOString(),
    });
  }

  return list;
}
