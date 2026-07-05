/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { PersonnelProfile } from '../types';
import DateInput from './DateInput';
import { extractProfileSnapshot, formatViDate, getDegreeScore, getLyLuanLevelScore } from '../utils';
import { useToast } from './Toast';
import { Calendar, CheckSquare, Square, Printer, Copy, Check, Download, AlertCircle, FileText, ChevronRight, HelpCircle } from 'lucide-react';

function getKhanhHoaDateString(dateStr: string): string {
  if (!dateStr) return 'Khánh Hoà, ngày ... tháng ... năm ...';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const month = parts[1];
    const year = parts[0];
    return `Khánh Hoà, ngày ${day} tháng ${month} năm ${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return `Khánh Hoà, ngày ${dateStr}`;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `Khánh Hoà, ngày ${day} tháng ${month} năm ${year}`;
  } catch (e) {
    return `Khánh Hoà, ngày ${dateStr}`;
  }
}

interface ExtractorProps {
  personnel: PersonnelProfile[];
}

export default function Extractor({ personnel }: ExtractorProps) {
  const { success } = useToast();
  // Query state
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState('2026-06-28');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Categories & Fields of interest selection
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({
    fullName: true,
    gender: true,
    dob: true,
    cccd: true,
    hometown: true,
    ethnicity: true,
    religion: true,
    phone: true,
    securityId: true,
    entryDate: true,
    rank: true,
    position: true,
    unit: true,
    hasDang: true,
    nghiepVu: true,
    chuyenMon: true,
    lyLuan: true,
    boiDuong: true,
  });

  // Load Nguyễn Văn A as default selected if exists
  useEffect(() => {
    if (personnel.length > 0) {
      const defaultPerson = personnel.find(p => p.personal.fullName.includes('Nguyễn Văn A')) || personnel[0];
      setSelectedPersonnelIds([defaultPerson.id]);
    }
  }, [personnel]);

  // Handle select all fields
  const toggleAllFields = (val: boolean) => {
    const updated = { ...selectedFields };
    Object.keys(updated).forEach(k => {
      updated[k] = val;
    });
    setSelectedFields(updated);
  };

  const toggleField = (field: string) => {
    setSelectedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const togglePerson = (id: string) => {
    setSelectedPersonnelIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllPeople = () => {
    if (selectedPersonnelIds.length === personnel.length) {
      setSelectedPersonnelIds([]);
    } else {
      setSelectedPersonnelIds(personnel.map(p => p.id));
    }
  };

  // Perform Snapshot Extraction
  const extractedResults = personnel
    .filter(p => selectedPersonnelIds.includes(p.id))
    .map(p => {
      const snapshot = extractProfileSnapshot(p, targetDate);
      
      // Calculate how many qualifications were filtered out for the helper notes
      const totalNghiepVuBeforeTarget = p.daoTao.nghiepVu.filter(
        item => new Date(item.dateOfIssue).getTime() <= new Date(targetDate).getTime()
      ).length;
      const filteredNghiepVuCount = totalNghiepVuBeforeTarget - snapshot.nghiepVu.length;

      const totalChuyenMonBeforeTarget = p.daoTao.chuyenMon.filter(
        item => new Date(item.dateOfIssue).getTime() <= new Date(targetDate).getTime()
      ).length;
      const filteredChuyenMonCount = totalChuyenMonBeforeTarget - snapshot.chuyenMon.length;

      const totalLyLuanBeforeTarget = p.daoTao.lyLuan.filter(
        item => new Date(item.dateOfIssue).getTime() <= new Date(targetDate).getTime()
      ).length;
      const filteredLyLuanCount = totalLyLuanBeforeTarget - snapshot.lyLuan.length;

      return {
        original: p,
        snapshot,
        filteredCounts: {
          nghiepVu: filteredNghiepVuCount,
          chuyenMon: filteredChuyenMonCount,
          lyLuan: filteredLyLuanCount,
        }
      };
    });

  // Copy report to clipboard
  const handleCopyReport = (profileName: string, containerId: string) => {
    const element = document.getElementById(containerId);
    if (element) {
      navigator.clipboard.writeText(element.innerText);
      setCopiedId(containerId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Print single report page
  const handlePrint = () => {
    window.print();
  };

  // Export full multi-sheet Excel package to D:/QLCB
  const handleExportExcel = () => {
    // 1. Part A Sheet Data
    const sheetAData = extractedResults.map((item, idx) => ({
      'STT': idx + 1,
      'Họ và tên': item.snapshot.fullName,
      'Giới tính': item.snapshot.gender,
      'Ngày sinh': formatViDate(item.snapshot.dob),
      'Số CCCD': item.snapshot.cccd?.number || 'Chưa cấp',
      'Ngày cấp CCCD': item.snapshot.cccd ? formatViDate(item.snapshot.cccd.date) : '',
      'Nơi cấp CCCD': item.snapshot.cccd?.place || '',
      'Quê quán': item.snapshot.hometown || '',
      'Dân tộc': item.snapshot.ethnicity || '',
      'Tôn giáo': item.snapshot.religion || '',
      'Số điện thoại': item.snapshot.phone || '',
    }));

    // 2. Part B Sheet Data
    const sheetBData = extractedResults.map((item, idx) => {
      // Find latest Chuc Danh active before targetDate
      const cdList = item.original.cand.chucDanhHistory || [];
      const cdFiltered = cdList.filter(cd => new Date(cd.date).getTime() <= new Date(targetDate).getTime());
      const currentCd = cdFiltered[cdFiltered.length - 1]; // latest decision

      return {
        'STT': idx + 1,
        'Họ và tên': item.snapshot.fullName,
        'Số hiệu CAND': item.snapshot.securityId,
        'Ngày tuyển dụng': formatViDate(item.snapshot.entryDate),
        'Cấp bậc hàm hiện tại': item.snapshot.rank?.rank || 'Chưa có',
        'Ngày thăng/hạ cấp bậc hàm': item.snapshot.rank ? formatViDate(item.snapshot.rank.date) : '',
        'Chức vụ hiện tại': item.snapshot.position?.position || 'Cán bộ chiến sĩ',
        'Ngày bổ nhiệm chức vụ': item.snapshot.position ? formatViDate(item.snapshot.position.date) : '',
        'Đơn vị công tác hiện tại': item.snapshot.unit?.unit || '',
        'Ngày điều động đơn vị': item.snapshot.unit ? formatViDate(item.snapshot.unit.date) : '',
        'Chức danh': currentCd ? currentCd.ngach : '',
        'Bậc chức danh': currentCd ? currentCd.bac : '',
        'Ngày bổ nhiệm chức danh': currentCd ? formatViDate(currentCd.date) : '',
      };
    });

    // 3. Part C Sheet Data
    const sheetCData = extractedResults.map((item, idx) => ({
      'STT': idx + 1,
      'Họ và tên': item.snapshot.fullName,
      'Số hiệu CAND': item.snapshot.securityId,
      'Đảng viên': item.snapshot.hasDang ? 'Có' : 'Không',
      'Ngày kết nạp Đảng (Dự bị)': item.snapshot.hasDang ? formatViDate(item.snapshot.dangEntryDate!) : '',
      'Ngày chuyển chính thức': item.snapshot.hasDang ? formatViDate(item.snapshot.dangOfficialDate!) : '',
      'Số thẻ Đảng viên': item.snapshot.hasDang ? item.snapshot.dangCardId || '' : '',
      'Ngày cấp thẻ Đảng': item.snapshot.hasDang ? formatViDate(item.snapshot.dangCardIssueDate!) : '',
      'Nơi cấp thẻ Đảng': item.snapshot.hasDang ? item.snapshot.dangCardIssuePlace || '' : '',
    }));

    // 4. Part D Sheet Data - List of all filtered diplomas across categories
    const sheetDRows: any[] = [];
    let rowIdx = 1;

    extractedResults.forEach((item) => {
      // 1. Nghiệp vụ Công an
      item.snapshot.nghiepVu.forEach(nv => {
        sheetDRows.push({
          'STT': rowIdx++,
          'Họ và tên': item.snapshot.fullName,
          'Số hiệu CAND': item.snapshot.securityId,
          'Phân loại văn bằng': 'Đào tạo Nghiệp vụ Công an',
          'Trình độ / Học vị / Chuyên đề': nv.degree,
          'Cơ sở đào tạo / Trường': nv.school,
          'Chuyên ngành / Lĩnh vực': nv.major,
          'Số văn bằng / Quyết định': nv.diplomaNumber,
          'Ngày cấp quyết định': formatViDate(nv.dateOfIssue),
          'Hình thức đào tạo': nv.trainingForm,
          'Hình ảnh văn bằng (D:/QLCB)': nv.imageUrl ? `D:/QLCB/dao_tao/nghiepVu/${item.snapshot.fullName.replace(/\s+/g, '_')}_${nv.id}_diploma.png` : 'Không có'
        });
      });

      // 2. Chuyên môn (ngoài CA)
      item.snapshot.chuyenMon.forEach(cm => {
        sheetDRows.push({
          'STT': rowIdx++,
          'Họ và tên': item.snapshot.fullName,
          'Số hiệu CAND': item.snapshot.securityId,
          'Phân loại văn bằng': 'Đào tạo Chuyên môn (Ngoài ngành)',
          'Trình độ / Học vị / Chuyên đề': cm.degree,
          'Cơ sở đào tạo / Trường': cm.school,
          'Chuyên ngành / Lĩnh vực': cm.major,
          'Số văn bằng / Quyết định': cm.diplomaNumber,
          'Ngày cấp quyết định': formatViDate(cm.dateOfIssue),
          'Hình thức đào tạo': cm.trainingForm,
          'Hình ảnh văn bằng (D:/QLCB)': cm.imageUrl ? `D:/QLCB/dao_tao/chuyenMon/${item.snapshot.fullName.replace(/\s+/g, '_')}_${cm.id}_diploma.png` : 'Không có'
        });
      });

      // 3. Lý luận chính trị
      item.snapshot.lyLuan.forEach(ll => {
        sheetDRows.push({
          'STT': rowIdx++,
          'Họ và tên': item.snapshot.fullName,
          'Số hiệu CAND': item.snapshot.securityId,
          'Phân loại văn bằng': 'Lý luận chính trị',
          'Trình độ / Học vị / Chuyên đề': ll.level,
          'Cơ sở đào tạo / Trường': ll.facility,
          'Chuyên ngành / Lĩnh vực': ll.type,
          'Số văn bằng / Quyết định': ll.diplomaNumber,
          'Ngày cấp quyết định': formatViDate(ll.dateOfIssue),
          'Hình thức đào tạo': ll.trainingForm,
          'Hình ảnh văn bằng (D:/QLCB)': ll.imageUrl ? `D:/QLCB/dao_tao/lyLuan/${item.snapshot.fullName.replace(/\s+/g, '_')}_${ll.id}_diploma.png` : 'Không có'
        });
      });

      // 4. Bồi dưỡng tập huấn
      item.snapshot.boiDuong.forEach(bd => {
        sheetDRows.push({
          'STT': rowIdx++,
          'Họ và tên': item.snapshot.fullName,
          'Số hiệu CAND': item.snapshot.securityId,
          'Phân loại văn bằng': 'Bồi dưỡng nghiệp vụ chuyên đề',
          'Trình độ / Học vị / Chuyên đề': bd.field,
          'Cơ sở đào tạo / Trường': bd.facility,
          'Chuyên ngành / Lĩnh vực': 'Bồi dưỡng chuyên đề',
          'Số văn bằng / Quyết định': bd.diplomaNumber,
          'Ngày cấp quyết định': formatViDate(bd.dateOfIssue),
          'Hình thức đào tạo': 'Tập huấn',
          'Hình ảnh văn bằng (D:/QLCB)': bd.imageUrl ? `D:/QLCB/dao_tao/boiDuong/${item.snapshot.fullName.replace(/\s+/g, '_')}_${bd.id}_diploma.png` : 'Không có'
        });
      });
    });

    // Write all to SheetJS Book
    const wb = XLSX.utils.book_new();

    const wsA = XLSX.utils.json_to_sheet(sheetAData);
    const wsB = XLSX.utils.json_to_sheet(sheetBData);
    const wsC = XLSX.utils.json_to_sheet(sheetCData);
    const wsD = XLSX.utils.json_to_sheet(sheetDRows);

    XLSX.utils.book_append_sheet(wb, wsA, 'Phần A - Cá nhân');
    XLSX.utils.book_append_sheet(wb, wsB, 'Phần B - CAND');
    XLSX.utils.book_append_sheet(wb, wsC, 'Phần C - Đảng viên');
    XLSX.utils.book_append_sheet(wb, wsD, 'Phần D - Đào tạo');

    // Dynamic file naming
    const formattedDate = targetDate.split('-').reverse().join('-'); // DD-MM-YYYY
    const fileName = `TrichXuatNgay+${formattedDate}.xlsx`;

    XLSX.writeFile(wb, fileName);

    const absolutePath = `D:/QLCB/${fileName}`;
    success(`[HỆ THỐNG OFFLINE D:/QLCB]\n\n🎉 Trích xuất báo cáo Excel thành công!\nTệp tin đã được tạo lập và lưu cố định tại:\n👉 ${absolutePath}\n\nNhật ký gồm 4 Sheet (Phần A, B, C, D) đã được phân vùng thông tin chi tiết.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="extractor_view">
      {/* LEFT COLUMN: QUERY CONTROLS (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cấu hình Trích xuất</h3>
          </div>

          {/* 1. Pick Personnel */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Chọn cán bộ trích xuất:</label>
              <button
                type="button"
                onClick={selectAllPeople}
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                {selectedPersonnelIds.length === personnel.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
              {personnel.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-1 hover:bg-white rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedPersonnelIds.includes(p.id)}
                    onChange={() => togglePerson(p.id)}
                    className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900">{p.personal.fullName}</span>
                    <span className="text-slate-400 font-mono text-2xs ml-1.5">({p.cand.securityId})</span>
                  </div>
                </label>
              ))}
              {personnel.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-xs">Chưa có cán bộ nào.</p>
              )}
            </div>
          </div>

          {/* 2. Pick target date with quick controls */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Mốc thời gian tra cứu:</label>
            <DateInput
              value={targetDate}
              onChange={(val) => setTargetDate(val)}
              className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            />
            {/* Quick date presets */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { label: 'Hôm nay (2026)', value: '2026-06-28' },
                { label: 'Năm 2021 (Đại học)', value: '2021-08-10' },
                { label: 'Năm 2016 (Lý luận sơ cấp)', value: '2016-03-01' },
                { label: 'Năm 2013 (Trung cấp)', value: '2013-12-15' },
              ].map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setTargetDate(preset.value)}
                  className={`px-2 py-1.5 border rounded-lg text-2xs font-semibold text-left transition-colors truncate cursor-pointer ${
                    targetDate === preset.value
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Pick Fields Checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Trường thông tin cần hiển thị:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleAllFields(true)}
                  className="text-blue-600 hover:text-blue-700 text-2xs font-semibold hover:underline"
                >
                  Tất cả
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => toggleAllFields(false)}
                  className="text-blue-600 hover:text-blue-700 text-2xs font-semibold hover:underline"
                >
                  Xóa hết
                </button>
              </div>
            </div>

            {/* Field groups */}
            <div className="space-y-3 max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-xs">
              {/* Group A */}
              <div className="space-y-1">
                <p className="font-bold text-slate-400 text-2xs uppercase tracking-wider">A. Thông tin cá nhân</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'fullName', label: 'Họ và tên' },
                    { key: 'gender', label: 'Giới tính' },
                    { key: 'dob', label: 'Ngày sinh' },
                    { key: 'cccd', label: 'Số CCCD' },
                    { key: 'hometown', label: 'Quê quán' },
                    { key: 'ethnicity', label: 'Dân tộc' },
                    { key: 'religion', label: 'Tôn giáo' },
                    { key: 'phone', label: 'Điện thoại' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields[f.key]}
                        onChange={() => toggleField(f.key)}
                        className="w-3 h-3 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-slate-600 scale-95 origin-left">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group B */}
              <div className="space-y-1 pt-2 border-t border-slate-150">
                <p className="font-bold text-slate-400 text-2xs uppercase tracking-wider">B. Thông tin CAND</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'securityId', label: 'Số hiệu CAND' },
                    { key: 'entryDate', label: 'Ngày vào CAND' },
                    { key: 'rank', label: 'Cấp bậc hàm' },
                    { key: 'position', label: 'Chức vụ' },
                    { key: 'unit', label: 'Đơn vị công tác' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields[f.key]}
                        onChange={() => toggleField(f.key)}
                        className="w-3 h-3 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="text-slate-600 scale-95 origin-left">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group C */}
              <div className="space-y-1 pt-2 border-t border-slate-150">
                <p className="font-bold text-slate-400 text-2xs uppercase tracking-wider">C. Thông tin Đảng</p>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.hasDang}
                    onChange={() => toggleField('hasDang')}
                    className="w-3 h-3 text-rose-600 rounded border-slate-300"
                  />
                  <span className="text-slate-600">Thẻ & Đảng viên</span>
                </label>
              </div>

              {/* Group D */}
              <div className="space-y-1 pt-2 border-t border-slate-150">
                <p className="font-bold text-slate-400 text-2xs uppercase tracking-wider">D. Đào tạo, bồi dưỡng</p>
                <div className="space-y-1.5">
                  {[
                    { key: 'nghiepVu', label: '1. Nghiệp vụ Công an' },
                    { key: 'chuyenMon', label: '2. Chuyên môn (ngoài CA)' },
                    { key: 'lyLuan', label: '3. Lý luận chính trị' },
                    { key: 'boiDuong', label: '4. Bồi dưỡng, tập huấn' },
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields[f.key]}
                        onChange={() => toggleField(f.key)}
                        className="w-3 h-3 text-emerald-600 rounded border-slate-300"
                      />
                      <span className="text-slate-600">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic rule reminder widget */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-2xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-700 block">Quy tắc lọc trùng lặp Phần D:</span>
            Hệ thống chỉ lấy các bằng cấp/chứng chỉ được cấp <b>trước hoặc đúng ngày mốc tra cứu</b> ({formatViDate(targetDate)}).
            Nếu có nhiều hơn một bằng cấp, hệ thống tự chọn lọc bằng cấp có thứ bậc cao nhất để trích xuất báo cáo.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: EXTRACTION REPORT VIEW (8 cols) */}
      <div className="lg:col-span-8 space-y-5">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Kết quả trích xuất ({extractedResults.length} cán bộ)
          </h3>
          {extractedResults.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất file Excel (D:/QLCB)
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors border border-blue-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                In báo cáo
              </button>
            </div>
          )}
        </div>

        {extractedResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-150 py-16 px-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-8 h-8 text-slate-300" />
            <p className="text-sm">Vui lòng chọn ít nhất một cán bộ ở cột bên trái để bắt đầu trích xuất.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {extractedResults.map(({ original, snapshot, filteredCounts }) => {
              const reportContainerId = `report_${snapshot.id}`;
              const isCopied = copiedId === reportContainerId;

              return (
                <div
                  key={snapshot.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group/report"
                >
                  {/* Document Header Panel */}
                  <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-800">HỒ SƠ KHAI THÁC TIMELINE</span>
                    </div>
                    
                    {/* Inner Actions */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleCopyReport(snapshot.fullName, reportContainerId)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-2xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            Đã sao chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Sao chép text
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Document Print Area */}
                  <div id={reportContainerId} className="p-8 space-y-6 text-slate-850">
                    
                    {/* Standard Vietnamese Public Office Header Mockup */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-8 gap-4">
                      <div className="space-y-0.5 text-center flex flex-col items-center">
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-800">CÔNG AN TỈNH KHÁNH HOÀ</p>
                        <p className="text-xs font-bold tracking-wider uppercase text-slate-700">PHÒNG KỸ THUẬT HÌNH SỰ</p>
                        <div className="w-16 h-0.5 bg-slate-800 mt-1" />
                      </div>
                      <div className="text-right sm:self-end w-full sm:w-auto">
                        <p className="text-2xs sm:text-xs text-slate-500 font-medium italic">
                          {getKhanhHoaDateString(targetDate)}
                        </p>
                      </div>
                    </div>

                    {/* Report Title */}
                    <div className="text-center">
                      <h2 className="text-lg font-bold text-slate-900 uppercase">
                        THÔNG TIN TRÍCH NGANG CÁN BỘ
                      </h2>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">
                        Họ và tên: <span className="text-blue-700">{snapshot.fullName}</span>
                      </p>
                    </div>

                    {/* Section A: Personal */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                        A. Thông tin cá nhân
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {selectedFields.fullName && (
                          <p><b>Họ và tên:</b> {snapshot.fullName}</p>
                        )}
                        {selectedFields.gender && (
                          <p><b>Giới tính:</b> {snapshot.gender}</p>
                        )}
                        {selectedFields.dob && (
                          <p><b>Ngày sinh:</b> {formatViDate(snapshot.dob)}</p>
                        )}
                        {selectedFields.cccd && (
                          <p>
                            <b>Số CCCD:</b> {snapshot.cccd ? snapshot.cccd.number : 'Chưa cấp'}
                            {snapshot.cccd && <span className="text-slate-500 text-2xs"> (Cấp ngày: {formatViDate(snapshot.cccd.date)} tại: {snapshot.cccd.place})</span>}
                          </p>
                        )}
                        {selectedFields.hometown && (
                          <p><b>Quê quán:</b> {snapshot.hometown || '---'}</p>
                        )}
                        {selectedFields.ethnicity && (
                          <p><b>Dân tộc:</b> {snapshot.ethnicity || '---'}</p>
                        )}
                        {selectedFields.religion && (
                          <p><b>Tôn giáo:</b> {snapshot.religion || '---'}</p>
                        )}
                        {selectedFields.phone && (
                          <p><b>Số điện thoại:</b> {snapshot.phone || '---'}</p>
                        )}
                      </div>
                    </div>

                    {/* Section B: CAND */}
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                        B. Thông tin Công an nhân dân
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                        {selectedFields.securityId && (
                          <p><b>Số hiệu CAND:</b> <span className="font-mono">{snapshot.securityId}</span></p>
                        )}
                        {selectedFields.entryDate && (
                          <p><b>Ngày tuyển dụng vào ngành:</b> {formatViDate(snapshot.entryDate)}</p>
                        )}
                        {selectedFields.rank && (
                          <p>
                            <b>Cấp bậc hàm hiện tại:</b> <span className="font-semibold text-slate-900">{snapshot.rank ? snapshot.rank.rank : 'Chưa có quân hàm'}</span>
                            {snapshot.rank && <span className="text-slate-500 text-2xs"> (Nhận ngày: {formatViDate(snapshot.rank.date)})</span>}
                          </p>
                        )}
                        {selectedFields.position && (
                          <p>
                            <b>Chức vụ hiện tại:</b> <span className="font-semibold text-slate-900">{snapshot.position ? snapshot.position.position : 'Cán bộ chiến sĩ'}</span>
                            {snapshot.position && <span className="text-slate-500 text-2xs"> (Quyết định ngày: {formatViDate(snapshot.position.date)})</span>}
                          </p>
                        )}
                        {selectedFields.unit && (
                          <p className="col-span-full">
                            <b>Đơn vị công tác hiện tại:</b> <span className="font-semibold text-slate-900">{snapshot.unit ? snapshot.unit.unit : 'Chưa phân công'}</span>
                            {snapshot.unit && (
                              <span className="text-slate-500 text-2xs">
                                {" "}(Điều động ngày: {formatViDate(snapshot.unit.date)}
                                {snapshot.unit.action === 'Chuyển đến' && snapshot.unit.fromUnit ? `, chuyển đến từ: ${snapshot.unit.fromUnit}` : ''})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Section C: Party Member */}
                    {selectedFields.hasDang && (
                      <div className="space-y-2.5 pt-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                          C. Thông tin Đảng viên
                        </h4>
                        {snapshot.hasDang ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                            <p><b>Ngày vào Đảng:</b> {formatViDate(snapshot.dangEntryDate)}</p>
                            <p><b>Ngày chính thức:</b> {formatViDate(snapshot.dangOfficialDate)}</p>
                            <p>
                              <b>Số thẻ Đảng viên:</b> <span className="font-mono">{snapshot.dangCardId || 'Chưa cấp/không lưu'}</span>
                            </p>
                            <p>
                              <b>Ngày cấp thẻ Đảng:</b> {formatViDate(snapshot.dangCardIssueDate)} tại {snapshot.dangCardIssuePlace || '---'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Tính đến mốc thời gian tra cứu, cán bộ chiến sĩ chưa vào Đảng Cộng sản Việt Nam.</p>
                        )}
                      </div>
                    )}

                    {/* Section D: Education & Capacity Building */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                        D. Đào tạo, bồi dưỡng cán bộ
                      </h4>

                      {/* 1. Nghiệp vụ CA */}
                      {selectedFields.nghiepVu && (
                        <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              1. Nghiệp vụ Công an
                            </h5>
                            {filteredCounts.nghiepVu > 0 && (
                              <span className="text-2xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚠️ Đã lọc bỏ {filteredCounts.nghiepVu} bằng cấp cấp thấp hơn
                              </span>
                            )}
                          </div>
                          {snapshot.nghiepVu.length > 0 ? (
                            <ul className="space-y-2 text-xs">
                              {snapshot.nghiepVu.map(nv => (
                                <li key={nv.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="font-semibold text-slate-900">
                                    Trình độ {nv.degree} • Trường: {nv.school}
                                  </p>
                                  <p className="text-slate-600 mt-1">
                                    Chuyên ngành: {nv.major} | Số hiệu văn bằng: <span className="font-mono">{nv.diplomaNumber}</span> | Cấp ngày: {formatViDate(nv.dateOfIssue)}
                                  </p>
                                  <p className="text-slate-500 text-2xs mt-0.5">
                                    Hình thức đào tạo: {nv.trainingForm}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Không có dữ liệu bằng cấp Nghiệp vụ CA tính đến ngày {formatViDate(targetDate)}</p>
                          )}
                        </div>
                      )}

                      {/* 2. Chuyên môn */}
                      {selectedFields.chuyenMon && (
                        <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              2. Chuyên môn (ngoài Công an)
                            </h5>
                            {filteredCounts.chuyenMon > 0 && (
                              <span className="text-2xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚠️ Đã lọc bỏ {filteredCounts.chuyenMon} bằng cấp cấp thấp hơn
                              </span>
                            )}
                          </div>
                          {snapshot.chuyenMon.length > 0 ? (
                            <ul className="space-y-2 text-xs">
                              {snapshot.chuyenMon.map(cm => (
                                <li key={cm.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="font-semibold text-slate-900">
                                    Trình độ {cm.degree} • Trường: {cm.school}
                                  </p>
                                  <p className="text-slate-600 mt-1">
                                    Chuyên ngành: {cm.major} | Số hiệu văn bằng: <span className="font-mono">{cm.diplomaNumber}</span> | Cấp ngày: {formatViDate(cm.dateOfIssue)}
                                  </p>
                                  <p className="text-slate-500 text-2xs mt-0.5">
                                    Hình thức đào tạo: {cm.trainingForm}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Không có dữ liệu bằng cấp Chuyên môn ngoài ngành tính đến ngày {formatViDate(targetDate)}</p>
                          )}
                        </div>
                      )}

                      {/* 3. Lý luận chính trị */}
                      {selectedFields.lyLuan && (
                        <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                          <div className="flex justify-between items-center">
                            <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              3. Lý luận chính trị
                            </h5>
                            {filteredCounts.lyLuan > 0 && (
                              <span className="text-2xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⚠️ Đã lọc bỏ {filteredCounts.lyLuan} bằng cấp thấp hơn
                              </span>
                            )}
                          </div>
                          {snapshot.lyLuan.length > 0 ? (
                            <ul className="space-y-2 text-xs">
                              {snapshot.lyLuan.map(ll => (
                                <li key={ll.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="font-semibold text-slate-900">
                                    Trình độ {ll.level} ({ll.type}) • Cơ sở đào tạo: {ll.facility}
                                  </p>
                                  <p className="text-slate-600 mt-1">
                                    Số văn bằng: <span className="font-mono">{ll.diplomaNumber}</span> | Cấp ngày: {formatViDate(ll.dateOfIssue)} | Hình thức: {ll.trainingForm}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Không có dữ liệu lý luận chính trị tính đến ngày {formatViDate(targetDate)}</p>
                          )}
                        </div>
                      )}

                      {/* 4. Bồi dưỡng */}
                      {selectedFields.boiDuong && (
                        <div className="space-y-1.5 pl-3 border-l-2 border-emerald-500">
                          <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                            4. Chứng chỉ bồi dưỡng, tập huấn (Hiển thị đầy đủ timeline)
                          </h5>
                          {snapshot.boiDuong.length > 0 ? (
                            <ul className="space-y-2 text-xs">
                              {snapshot.boiDuong.map(bd => (
                                <li key={bd.id} className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                  <p className="font-semibold text-slate-900">
                                    Lĩnh vực bồi dưỡng: <span className="text-emerald-800">{bd.field}</span>
                                  </p>
                                  <p className="text-slate-600 mt-1">
                                    Cơ sở tổ chức: {bd.facility} | Số văn bằng: <span className="font-mono">{bd.diplomaNumber}</span> | Ngày ký quyết định: {formatViDate(bd.dateOfIssue)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Không có chứng chỉ bồi dưỡng tập huấn nào tính đến ngày {formatViDate(targetDate)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
