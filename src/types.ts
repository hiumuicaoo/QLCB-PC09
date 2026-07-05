/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CCCDRecord {
  id: string;
  number: string;
  place: string;
  date: string; // YYYY-MM-DD
}

export interface BHYTRecord {
  id: string;
  cardNumber: string; // Số thẻ BHYT
  registrationPlace: string; // Nơi đăng ký KCBBĐ
  startDate: string; // Ngày hiệu lực, YYYY-MM-DD
  endDate: string; // Ngày hết hạn, YYYY-MM-DD
}

export interface RankHistory {
  id: string;
  rank: string; // Thiếu úy, Trung úy, Thượng úy, Đại úy, Thiếu tá, Trung tá, Thượng tá, Đại tá, v.v.
  date: string; // YYYY-MM-DD
}

export interface PositionHistory {
  id: string;
  position: string; // Chiến sĩ, Đội trưởng, Phó Đội trưởng, Trưởng phòng, Phó Trưởng phòng, v.v.
  date: string; // YYYY-MM-DD
}

export interface UnitHistory {
  id: string;
  unit: string; // Đơn vị công tác
  date: string; // YYYY-MM-DD
  action: 'Chuyển đến' | 'Chuyển đi';
  fromUnit?: string; // Chuyển đến từ
}

export interface StatusChangeRecord {
  id: string;
  type: 'activate' | 'deactivate';
  date: string; // YYYY-MM-DD
  location: string; // Nơi chuyển đi / Nơi chuyển đến
}

export interface ChucDanhRecord {
  id: string;
  ngach: 'Kỹ thuật viên' | 'Trinh sát viên' | 'Giám định viên';
  bac: 'Sơ cấp' | 'Trung cấp' | 'Cao cấp';
  action: 'Bổ nhiệm' | 'Chuyển ngạch' | 'Miễn nhiệm';
  date: string; // YYYY-MM-DD
}

export interface NghiepVuRecord {
  id: string;
  degree: 'Tiến sĩ' | 'Thạc sĩ' | 'Đại học' | 'Cao đẳng' | 'Trung cấp';
  school: string;
  major: string;
  diplomaNumber: string;
  dateOfIssue: string; // YYYY-MM-DD
  trainingForm: 'Tập trung' | 'Không tập trung' | 'Khác';
  imageUrl?: string;
  imageUploadedAt?: string;
}

export interface ChuyenMonRecord {
  id: string;
  degree: 'Tiến sĩ' | 'Thạc sĩ' | 'Đại học' | 'Cao đẳng' | 'Trung cấp';
  school: string;
  major: string;
  diplomaNumber: string;
  dateOfIssue: string; // YYYY-MM-DD
  trainingForm: 'Tập trung' | 'Không tập trung' | 'Khác';
  imageUrl?: string;
  imageUploadedAt?: string;
}

export interface LyLuanRecord {
  id: string;
  type: 'Bằng' | 'Chứng nhận' | 'Chứng chỉ' | 'Khác';
  diplomaNumber: string;
  dateOfIssue: string; // YYYY-MM-DD
  trainingForm: 'Tập trung' | 'Không tập trung' | 'Khác';
  level: 'Cao cấp' | 'Trung cấp' | 'Sơ cấp';
  facility: string; // Cơ sở đào tạo
  imageUrl?: string;
  imageUploadedAt?: string;
}

export interface BoiDuongRecord {
  id: string;
  diplomaNumber: string;
  dateOfIssue: string; // YYYY-MM-DD
  facility: string; // Cơ sở bồi dưỡng
  field: string; // Lĩnh vực bồi dưỡng
  imageUrl?: string;
  imageUploadedAt?: string;
}

export interface PersonalSection {
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string; // YYYY-MM-DD
  hometown: string;
  ethnicity: string;
  religion: string;
  phone: string;
  cccdHistory: CCCDRecord[]; // List of CCCD records over time
  bhytHistory?: BHYTRecord[]; // List of BHYT records over time
}

export interface CandSection {
  entryDate: string; // Ngày vào CAND, YYYY-MM-DD
  securityId: string; // Số hiệu CAND
  rankHistory: RankHistory[]; // Cấp bậc hàm theo thời gian
  positionHistory: PositionHistory[]; // Chức vụ theo thời gian
  unitHistory: UnitHistory[]; // Đơn vị theo thời gian
  chucDanhHistory?: ChucDanhRecord[]; // Chức danh theo thời gian (Ngạch/Bậc)
}

export interface DangSection {
  hasDang: boolean; // Có là Đảng viên hay không
  entryDate?: string; // Ngày vào Đảng, YYYY-MM-DD
  officialDate?: string; // Ngày chính thức, YYYY-MM-DD
  cardId?: string; // Số thẻ Đảng viên
  cardIssueDate?: string; // Ngày cấp thẻ Đảng viên, YYYY-MM-DD
  cardIssuePlace?: string; // Nơi cấp
}

export interface DaoTaoSection {
  nghiepVu: NghiepVuRecord[];
  chuyenMon: ChuyenMonRecord[];
  lyLuan: LyLuanRecord[];
  boiDuong: BoiDuongRecord[];
}

export interface PersonnelProfile {
  id: string;
  status?: 'active' | 'inactive';
  statusHistory?: StatusChangeRecord[];
  personal: PersonalSection;
  cand: CandSection;
  dang: DangSection;
  daoTao: DaoTaoSection;
  createdAt: string;
  updatedAt: string;
}
