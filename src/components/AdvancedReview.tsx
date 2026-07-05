/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PersonnelProfile, UnitHistory, NghiepVuRecord, ChuyenMonRecord, LyLuanRecord, BoiDuongRecord } from '../types';
import { formatViDate, getDegreeScore, getLyLuanLevelScore, getRankScore, getPositionScore } from '../utils';
import { useToast } from './Toast';
import { 
  Search, ShieldCheck, FileSpreadsheet, Award, Calendar, CheckCircle2, XCircle, AlertCircle, Plus, Trash2, 
  Settings, UserCheck, RefreshCw, Layers, Sparkles, Filter, ChevronRight, Check, Eye
} from 'lucide-react';

interface AdvancedReviewProps {
  personnel: PersonnelProfile[];
  onSelectPersonnel?: (profile: PersonnelProfile) => void;
}

interface Rule {
  id: string;
  field: 'fullName' | 'gender' | 'age' | 'dang' | 'dangAge' | 'rank' | 'position' | 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong' | 'tenure' | 'chucDanh';
  operator: 'contains' | 'equals' | 'gte' | 'lte' | 'has' | 'not_has';
  value: string;
}

interface MatchDetail {
  ruleId: string;
  fieldLabel: string;
  satisfied: boolean;
  message: string;
}

interface AuditResult {
  profile: PersonnelProfile;
  details: MatchDetail[];
  overallSatisfied: boolean;
}

