/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PersonnelProfile,
  CCCDRecord,
  RankHistory,
  PositionHistory,
  UnitHistory,
  NghiepVuRecord,
  ChuyenMonRecord,
  LyLuanRecord,
  BoiDuongRecord
} from './types';

/**
 * Parses a date string and returns a timestamp for comparison.
 * Handles different formats gracefully, assuming YYYY-MM-DD format primarily.
 */
export function getTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  return new Date(dateStr).getTime();
}

/**
 * Formats a YYYY-MM-DD date string to Vietnamese dd/mm/yyyy format
 */
export function formatViDate(dateStr: string | undefined): string {
  if (!dateStr) return '---';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Gets the rank hierarchy score for professional & academic degrees
 */
export function getDegreeScore(degree: string): number {
  switch (degree) {
    case 'Tiến sĩ': return 5;
    case 'Thạc sĩ': return 4;
    case 'Đại học': return 3;
    case 'Cao đẳng': return 2;
    case 'Trung cấp': return 1;
    default: return 0;
  }
}

/**
 * Gets rank hierarchy score
 * Smallest to largest: Thiếu uý < Trung uý < Thượng uý < Đại uý < Thiếu tá < Trung tá < Thượng tá < Đại tá
 */
export function getRankScore(rank: string): number {
  const norm = rank.trim().toLowerCase();
  if (norm.includes('đại tá')) return 8;
  if (norm.includes('thượng tá')) return 7;
  if (norm.includes('trung tá')) return 6;
  if (norm.includes('thiếu tá')) return 5;
  if (norm.includes('đại úy') || norm.includes('đại uý')) return 4;
  if (norm.includes('thượng úy') || norm.includes('thượng uý')) return 3;
  if (norm.includes('trung úy') || norm.includes('trung uý')) return 2;
  if (norm.includes('thiếu úy') || norm.includes('thiếu uý')) return 1;
  return 0;
}

/**
 * Gets position hierarchy score
 * Smallest to largest: Phó Đội trưởng < Đội trưởng < Phó Trưởng phòng < Trưởng Phòng
 */
export function getPositionScore(position: string): number {
  const norm = position.trim().toLowerCase();
  if (norm.includes('trưởng phòng') && !norm.includes('phó')) return 4;
  if (norm.includes('phó trưởng phòng') || norm.includes('phó trưởng phòng')) return 3;
  if (norm.includes('đội trưởng') && !norm.includes('phó')) return 2;
  if (norm.includes('phó đội trưởng')) return 1;
  return 0;
}

/**
 * Gets political theory level score
 */
export function getLyLuanLevelScore(level: string): number {
  switch (level) {
    case 'Cao cấp': return 3;
    case 'Trung cấp': return 2;
    case 'Sơ cấp': return 1;
    default: return 0;
  }
}

/**
 * Gets political theory diploma type score
 */
export function getLyLuanTypeScore(type: string): number {
  switch (type) {
    case 'Bằng': return 3;
    case 'Chứng nhận': return 2;
    case 'Chứng chỉ': return 1;
    default: return 0;
  }
}

/**
 * Extract snapshot of a Personnel Profile at a target date.
 */
export interface SnapshotProfile {
  id: string;
  fullName: string;
  gender: string;
  dob: string;
  hometown: string;
  ethnicity: string;
  religion: string;
  phone: string;
  
  // CAND details
  securityId: string;
  entryDate: string;
  
  // Latest values as of targetDate
  cccd: CCCDRecord | null;
  rank: RankHistory | null;
  position: PositionHistory | null;
  unit: UnitHistory | null;
  
  // Party status on targetDate
  hasDang: boolean;
  dangEntryDate?: string;
  dangOfficialDate?: string;
  dangCardId?: string;
  dangCardIssueDate?: string;
  dangCardIssuePlace?: string;
  
  // Training and capacity building filtered by hierarchy on targetDate
  nghiepVu: NghiepVuRecord[];
  chuyenMon: ChuyenMonRecord[];
  lyLuan: LyLuanRecord[];
  boiDuong: BoiDuongRecord[];
}

export function extractProfileSnapshot(profile: PersonnelProfile, targetDate: string): SnapshotProfile {
  const targetTime = new Date(targetDate).getTime();

  // 1. Personal Fixed & CCCD History (latest cccd <= targetDate)
  const validCccd = profile.personal.cccdHistory
    .filter(c => new Date(c.date).getTime() <= targetTime)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const activeCccd = validCccd.length > 0 ? validCccd[0] : null;

  // 2. Public Security (CAND) Info
  const validRanks = profile.cand.rankHistory
    .filter(r => new Date(r.date).getTime() <= targetTime)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeRank = validRanks.length > 0 ? validRanks[0] : null;

  const validPositions = profile.cand.positionHistory
    .filter(p => new Date(p.date).getTime() <= targetTime)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activePosition = validPositions.length > 0 ? validPositions[0] : null;

  const validUnits = profile.cand.unitHistory
    .filter(u => new Date(u.date).getTime() <= targetTime)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeUnit = validUnits.length > 0 ? validUnits[0] : null;

  // 3. Party Member Information (Check if member as of targetDate)
  let snapshotHasDang = false;
  let snapshotDangEntryDate: string | undefined = undefined;
  let snapshotDangOfficialDate: string | undefined = undefined;
  let snapshotDangCardId: string | undefined = undefined;
  let snapshotDangCardIssueDate: string | undefined = undefined;
  let snapshotDangCardIssuePlace: string | undefined = undefined;

  if (profile.dang.hasDang && profile.dang.entryDate) {
    const entryTime = new Date(profile.dang.entryDate).getTime();
    if (entryTime <= targetTime) {
      snapshotHasDang = true;
      snapshotDangEntryDate = profile.dang.entryDate;
      snapshotDangOfficialDate = profile.dang.officialDate;
      
      // Card issue details are also filtered if we want to be precise, or shown since membership is active
      if (profile.dang.cardIssueDate) {
        const cardIssueTime = new Date(profile.dang.cardIssueDate).getTime();
        if (cardIssueTime <= targetTime) {
          snapshotDangCardId = profile.dang.cardId;
          snapshotDangCardIssueDate = profile.dang.cardIssueDate;
          snapshotDangCardIssuePlace = profile.dang.cardIssuePlace;
        }
      }
    }
  }

  // 4. Education, Training & Capacity Building (Section D)

  // A. Professional Police (Nghiệp vụ CA)
  const validNghiepVu = profile.daoTao.nghiepVu.filter(
    item => new Date(item.dateOfIssue).getTime() <= targetTime
  );
  let filteredNghiepVu: NghiepVuRecord[] = [];
  if (validNghiepVu.length > 0) {
    const scores = validNghiepVu.map(item => getDegreeScore(item.degree));
    const maxScore = Math.max(...scores);
    filteredNghiepVu = validNghiepVu.filter(item => getDegreeScore(item.degree) === maxScore);
  }

  // B. Academic Specialist (Chuyên môn ngoài CA)
  const validChuyenMon = profile.daoTao.chuyenMon.filter(
    item => new Date(item.dateOfIssue).getTime() <= targetTime
  );
  let filteredChuyenMon: ChuyenMonRecord[] = [];
  if (validChuyenMon.length > 0) {
    const scores = validChuyenMon.map(item => getDegreeScore(item.degree));
    const maxScore = Math.max(...scores);
    filteredChuyenMon = validChuyenMon.filter(item => getDegreeScore(item.degree) === maxScore);
  }

  // C. Political Theory (Lý luận chính trị)
  // Rule: levelScore * 10 + typeScore. Sơ cấp < Trung cấp < Cao cấp, Bằng > Chứng nhận > Chứng chỉ
  const validLyLuan = profile.daoTao.lyLuan.filter(
    item => new Date(item.dateOfIssue).getTime() <= targetTime
  );
  let filteredLyLuan: LyLuanRecord[] = [];
  if (validLyLuan.length > 0) {
    const calculateScore = (item: LyLuanRecord) => {
      const levelScore = getLyLuanLevelScore(item.level);
      const typeScore = getLyLuanTypeScore(item.type);
      return levelScore * 10 + typeScore;
    };
    const scores = validLyLuan.map(calculateScore);
    const maxScore = Math.max(...scores);
    filteredLyLuan = validLyLuan.filter(item => calculateScore(item) === maxScore);
  }

  // D. Refresher / Capacity Building (Bồi dưỡng)
  // Rule: Keep all valid on or before targetDate
  const filteredBoiDuong = profile.daoTao.boiDuong.filter(
    item => new Date(item.dateOfIssue).getTime() <= targetTime
  );

  return {
    id: profile.id,
    fullName: profile.personal.fullName,
    gender: profile.personal.gender,
    dob: profile.personal.dob,
    hometown: profile.personal.hometown,
    ethnicity: profile.personal.ethnicity,
    religion: profile.personal.religion,
    phone: profile.personal.phone,
    securityId: profile.cand.securityId,
    entryDate: profile.cand.entryDate,
    cccd: activeCccd,
    rank: activeRank,
    position: activePosition,
    unit: activeUnit,
    hasDang: snapshotHasDang,
    dangEntryDate: snapshotDangEntryDate,
    dangOfficialDate: snapshotDangOfficialDate,
    dangCardId: snapshotDangCardId,
    dangCardIssueDate: snapshotDangCardIssueDate,
    dangCardIssuePlace: snapshotDangCardIssuePlace,
    nghiepVu: filteredNghiepVu,
    chuyenMon: filteredChuyenMon,
    lyLuan: filteredLyLuan,
    boiDuong: filteredBoiDuong,
  };
}