export default function AdvancedReview({ personnel, onSelectPersonnel }: AdvancedReviewProps) {
  const { warning, error } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [matchType, setMatchType] = useState<'AND' | 'OR'>('AND');
  const [results, setResults] = useState<AuditResult[]>([]);
  const [isAudited, setIsAudited] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  // Helper: Calculate current age from DOB
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date('2026-06-29'); // Using current system context date
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper: Calculate years since a date string (used for Tuổi ngành, Tuổi Đảng)
  const calculateYearsSince = (dateStr: string | undefined): number => {
    if (!dateStr) return 0;
    const startDate = new Date(dateStr);
    const today = new Date('2026-06-29'); // Using current system context date
    let years = today.getFullYear() - startDate.getFullYear();
    const m = today.getMonth() - startDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < startDate.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  // Helper: Calculate PC09 tenure based on the most recent continuous period of service
  const calculatePC09Tenure = (profile: PersonnelProfile): { days: number; years: number; months: number; text: string; earliestDate: string } => {
    const history = [...(profile.cand.unitHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (history.length === 0) {
      return { days: 0, years: 0, months: 0, text: 'Chưa có lịch sử chuyển đơn vị', earliestDate: '---' };
    }

    interface PC09Interval {
      start: Date;
      startDateString: string;
      end: Date | null;
    }

    const intervals: PC09Interval[] = [];
    let currentInterval: PC09Interval | null = null;

    for (const record of history) {
      const isPC09 = record.unit.toLowerCase().includes('pc09');
      const isChuyenDen = record.action === 'Chuyển đến';
      const isChuyenDi = record.action === 'Chuyển đi';

      if (isPC09 && isChuyenDen) {
        if (!currentInterval) {
          currentInterval = {
            start: new Date(record.date),
            startDateString: record.date,
            end: null
          };
          intervals.push(currentInterval);
        }
      } else if (isChuyenDi || (!isPC09 && isChuyenDen)) {
        if (currentInterval) {
          currentInterval.end = new Date(record.date);
          currentInterval = null;
        }
      }
    }

    let totalDays = 0;
    let earliestDate = '---';

    if (intervals.length > 0) {
      const lastInterval = intervals[intervals.length - 1];
      earliestDate = lastInterval.startDateString;
      let end = lastInterval.end;
      if (!end) {
        end = new Date('2026-06-29');
      }
      const diffTime = Math.max(0, end.getTime() - lastInterval.start.getTime());
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const years = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;
    const months = Math.floor(remainingDays / 30.42);
    const days = Math.floor(remainingDays % 30.42);

    let text = '';
    if (years > 0) text += `${years} năm `;
    if (months > 0) text += `${months} tháng `;
    if (days > 0 || text === '') text += `${days} ngày`;

    return { 
      days: totalDays, 
      years, 
      months: years * 12 + months, 
      text: text.trim(),
      earliestDate
    };
  };

  // Preset Template 1: Đại học CAND + Đại học ngành ngoài
  const applyPresetDualDegrees = () => {
    setMatchType('AND');
    setRules([
      {
        id: 'r_dual_1',
        field: 'nghiepVu',
        operator: 'has',
        value: 'Đại học'
      },
      {
        id: 'r_dual_2',
        field: 'chuyenMon',
        operator: 'has',
        value: 'Đại học'
      }
    ]);
    setIsAudited(false);
  };

  // Preset Template 2: Giám định tài liệu + 3 năm công tác PC09
  const applyPresetCertificateAndTenure = () => {
    setMatchType('AND');
    setRules([
      {
        id: 'r_cert_1',
        field: 'boiDuong',
        operator: 'contains',
        value: 'Giám định tài liệu'
      },
      {
        id: 'r_cert_2',
        field: 'tenure',
        operator: 'gte',
        value: '3'
      }
    ]);
    setIsAudited(false);
  };

  // Preset Template 3: Đảng viên + Lý luận chính trị từ Trung cấp trở lên
  const applyPresetPartyAndPoliticalTheory = () => {
    setMatchType('AND');
    setRules([
      {
        id: 'r_party_1',
        field: 'dang',
        operator: 'equals',
        value: 'có'
      },
      {
        id: 'r_party_2',
        field: 'lyLuan',
        operator: 'has',
        value: 'Trung cấp' // Filters for >= Intermediate
      }
    ]);
    setIsAudited(false);
  };

  // Add custom blank rule
  const handleAddRule = () => {
    const newRule: Rule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      field: 'fullName',
      operator: 'contains',
      value: ''
    };
    setRules([...rules, newRule]);
    setIsAudited(false);
  };

  // Remove rule
  const handleRemoveRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setIsAudited(false);
  };

  // Handle rule fields changes
  const handleRuleChange = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(r => {
      if (r.id === id) {
        const updated = { ...r, ...updates };
        // Clean default operators depending on the field
        if (updates.field) {
          if (['fullName', 'boiDuong'].includes(updates.field)) {
            updated.operator = 'contains';
            updated.value = '';
          } else if (['gender', 'dang', 'chucDanh'].includes(updates.field)) {
            updated.operator = 'equals';
            updated.value = updates.field === 'gender' ? 'Nam' : updates.field === 'dang' ? 'có' : 'Giám định viên (Tất cả)';
          } else if (['age', 'dangAge', 'tenure'].includes(updates.field)) {
            updated.operator = 'gte';
            updated.value = updates.field === 'age' ? '5' : updates.field === 'dangAge' ? '3' : '3';
          } else if (['nghiepVu', 'chuyenMon'].includes(updates.field)) {
            updated.operator = 'has';
            updated.value = 'Đại học';
          } else if (updates.field === 'lyLuan') {
            updated.operator = 'has';
            updated.value = 'Trung cấp';
          } else if (updates.field === 'rank') {
            updated.operator = 'has';
            updated.value = 'Đại úy';
          } else if (updates.field === 'position') {
            updated.operator = 'has';
            updated.value = 'Đội trưởng';
          }
        }
        return updated;
      }
      return r;
    }));
    setIsAudited(false);
  };

  // Default initial rules on mount
  useEffect(() => {
    applyPresetDualDegrees();
  }, []);

  // Evaluate single rule on a profile
  const evaluateRule = (profile: PersonnelProfile, rule: Rule): MatchDetail => {
    const { field, operator, value } = rule;
    let satisfied = false;
    let message = '';
    let fieldLabel = '';

    switch (field) {
      case 'fullName':
        fieldLabel = 'Họ và tên';
        const name = profile.personal.fullName || '';
        satisfied = name.toLowerCase().includes(value.toLowerCase());
        message = satisfied 
          ? `Họ tên chứa từ khóa "${value}" (Khớp thực tế: "${name}")` 
          : `Họ tên "${name}" không chứa từ khóa "${value}"`;
        break;

      case 'gender':
        fieldLabel = 'Giới tính';
        const gender = profile.personal.gender || 'Nam';
        satisfied = gender.toLowerCase() === value.toLowerCase();
        message = satisfied 
          ? `Giới tính khớp chính xác là "${gender}"` 
          : `Giới tính thực tế là "${gender}" (Yêu cầu: "${value}")`;
        break;

      case 'age':
        fieldLabel = 'Tuổi ngành';
        const age = calculateYearsSince(profile.cand.entryDate);
        const reqAge = parseInt(value, 10) || 0;
        if (operator === 'gte') {
          satisfied = age >= reqAge;
          message = satisfied 
            ? `Tuổi ngành đạt ${age} năm, lớn hơn hoặc bằng mức yêu cầu ${reqAge} năm (Ngày vào ngành: ${formatViDate(profile.cand.entryDate)})`
            : `Tuổi ngành chỉ đạt ${age} năm, chưa đủ mức yêu cầu từ ${reqAge} năm (Ngày vào ngành: ${formatViDate(profile.cand.entryDate)})`;
        } else {
          satisfied = age <= reqAge;
          message = satisfied 
            ? `Tuổi ngành đạt ${age} năm, nhỏ hơn hoặc bằng mức yêu cầu ${reqAge} năm (Ngày vào ngành: ${formatViDate(profile.cand.entryDate)})`
            : `Tuổi ngành là ${age} năm, vượt quá hạn mức tối đa ${reqAge} năm (Ngày vào ngành: ${formatViDate(profile.cand.entryDate)})`;
        }
        break;

      case 'dangAge':
        fieldLabel = 'Tuổi Đảng';
        const hasDangForAge = profile.dang.hasDang && profile.dang.entryDate;
        const dangAge = hasDangForAge ? calculateYearsSince(profile.dang.entryDate) : 0;
        const reqDangAge = parseInt(value, 10) || 0;
        if (!hasDangForAge) {
          satisfied = false;
          message = `Không phải là Đảng viên (Tuổi Đảng = 0 năm, yêu cầu: ${reqDangAge} năm)`;
        } else if (operator === 'gte') {
          satisfied = dangAge >= reqDangAge;
          message = satisfied 
            ? `Tuổi Đảng đạt ${dangAge} năm, lớn hơn hoặc bằng mức yêu cầu ${reqDangAge} năm (Ngày vào Đảng: ${formatViDate(profile.dang.entryDate)})`
            : `Tuổi Đảng chỉ đạt ${dangAge} năm, chưa đủ mức yêu cầu từ ${reqDangAge} năm (Ngày vào Đảng: ${formatViDate(profile.dang.entryDate)})`;
        } else {
          satisfied = dangAge <= reqDangAge;
          message = satisfied 
            ? `Tuổi Đảng đạt ${dangAge} năm, nhỏ hơn hoặc bằng mức yêu cầu ${reqDangAge} năm (Ngày vào Đảng: ${formatViDate(profile.dang.entryDate)})`
            : `Tuổi Đảng là ${dangAge} năm, vượt quá hạn mức tối đa ${reqDangAge} năm (Ngày vào Đảng: ${formatViDate(profile.dang.entryDate)})`;
        }
        break;

      case 'dang':
        fieldLabel = 'Đảng viên';
        const isDang = profile.dang.hasDang;
        const wantDang = value === 'có';
        satisfied = isDang === wantDang;
        if (satisfied) {
          message = isDang 
            ? `Đã đứng vào hàng ngũ của Đảng (Ngày kết nạp: ${formatViDate(profile.dang.entryDate)})` 
            : 'Cán bộ chưa vào Đảng (Đúng theo yêu cầu)';
        } else {
          message = isDang 
            ? 'Cán bộ đã vào Đảng (Yêu cầu tìm quần chúng chưa vào Đảng)' 
            : 'Cán bộ chưa đứng vào hàng ngũ của Đảng';
        }
        break;

      case 'chucDanh':
        fieldLabel = 'Chức danh';
        const sortedChucDanh = profile.cand.chucDanhHistory && profile.cand.chucDanhHistory.length > 0
          ? [...profile.cand.chucDanhHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          : [];
        const activeChucDanh = sortedChucDanh.length > 0 ? sortedChucDanh[0] : null;
        const currentNgach = activeChucDanh && activeChucDanh.action !== 'Miễn nhiệm' ? activeChucDanh.ngach : 'Chưa bổ nhiệm';
        const currentBac = activeChucDanh && activeChucDanh.action !== 'Miễn nhiệm' ? activeChucDanh.bac : '';
        const currentFull = currentBac ? `${currentNgach} - ${currentBac}` : currentNgach;
        
        if (value === 'Chưa bổ nhiệm') {
          satisfied = currentNgach === 'Chưa bổ nhiệm';
          message = satisfied
            ? 'Cán bộ chưa được bổ nhiệm chức danh nào (Đúng yêu cầu)'
            : `Cán bộ hiện có chức danh "${currentFull}" (Yêu cầu tìm người chưa bổ nhiệm)`;
        } else if (value.startsWith('Bậc ')) {
          // Match by level regardless of ngach, e.g. "Bậc Sơ cấp (Tất cả ngạch)"
          const targetBac = value.replace('Bậc ', '').replace(' (Tất cả ngạch)', '');
          satisfied = activeChucDanh && activeChucDanh.action !== 'Miễn nhiệm' && activeChucDanh.bac.toLowerCase() === targetBac.toLowerCase();
          message = satisfied 
            ? `Chức danh hiện tại là "${currentFull}" (Đạt yêu cầu bậc "${targetBac}")` 
            : `Chức danh hiện tại là "${currentFull}" (Yêu cầu bậc: "${targetBac}")`;
        } else if (value.includes(' - ')) {
          // Specific combination, e.g. "Giám định viên - Trung cấp"
          satisfied = activeChucDanh && activeChucDanh.action !== 'Miễn nhiệm' && `${activeChucDanh.ngach} - ${activeChucDanh.bac}`.toLowerCase() === value.toLowerCase();
          message = satisfied 
            ? `Chức danh hiện tại là "${currentFull}" (Khớp chính xác yêu cầu)` 
            : `Chức danh hiện tại là "${currentFull}" (Yêu cầu chính xác: "${value}")`;
        } else if (value.includes(' (Tất cả)')) {
          const targetNgach = value.replace(' (Tất cả)', '');
          satisfied = activeChucDanh && activeChucDanh.action !== 'Miễn nhiệm' && activeChucDanh.ngach.toLowerCase() === targetNgach.toLowerCase();
          message = satisfied 
            ? `Chức danh hiện tại là "${currentFull}" (Đạt yêu cầu ngạch "${targetNgach}")` 
            : `Chức danh hiện tại là "${currentFull}" (Yêu cầu ngạch: "${targetNgach}")`;
        } else {
          // Fallback
          satisfied = currentNgach.toLowerCase() === value.toLowerCase();
          message = satisfied 
            ? `Chức danh hiện tại là "${currentNgach}" (Khớp chính xác yêu cầu)` 
            : `Chức danh hiện tại là "${currentNgach}" (Yêu cầu: "${value}")`;
        }
        break;

      case 'rank':
        fieldLabel = 'Quân hàm hiện tại';
        const activeRank = profile.cand.rankHistory && profile.cand.rankHistory.length > 0 
          ? [...profile.cand.rankHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank 
          : 'Chưa phong cấp';
        
        if (operator === 'has') {
          satisfied = getRankScore(activeRank) >= getRankScore(value);
          message = satisfied 
            ? `Cấp bậc hàm hiện tại là "${activeRank}" (Đạt yêu cầu từ mức "${value}" trở lên)` 
            : `Cấp bậc hàm hiện tại là "${activeRank}" (Chưa đạt mức yêu cầu từ "${value}" trở lên)`;
        } else {
          // operator === 'equals'
          satisfied = getRankScore(activeRank) === getRankScore(value);
          message = satisfied 
            ? `Cấp bậc hàm hiện tại là "${activeRank}" (Khớp chính xác yêu cầu)` 
            : `Cấp bậc hàm hiện tại là "${activeRank}" (Yêu cầu chính xác: "${value}")`;
        }
        break;

      case 'position':
        fieldLabel = 'Chức vụ hiện tại';
        const activePosition = profile.cand.positionHistory && profile.cand.positionHistory.length > 0 
          ? [...profile.cand.positionHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position 
          : 'Chiến sĩ';

        if (operator === 'has') {
          satisfied = getPositionScore(activePosition) >= getPositionScore(value);
          message = satisfied 
            ? `Chức vụ hiện tại là "${activePosition}" (Đạt yêu cầu từ mức "${value}" trở lên)` 
            : `Chức vụ hiện tại là "${activePosition}" (Chưa đạt mức yêu cầu từ "${value}" trở lên)`;
        } else {
          // operator === 'equals'
          satisfied = getPositionScore(activePosition) === getPositionScore(value);
          message = satisfied 
            ? `Chức vụ hiện tại là "${activePosition}" (Khớp chính xác yêu cầu)` 
            : `Chức vụ hiện tại là "${activePosition}" (Yêu cầu chính xác: "${value}")`;
        }
        break;

      case 'nghiepVu':
        fieldLabel = 'Bằng cấp CAND';
        const hasNghiepVuDegree = profile.daoTao.nghiepVu && profile.daoTao.nghiepVu.length > 0;
        if (operator === 'has') {
          const reqScore = getDegreeScore(value);
          const matchingDegrees = profile.daoTao.nghiepVu.filter(nv => getDegreeScore(nv.degree) >= reqScore);
          satisfied = matchingDegrees.length > 0;
          if (satisfied) {
            const best = matchingDegrees.sort((a,b) => getDegreeScore(b.degree) - getDegreeScore(a.degree))[0];
            message = `Sở hữu bằng cấp CAND: ${best.degree} chuyên ngành "${best.major}" tại "${best.school}" (Cấp ngày ${formatViDate(best.dateOfIssue)}) - Đạt yêu cầu từ trình độ "${value}" trở lên`;
          } else {
            message = hasNghiepVuDegree 
              ? `Chưa có bằng nghiệp vụ CAND trình độ từ "${value}" trở lên (Bằng cao nhất hiện tại: ${profile.daoTao.nghiepVu.sort((a,b) => getDegreeScore(b.degree) - getDegreeScore(a.degree))[0].degree})` 
              : 'Chưa khai báo bằng cấp đào tạo nghiệp vụ CAND';
          }
        } else {
          // not_has
          const reqScore = getDegreeScore(value);
          const matchingDegrees = profile.daoTao.nghiepVu.filter(nv => getDegreeScore(nv.degree) >= reqScore);
          satisfied = matchingDegrees.length === 0;
          message = satisfied 
            ? `Cán bộ không sở hữu bằng nghiệp vụ CAND từ mức "${value}" trở lên` 
            : `Cán bộ đã sở hữu bằng nghiệp vụ CAND từ mức "${value}" trở lên (Phát hiện bằng ${matchingDegrees[0].degree})`;
        }
        break;

      case 'chuyenMon':
        fieldLabel = 'Bằng chuyên môn ngành ngoài';
        const hasChuyenMonDegree = profile.daoTao.chuyenMon && profile.daoTao.chuyenMon.length > 0;
        if (operator === 'has') {
          const reqScore = getDegreeScore(value);
          const matchingCM = profile.daoTao.chuyenMon.filter(cm => getDegreeScore(cm.degree) >= reqScore);
          satisfied = matchingCM.length > 0;
          if (satisfied) {
            const best = matchingCM.sort((a,b) => getDegreeScore(b.degree) - getDegreeScore(a.degree))[0];
            message = `Sở hữu bằng chuyên môn ngành ngoài: ${best.degree} chuyên ngành "${best.major}" tại "${best.school}" (Cấp ngày ${formatViDate(best.dateOfIssue)}) - Đạt yêu cầu từ trình độ "${value}" trở lên`;
          } else {
            message = hasChuyenMonDegree 
              ? `Chưa có bằng ngành ngoài trình độ từ "${value}" trở lên (Bằng cao nhất hiện tại: ${profile.daoTao.chuyenMon.sort((a,b) => getDegreeScore(b.degree) - getDegreeScore(a.degree))[0].degree})` 
              : 'Chưa khai báo bằng cấp đào tạo chuyên môn ngành ngoài';
          }
        } else {
          // not_has
          const reqScore = getDegreeScore(value);
          const matchingCM = profile.daoTao.chuyenMon.filter(cm => getDegreeScore(cm.degree) >= reqScore);
          satisfied = matchingCM.length === 0;
          message = satisfied 
            ? `Cán bộ không sở hữu bằng ngành ngoài từ mức "${value}" trở lên` 
            : `Cán bộ đã sở hữu bằng ngành ngoài từ mức "${value}" trở lên (Phát hiện bằng ${matchingCM[0].degree})`;
        }
        break;

      case 'lyLuan':
        fieldLabel = 'Lý luận chính trị';
        const hasLyLuan = profile.daoTao.lyLuan && profile.daoTao.lyLuan.length > 0;
        const reqLLScore = getLyLuanLevelScore(value);
        const matchingLL = hasLyLuan ? profile.daoTao.lyLuan.filter(ll => getLyLuanLevelScore(ll.level) >= reqLLScore) : [];
        satisfied = matchingLL.length > 0;
        if (satisfied) {
          const best = matchingLL.sort((a,b) => getLyLuanLevelScore(b.level) - getLyLuanLevelScore(a.level))[0];
          message = `Đạt trình độ Lý luận chính trị "${best.level}" (Hình thức: ${best.trainingForm}, cấp ngày ${formatViDate(best.dateOfIssue)} tại ${best.facility}) - Đạt yêu cầu từ mức "${value}" trở lên`;
        } else {
          message = hasLyLuan
            ? `Trình độ lý luận chính trị hiện tại chưa đạt mức "${value}" (Cấp bậc cao nhất: ${profile.daoTao.lyLuan.sort((a,b) => getLyLuanLevelScore(b.level) - getLyLuanLevelScore(a.level))[0].level})`
            : 'Chưa khai báo trình độ Lý luận chính trị';
        }
        break;

      case 'boiDuong':
        fieldLabel = 'Chứng chỉ / Bồi dưỡng';
        const boiDuongs = profile.daoTao.boiDuong || [];
        const matchingCert = boiDuongs.filter(bd => bd.field.toLowerCase().includes(value.toLowerCase()));
        satisfied = matchingCert.length > 0;
        if (satisfied) {
          const cert = matchingCert[0];
          message = `Sở hữu chứng chỉ bồi dưỡng: "${cert.field}" cấp ngày ${formatViDate(cert.dateOfIssue)} tại "${cert.facility}" (Khớp từ khóa "${value}")`;
        } else {
          message = `Không tìm thấy chứng chỉ bồi dưỡng nào có tên chứa từ khóa "${value}"`;
        }
        break;

      case 'tenure':
        fieldLabel = 'Thâm niên tại PC09';
        const tenureInfo = calculatePC09Tenure(profile);
        const reqYears = parseFloat(value) || 0;
        if (operator === 'gte') {
          satisfied = tenureInfo.years >= reqYears;
          message = satisfied 
            ? `Thâm niên tại PC09 gần nhất đạt ${tenureInfo.text} (${tenureInfo.years} năm đầy đủ), lớn hơn hoặc bằng mức yêu cầu ${reqYears} năm. Mốc bắt đầu gần nhất: ${formatViDate(tenureInfo.earliestDate)}`
            : `Thâm niên tại PC09 gần nhất chỉ đạt ${tenureInfo.text} (${tenureInfo.years} năm), chưa đủ mức yêu cầu tối thiểu ${reqYears} năm. Mốc bắt đầu gần nhất: ${formatViDate(tenureInfo.earliestDate)}`;
        } else {
          satisfied = tenureInfo.years <= reqYears;
          message = satisfied 
            ? `Thâm niên tại PC09 gần nhất đạt ${tenureInfo.text} (${tenureInfo.years} năm), nhỏ hơn hoặc bằng mức yêu cầu ${reqYears} năm. Mốc bắt đầu gần nhất: ${formatViDate(tenureInfo.earliestDate)}`
            : `Thâm niên tại PC09 gần nhất đạt ${tenureInfo.text} (${tenureInfo.years} năm), vượt quá mức yêu cầu ${reqYears} năm. Mốc bắt đầu gần nhất: ${formatViDate(tenureInfo.earliestDate)}`;
        }
        break;
    }

    return {
      ruleId: rule.id,
      fieldLabel,
      satisfied,
      message
    };
  };

  // Run audit evaluation
  const handleRunAudit = () => {
    if (rules.length === 0) {
      warning('Vui lòng thêm ít nhất một điều kiện rà soát.');
      return;
    }

    const auditResults: AuditResult[] = personnel.filter(p => p.status === 'active').map(p => {
      const details = rules.map(rule => evaluateRule(p, rule));
      let overallSatisfied = false;

      if (matchType === 'AND') {
        overallSatisfied = details.every(d => d.satisfied);
      } else {
        overallSatisfied = details.some(d => d.satisfied);
      }

      return {
        profile: p,
        details,
        overallSatisfied
      };
    });

    // Sort satisfied ones first
    const sorted = auditResults.sort((a, b) => {
      if (a.overallSatisfied && !b.overallSatisfied) return -1;
      if (!a.overallSatisfied && b.overallSatisfied) return 1;
      return a.profile.personal.fullName.localeCompare(b.profile.personal.fullName);
    });

    setResults(sorted);
    setIsAudited(true);
    if (sorted.length > 0 && sorted[0].overallSatisfied) {
      setExpandedProfileId(sorted[0].profile.id);
    }
  };

  // Export audited results to Excel
  const handleExportExcel = () => {
    const matchedOnly = results.filter(r => r.overallSatisfied);
    if (matchedOnly.length === 0) {
      error('Không có kết quả rà soát nào thỏa mãn để xuất tệp.');
      return;
    }

    const excelData = matchedOnly.map((r, index) => {
      const p = r.profile;
      const tenure = calculatePC09Tenure(p);
      const activeRank = p.cand.rankHistory && p.cand.rankHistory.length > 0 
        ? [...p.cand.rankHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank 
        : '---';
      const activePosition = p.cand.positionHistory && p.cand.positionHistory.length > 0 
        ? [...p.cand.positionHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position 
        : '---';

      // Join rule explanations
      const explanations = r.details
        .map(d => `[${d.fieldLabel}]: ${d.message}`)
        .join('; \n');

      return {
        'STT': index + 1,
        'Họ và tên': p.personal.fullName,
        'Số hiệu CAND': p.cand.securityId,
        'Cấp bậc hàm': activeRank,
        'Chức vụ': activePosition,
        'Giới tính': p.personal.gender,
        'Ngày sinh': formatViDate(p.personal.dob),
        'Đảng viên': p.dang.hasDang ? 'Đảng viên' : 'Quần chúng',
        'Thâm niên PC09 gần nhất': tenure.text,
        'Báo cáo giải trình điều kiện': explanations
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set auto width for cells
    const max_width = excelData.reduce((w, r) => Math.max(w, r['Báo cáo giải trình điều kiện'].length), 50);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: Math.min(80, max_width) }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả Rà soát');
    XLSX.writeFile(workbook, `bao_cao_ra_soat_nang_cao_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const matchedCount = results.filter(r => r.overallSatisfied).length;

  return (
    <div className="space-y-6" id="advanced_review_root">
      
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden border border-indigo-950">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl -ml-10 -mb-10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-indigo-500/35 border border-indigo-400/20 text-indigo-200 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Công cụ Phân tích Nghiệp vụ
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Rà soát Nhân sự Nâng cao</h2>
            <p className="text-xs text-indigo-200/85 max-w-2xl leading-relaxed">
              Truy vấn đa điều kiện chuẩn hóa kết hợp logic và dữ liệu thâm niên, bằng cấp, chứng chỉ. Lập tức bóc tách dữ liệu giải trình chi tiết từng hồ sơ phục vụ công tác điều động, bổ nhiệm cán bộ.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center shrink-0">
            <p className="text-2xs text-indigo-200 font-bold uppercase tracking-wider">Tổng quân số đơn vị</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{personnel.filter((p) => p.status === 'active').length} <span className="text-xs font-normal">đồng chí</span></p>
          </div>
        </div>
      </div>

      {/* Main Container: Dynamic Query Builder (Full Width) */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Logic combination header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Bộ thiết lập điều kiện rà soát</h3>
                  <p className="text-3xs text-slate-400">Tùy biến không giới hạn trường và biểu thức</p>
                </div>
              </div>

              {/* Logic Operator Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => { setMatchType('AND'); setIsAudited(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matchType === 'AND'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Thỏa mãn TẤT CẢ (VÀ)
                </button>
                <button
                  onClick={() => { setMatchType('OR'); setIsAudited(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    matchType === 'OR'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Thỏa mãn MỘT TRONG (HOẶC)
                </button>
              </div>
            </div>

            {/* List of custom condition rules */}
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div 
                  key={rule.id} 
                  className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all relative group"
                >
                  {/* Indicator number */}
                  <div className="absolute top-1/2 -translate-y-1/2 -left-2.5 w-5 h-5 bg-slate-200 text-slate-600 border border-white text-3xs font-bold rounded-full flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {idx + 1}
                  </div>

                  {/* 1. Field selection */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">Trường thông tin</label>
                    <select
                      value={rule.field}
                      onChange={(e) => handleRuleChange(rule.id, { field: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="fullName">Họ và tên</option>
                      <option value="gender">Giới tính</option>
                      <option value="age">Tuổi ngành (Thâm niên CAND)</option>
                      <option value="dangAge">Tuổi Đảng (Số năm)</option>
                      <option value="chucDanh">Chức danh</option>
                      <option value="rank">Cấp bậc hàm hiện tại</option>
                      <option value="position">Chức vụ hiện tại</option>
                      <option value="nghiepVu">Bằng nghiệp vụ CAND</option>
                      <option value="chuyenMon">Bằng chuyên môn ngành ngoài</option>
                      <option value="lyLuan">Lý luận chính trị</option>
                      <option value="boiDuong">Chứng chỉ / Lớp bồi dưỡng</option>
                      <option value="tenure">Thâm niên tại PC09</option>
                    </select>
                  </div>

                  {/* 2. Operator selection based on selected field */}
                  <div className="w-full md:w-[150px]">
                    <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">Điều kiện lọc</label>
                    {['fullName', 'boiDuong'].includes(rule.field) ? (
                      <select
                        value={rule.operator}
                        disabled
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium"
                      >
                        <option value="contains">Chứa từ khóa</option>
                      </select>
                    ) : ['rank', 'position'].includes(rule.field) ? (
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(rule.id, { operator: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="has">Từ mức trở lên</option>
                        <option value="equals">Đúng chính xác</option>
                      </select>
                    ) : ['gender', 'dang', 'chucDanh'].includes(rule.field) ? (
                      <select
                        value={rule.operator}
                        disabled
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium"
                      >
                        <option value="equals">Bằng</option>
                      </select>
                    ) : ['age', 'dangAge', 'tenure'].includes(rule.field) ? (
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(rule.id, { operator: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="gte">Lớn hơn hoặc bằng (&gt;=)</option>
                        <option value="lte">Nhỏ hơn hoặc bằng (&lt;=)</option>
                      </select>
                    ) : ['nghiepVu', 'chuyenMon'].includes(rule.field) ? (
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(rule.id, { operator: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="has">Có trình độ từ mức</option>
                        <option value="not_has">Không sở hữu từ mức</option>
                      </select>
                    ) : rule.field === 'lyLuan' ? (
                      <select
                        value={rule.operator}
                        disabled
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-medium"
                      >
                        <option value="has">Từ trình độ trở lên</option>
                      </select>
                    ) : null}
                  </div>

                  {/* 3. Value selection / input depending on field */}
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-4xs font-bold text-slate-400 uppercase block mb-1">Giá trị đối chiếu</label>
                    {rule.field === 'gender' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    ) : rule.field === 'chucDanh' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                      >
                        <optgroup label="Tất cả ngạch">
                          <option value="Giám định viên (Tất cả)">Giám định viên (Tất cả)</option>
                          <option value="Trinh sát viên (Tất cả)">Trinh sát viên (Tất cả)</option>
                          <option value="Kỹ thuật viên (Tất cả)">Kỹ thuật viên (Tất cả)</option>
                        </optgroup>
                        <optgroup label="Tất cả ngạch theo bậc">
                          <option value="Bậc Sơ cấp (Tất cả ngạch)">Bậc Sơ cấp (Tất cả ngạch)</option>
                          <option value="Bậc Trung cấp (Tất cả ngạch)">Bậc Trung cấp (Tất cả ngạch)</option>
                          <option value="Bậc Cao cấp (Tất cả ngạch)">Bậc Cao cấp (Tất cả ngạch)</option>
                        </optgroup>
                        <optgroup label="Giám định viên">
                          <option value="Giám định viên - Sơ cấp">Giám định viên - Sơ cấp</option>
                          <option value="Giám định viên - Trung cấp">Giám định viên - Trung cấp</option>
                          <option value="Giám định viên - Cao cấp">Giám định viên - Cao cấp</option>
                        </optgroup>
                        <optgroup label="Trinh sát viên">
                          <option value="Trinh sát viên - Sơ cấp">Trinh sát viên - Sơ cấp</option>
                          <option value="Trinh sát viên - Trung cấp">Trinh sát viên - Trung cấp</option>
                          <option value="Trinh sát viên - Cao cấp">Trinh sát viên - Cao cấp</option>
                        </optgroup>
                        <optgroup label="Kỹ thuật viên">
                          <option value="Kỹ thuật viên - Sơ cấp">Kỹ thuật viên - Sơ cấp</option>
                          <option value="Kỹ thuật viên - Trung cấp">Kỹ thuật viên - Trung cấp</option>
                          <option value="Kỹ thuật viên - Cao cấp">Kỹ thuật viên - Cao cấp</option>
                        </optgroup>
                        <optgroup label="Trạng thái khác">
                          <option value="Chưa bổ nhiệm">Chưa bổ nhiệm</option>
                        </optgroup>
                      </select>
                    ) : rule.field === 'dang' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="có">Là Đảng viên</option>
                        <option value="không">Không là Đảng viên</option>
                      </select>
                    ) : ['nghiepVu', 'chuyenMon'].includes(rule.field) ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Tiến sĩ">Tiến sĩ</option>
                        <option value="Thạc sĩ">Thạc sĩ</option>
                        <option value="Đại học">Đại học</option>
                        <option value="Cao đẳng">Cao đẳng</option>
                        <option value="Trung cấp">Trung cấp</option>
                      </select>
                    ) : rule.field === 'lyLuan' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Cao cấp">Cao cấp</option>
                        <option value="Trung cấp">Trung cấp</option>
                        <option value="Sơ cấp">Sơ cấp</option>
                      </select>
                    ) : rule.field === 'rank' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Đại tá">Đại tá</option>
                        <option value="Thượng tá">Thượng tá</option>
                        <option value="Trung tá">Trung tá</option>
                        <option value="Thiếu tá">Thiếu tá</option>
                        <option value="Đại úy">Đại úy</option>
                        <option value="Thượng úy">Thượng úy</option>
                        <option value="Trung úy">Trung úy</option>
                        <option value="Thiếu úy">Thiếu úy</option>
                      </select>
                    ) : rule.field === 'position' ? (
                      <select
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden"
                      >
                        <option value="Trưởng Phòng">Trưởng Phòng</option>
                        <option value="Phó Trưởng phòng">Phó Trưởng phòng</option>
                        <option value="Đội trưởng">Đội trưởng</option>
                        <option value="Phó Đội trưởng">Phó Đội trưởng</option>
                      </select>
                    ) : rule.field === 'age' ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                        placeholder="Số năm tuổi ngành (Ví dụ: 10)"
                      />
                    ) : rule.field === 'dangAge' ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                        placeholder="Số năm tuổi Đảng (Ví dụ: 5)"
                      />
                    ) : rule.field === 'tenure' ? (
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-indigo-500"
                        placeholder="Số năm thâm niên (Ví dụ: 3)"
                      />
                    ) : (
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => handleRuleChange(rule.id, { value: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                        placeholder={
                          rule.field === 'boiDuong' ? 'Ví dụ: Giám định tài liệu, Tiếng Anh' : 'Nhập từ khóa cần lọc...'
                        }
                      />
                    )}
                  </div>

                  {/* 4. Delete action button */}
                  <div className="pt-2 md:pt-4 flex items-center justify-end">
                    <button
                      onClick={() => handleRemoveRule(rule.id)}
                      disabled={rules.length === 1}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Xóa điều kiện này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {rules.length === 0 && (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-400 italic">Không có điều kiện nào được kích hoạt. Hãy nhấn Thêm điều kiện.</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <button
                onClick={handleAddRule}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-500" />
                Thêm điều kiện mới
              </button>

              <button
                onClick={handleRunAudit}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 cursor-pointer transition-all"
              >
                <Search className="w-4.5 h-4.5" />
                Khởi chạy Rà soát
              </button>
            </div>

          </div>
        </div>

      {/* Audit Output Section */}
      {isAudited && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="audit_results_section">
          
          {/* Output Header banner */}
          <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${matchedCount > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border border-rose-500/20'}`}>
                {matchedCount > 0 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Kết quả rà soát nâng cao</h3>
                <p className="text-3xs text-slate-400">
                  Phát hiện <strong className="text-emerald-400">{matchedCount}</strong> cán bộ trên tổng số {personnel.filter(p => p.status === 'active').length} nhân sự đáp ứng hoàn toàn tiêu chí đặt ra
                </p>
              </div>
            </div>

            {matchedCount > 0 && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Xuất Báo cáo Excel
              </button>
            )}
          </div>

          {/* Table / List results */}
          <div className="divide-y divide-slate-150">
            
            {/* Satisfied section */}
            <div className="bg-emerald-50/10 px-5 py-3 border-b border-slate-150 flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Danh sách cán bộ ĐẠT YÊU CẦU ({matchedCount})
              </span>
            </div>

            {results.filter(r => r.overallSatisfied).length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic text-xs">
                Không tìm thấy cán bộ chiến sĩ nào thỏa mãn hệ thống tiêu chí đã thiết lập.
              </div>
            ) : (
              results.filter(r => r.overallSatisfied).map(r => {
                const p = r.profile;
                const isExpanded = expandedProfileId === p.id;
                const tenure = calculatePC09Tenure(p);
                const activeRank = p.cand.rankHistory && p.cand.rankHistory.length > 0 
                  ? [...p.cand.rankHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank 
                  : '---';
                const activePosition = p.cand.positionHistory && p.cand.positionHistory.length > 0 
                  ? [...p.cand.positionHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position 
                  : '---';

                return (
                  <div key={p.id} className="transition-all hover:bg-slate-50/20">
                    
                    {/* Minimal row summary */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Profile picture default avatar placeholder */}
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0 font-bold text-xs uppercase">
                          {p.personal.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm leading-tight hover:underline cursor-pointer" onClick={() => onSelectPersonnel && onSelectPersonnel(p)}>
                              {p.personal.fullName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-3xs border border-indigo-150">
                              {p.cand.securityId}
                            </span>
                          </div>
                          
                          <div className="text-3xs text-slate-500 font-medium mt-1 space-x-2 flex items-center flex-wrap">
                            <span>Quân hàm: <strong>{activeRank}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Chức vụ: <strong>{activePosition}</strong></span>
                            <span className="text-slate-300">•</span>
                            <span>Thâm niên PC09 gần nhất: <strong className="text-indigo-600">{tenure.text}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => onSelectPersonnel && onSelectPersonnel(p)}
                          className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-4xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Hồ sơ chi tiết
                        </button>
                        <button
                          onClick={() => setExpandedProfileId(isExpanded ? null : p.id)}
                          className={`px-3 py-1.5 rounded-lg text-4xs font-extrabold flex items-center gap-1 cursor-pointer ${
                            isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          }`}
                        >
                          {isExpanded ? 'Đóng giải trình' : 'Xem giải trình'}
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Detailed evaluation audit explanation */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 p-4 sm:p-5 border-t border-slate-150 space-y-3">
                        <p className="text-2xs font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Báo cáo giải trình điều kiện của đồng chí {p.personal.fullName}:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {r.details.map((detail) => (
                            <div 
                              key={detail.ruleId} 
                              className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                                detail.satisfied 
                                  ? 'bg-emerald-50/40 border-emerald-150/80 text-emerald-950' 
                                  : 'bg-rose-50/20 border-rose-100 text-slate-500 opacity-60'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {detail.satisfied ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400" />
                                )}
                              </div>
                              <div className="text-xs">
                                <p className={`font-extrabold ${detail.satisfied ? 'text-emerald-800' : 'text-slate-600'}`}>
                                  Điều kiện {detail.fieldLabel}
                                </p>
                                <p className="text-4xs mt-0.5 leading-relaxed font-medium">
                                  {detail.message}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}

            {/* Non-satisfied section */}
            {results.filter(r => !r.overallSatisfied).length > 0 && (
              <>
                <div className="bg-slate-100 px-5 py-2.5 flex items-center justify-between border-t border-slate-150">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-slate-400" />
                    Danh sách cán bộ KHÔNG ĐẠT YÊU CẦU ({results.filter(r => !r.overallSatisfied).length})
                  </span>
                </div>

                <div className="p-3 bg-slate-50/30 overflow-x-auto">
                  <table className="w-full text-left text-3xs text-slate-500 border-collapse">
                    <thead>
                      <tr className="text-slate-400 uppercase tracking-wider border-b border-slate-150">
                        <th className="py-2 px-3 font-semibold">Cán bộ</th>
                        <th className="py-2 px-3 font-semibold">Số hiệu</th>
                        <th className="py-2 px-3 font-semibold">Quân hàm / Chức vụ</th>
                        <th className="py-2 px-3 font-semibold">Lý do chính không đạt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.filter(r => !r.overallSatisfied).map(r => {
                        const p = r.profile;
                        const failedRule = r.details.find(d => !d.satisfied);
                        const activeRank = p.cand.rankHistory && p.cand.rankHistory.length > 0 
                          ? [...p.cand.rankHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank 
                          : '---';
                        const activePosition = p.cand.positionHistory && p.cand.positionHistory.length > 0 
                          ? [...p.cand.positionHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position 
                          : '---';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-700">{p.personal.fullName}</td>
                            <td className="py-2.5 px-3 font-semibold">{p.cand.securityId}</td>
                            <td className="py-2.5 px-3">{activeRank} • {activePosition}</td>
                            <td className="py-2.5 px-3 text-rose-600 font-medium">
                              {failedRule ? `Thiếu điều kiện [${failedRule.fieldLabel}]: ${failedRule.message}` : 'Không đủ điều kiện'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
