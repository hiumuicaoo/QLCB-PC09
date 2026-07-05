/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { PersonnelProfile } from '../types';
import { formatViDate } from '../utils';
import { useToast } from './Toast';
import DateInput from './DateInput';
import { 
  ArrowLeft, 
  Edit2, 
  ShieldAlert, 
  GraduationCap, 
  Award, 
  Phone, 
  Calendar, 
  MapPin, 
  Tag, 
  UserCheck, 
  ShieldCheck,
  UserX,
  Upload,
  Eye,
  FileImage,
  Clock,
  Briefcase,
  Layers,
  CheckCircle,
  FileText,
  Trash2,
  HeartPulse,
  Printer,
  X
} from 'lucide-react';

interface PersonnelDetailProps {
  profile: PersonnelProfile;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onDeactivate: (id: string, destination: string, date: string) => void;
  onActivate: (id: string, source: string, date: string) => void;
  onUpdate: (id: string, updatedData: Partial<PersonnelProfile>) => void;
}

const calculateYears = (dateStr: string | undefined): number => {
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

export default function PersonnelDetail({
  profile,
  onBack,
  onEdit,
  onDelete,
  onDeactivate,
  onActivate,
  onUpdate,
}: PersonnelDetailProps) {
  const { success, error } = useToast();
  const isInactive = profile.status === 'inactive';

  const getAbsolutePdfPath = (imageUrl: string | undefined): string => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('data:')) return 'Dữ liệu Base64 đính kèm trực tiếp';
    
    const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';
    if (isElectron) {
      try {
        const path = (window as any).require('path');
        if (!path.isAbsolute(imageUrl)) {
          const customPath = localStorage.getItem('custom_data_path') || '';
          
          let defaultPath = 'D:\\QLCB';
          try {
            const fs = (window as any).require('fs');
            const os = (window as any).require('os');
            if (!fs.existsSync(defaultPath)) {
              try {
                fs.mkdirSync(defaultPath, { recursive: true });
              } catch (mkdirErr) {
                defaultPath = path.join(os.homedir(), 'PC09_Data');
              }
            }
          } catch (e) {
            // fallback
          }

          const activePath = customPath || defaultPath;
          return path.join(activePath, imageUrl);
        }
      } catch (e) {
        console.error('Error resolving absolute PDF path:', e);
      }
    }
    return imageUrl;
  };

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn XOÁ HOÀN TOÀN hồ sơ của đồng chí ${profile.personal.fullName} khỏi cơ sở dữ liệu? Hành động này sẽ xoá vĩnh viễn và không thể khôi phục.`)) {
      onDelete(profile.id);
      onBack();
    }
  };

  // Detail view local modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateDest, setDeactivateDest] = useState('');
  const [deactivateDate, setDeactivateDate] = useState(new Date().toISOString().split('T')[0]);

  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateSource, setActivateSource] = useState('Đội 1 – PC09');
  const [activateDate, setActivateDate] = useState(new Date().toISOString().split('T')[0]);

  // Image upload trigger state
  const [uploadTarget, setUploadTarget] = useState<{
    type: 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong';
    id: string;
    name: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ImageViewer state
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState<string>('');
  const [viewingPath, setViewingPath] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [printDuplex, setPrintDuplex] = useState<boolean>(true); // Cấu hình mặc định in 2 mặt

  useEffect(() => {
    if (!viewingImage) {
      setPdfBlobUrl('');
      return;
    }

    let activeUrl = '';
    let resolvedPath = viewingImage;
    const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';

    if (isElectron && !viewingImage.startsWith('data:')) {
      try {
        const path = (window as any).require('path');
        if (!path.isAbsolute(viewingImage)) {
          const customPath = localStorage.getItem('custom_data_path') || '';
          
          let defaultPath = 'D:\\QLCB';
          try {
            const fs = (window as any).require('fs');
            const os = (window as any).require('os');
            if (!fs.existsSync(defaultPath)) {
              try {
                fs.mkdirSync(defaultPath, { recursive: true });
              } catch (mkdirErr) {
                defaultPath = path.join(os.homedir(), 'PC09_Data');
              }
            }
          } catch (e) {
            // fallback
          }

          const activePath = customPath || defaultPath;
          resolvedPath = path.join(activePath, viewingImage);
        }
      } catch (e) {
        console.error('Lỗi định tuyến tệp đính kèm trong Electron:', e);
      }
    }
    
    // Nếu là dữ liệu Base64 PDF
    if (resolvedPath.startsWith('data:application/pdf;base64,') || (!resolvedPath.includes('/') && !resolvedPath.includes('\\'))) {
      try {
        const base64Content = resolvedPath.includes(',') ? resolvedPath.split(',')[1] : resolvedPath;
        const binaryString = atob(base64Content);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        activeUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(activeUrl);
      } catch (e) {
        console.error('Lỗi khi chuyển đổi Base64 sang Blob URL:', e);
        setPdfBlobUrl(resolvedPath);
      }
    } else {
      // Nếu chạy trong môi trường Electron và là đường dẫn tệp tin cục bộ
      if (isElectron) {
        try {
          const fs = (window as any).require('fs');
          if (fs.existsSync(resolvedPath)) {
            const fileBuffer = fs.readFileSync(resolvedPath);
            const blob = new Blob([fileBuffer], { type: 'application/pdf' });
            activeUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(activeUrl);
          } else {
            setPdfBlobUrl(resolvedPath);
          }
        } catch (e) {
          console.error('Lỗi khi đọc file cục bộ bằng Electron fs:', e);
          setPdfBlobUrl(resolvedPath);
        }
      } else {
        setPdfBlobUrl(resolvedPath);
      }
    }

    // Cleanup: giải phóng bộ nhớ của blob url khi đóng popup
    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [viewingImage]);

  const handleDeactivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeactivate(profile.id, deactivateDest, deactivateDate);
    setShowDeactivateModal(false);
    success(`Đã vô hiệu hóa thành công hồ sơ của đồng chí ${profile.personal.fullName}.`);
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActivate(profile.id, activateSource, activateDate);
    setShowActivateModal(false);
    success(`Đã kích hoạt thành công hồ sơ của đồng chí ${profile.personal.fullName}.`);
  };

  const triggerUploadFile = (type: 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong', id: string, name: string) => {
    setUploadTarget({ type, id, name });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      error("⚠️ LỖI: Hệ thống chỉ chấp nhận tải lên văn bằng dạng PDF!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const nowStr = new Date().toLocaleString('vi-VN');

      // Update local storage via onUpdate callback
      const type = uploadTarget.type;
      const updatedDaoTao = { ...profile.daoTao };
      
      updatedDaoTao[type] = (updatedDaoTao[type] as any[]).map((item) => {
        if (item.id === uploadTarget.id) {
          return {
            ...item,
            imageUrl: base64,
            imageUploadedAt: nowStr,
          };
        }
        return item;
      });

      onUpdate(profile.id, { daoTao: updatedDaoTao });
      
      // Virtual physical storage notification to client
      const virtualPath = `D:/QLCB/dao_tao/${type}/${profile.personal.fullName.replace(/\s+/g, '_')}_${uploadTarget.id}_diploma.pdf`;
      success(`[HỆ THỐNG OFFLINE] Đã cập nhật tệp văn bằng PDF thành công!\n\nTệp gốc đã được đồng bộ nội bộ tại:\n👉 ${virtualPath}\n\nThời gian cập nhật: ${nowStr}`);
      
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="personnel_detail_view">
      {/* 1. Status Warning Banner */}
      {isInactive && (
        <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-950 uppercase tracking-wide">Hồ sơ đã bị Vô hiệu hóa (Đã chuyển đi)</h3>
            <p className="text-xs text-rose-800 leading-relaxed font-semibold">
              Mọi thông tin trong hồ sơ của đồng chí <b>{profile.personal.fullName}</b> đã bị KHÓA kể từ thời điểm chuyển đi.{' '}
              Người này hiện không thuộc quản lý của đơn vị.
            </p>
            {profile.statusHistory && profile.statusHistory.length > 0 && (
              <div className="pt-2 text-2xs text-rose-600 space-y-0.5">
                {profile.statusHistory.filter(h => h.type === 'deactivate').map((h, i) => (
                  <p key={i}>
                    👉 Đã chuyển đến <b>{h.location}</b> vào ngày <b>{formatViDate(h.date)}</b>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Header with Title and Actions */}
      <div className="bg-white rounded-2xl border border-slate-150 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{profile.personal.fullName}</h2>
                {isInactive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                    Chuyển đi
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Đang công tác
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Mã cán bộ: {profile.id} • Số hiệu: {profile.cand.securityId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isInactive ? (
              <>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa hồ sơ
                </button>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer"
                >
                  <UserX className="w-4 h-4" />
                  Vô hiệu hồ sơ
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 cursor-pointer"
                  title="Xoá vĩnh viễn hồ sơ khỏi hệ thống"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá hồ sơ
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowActivateModal(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer animate-pulse"
                >
                  <UserCheck className="w-4 h-4" />
                  Kích hoạt trở lại
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 cursor-pointer"
                  title="Xoá vĩnh viễn hồ sơ khỏi hệ thống"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá hồ sơ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Detail Body Grid */}
        <div className="p-6 space-y-8 text-slate-700 text-xs">
          {/* Row 1: Quick info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card A: Personal information */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 space-y-3.5">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-blue-700">
                <Tag className="w-4 h-4" />
                A. Thông tin cá nhân
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between">
                  <span className="text-slate-400">Họ và tên:</span>
                  <span className="font-bold text-slate-800">{profile.personal.fullName}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Giới tính:</span>
                  <span className="font-semibold text-slate-800">{profile.personal.gender}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Ngày sinh:</span>
                  <span className="font-semibold text-slate-800">{formatViDate(profile.personal.dob)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Quê quán:</span>
                  <span className="font-semibold text-slate-800">{profile.personal.hometown}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Dân tộc:</span>
                  <span className="font-semibold text-slate-800">{profile.personal.ethnicity}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Tôn giáo:</span>
                  <span className="font-semibold text-slate-800">{profile.personal.religion}</span>
                </li>
                <li className="flex justify-between border-t border-slate-100 pt-1.5">
                  <span className="text-slate-400 font-bold">Số điện thoại:</span>
                  <span className="font-bold text-indigo-700">{profile.personal.phone || 'Chưa có'}</span>
                </li>
                {profile.personal.bhytHistory && profile.personal.bhytHistory.length > 0 && (
                  <li className="flex flex-col border-t border-slate-100 pt-1.5 space-y-1">
                    <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <HeartPulse className="w-3 h-3 text-emerald-500 animate-pulse" /> Thẻ BHYT hiện tại
                    </span>
                    <div className="text-2xs pl-4 space-y-0.5">
                      <p className="font-bold text-slate-800">Số thẻ: <span className="font-mono text-emerald-700">{[...profile.personal.bhytHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].cardNumber}</span></p>
                      <p className="text-slate-600">KCBBĐ: {[...profile.personal.bhytHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].registrationPlace || '---'}</p>
                      <p className="text-slate-500 font-semibold">Hạn hiệu lực: {formatViDate([...profile.personal.bhytHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].startDate)} đến {formatViDate([...profile.personal.bhytHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0].endDate)}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Card B: CAND Information */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 space-y-3.5">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-indigo-700">
                <ShieldAlert className="w-4 h-4" />
                B. Thông tin Công tác CAND
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between">
                  <span className="text-slate-400">Ngày vào CAND:</span>
                  <span className="font-semibold text-slate-800">{formatViDate(profile.cand.entryDate)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Tuổi ngành:</span>
                  <span className="font-bold text-indigo-700">{calculateYears(profile.cand.entryDate)} năm</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Số hiệu CAND:</span>
                  <span className="font-bold font-mono text-slate-800">{profile.cand.securityId}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Cấp bậc hàm hiện tại:</span>
                  <span className="font-bold text-blue-700">
                    {profile.cand.rankHistory.length > 0 
                      ? [...profile.cand.rankHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank 
                      : 'Chưa thăng/hạ'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Chức vụ hiện tại:</span>
                  <span className="font-bold text-slate-800">
                    {profile.cand.positionHistory.length > 0 
                      ? [...profile.cand.positionHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position 
                      : 'Cán bộ'}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Đơn vị công tác hiện tại:</span>
                  <span className="font-semibold text-slate-800">
                    {profile.cand.unitHistory.length > 0 
                      ? [...profile.cand.unitHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].unit 
                      : 'Chưa phân công'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Card C: Party Group Info */}
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 space-y-3.5">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1.5 text-rose-700">
                <Award className="w-4 h-4" />
                C. Thông tin Đảng / Đoàn thể
              </h3>
              {profile.dang.hasDang ? (
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between">
                    <span className="text-slate-400">Tình trạng Đảng:</span>
                    <span className="font-extrabold text-rose-600 uppercase">Đảng viên</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Ngày vào Đảng:</span>
                    <span className="font-semibold text-slate-800">{formatViDate(profile.dang.entryDate)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Tuổi Đảng:</span>
                    <span className="font-bold text-rose-700">{calculateYears(profile.dang.entryDate)} năm</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Ngày chính thức:</span>
                    <span className="font-semibold text-slate-800">{formatViDate(profile.dang.officialDate)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Số thẻ Đảng viên:</span>
                    <span className="font-bold font-mono text-slate-800">{profile.dang.cardId || 'Chưa cập nhật'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">Ngày cấp thẻ:</span>
                    <span className="font-semibold text-slate-800">{formatViDate(profile.dang.cardIssueDate)}</span>
                  </li>
                </ul>
              ) : (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <p className="font-bold text-slate-500 text-xs">Quần chúng Nhân dân</p>
                  <p className="text-2xs">Chưa ghi nhận thông tin kết nạp Đảng</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Detail Timelines (Rank, Unit, Chức danh, CCCD) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Timeline 1: Cấp bậc hàm */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Lịch sử Thăng cấp bậc hàm
              </h3>
              <div className="relative pl-3.5 border-l border-slate-200 ml-1.5 space-y-4 text-xs">
                {profile.cand.rankHistory.map((r, i) => (
                  <div key={r.id || i} className="relative">
                    <span className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white ring-4 ring-indigo-50" />
                    <div>
                      <span className="text-2xs font-semibold font-mono text-slate-400">{formatViDate(r.date)}</span>
                      <p className="font-bold text-slate-800 mt-0.5">{r.rank}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline 2: Quá trình Điều động PC09 */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                Quá trình Điều động PC09
              </h3>
              <div className="relative pl-3.5 border-l border-slate-200 ml-1.5 space-y-4 text-xs">
                {profile.cand.unitHistory.map((u, i) => (
                  <div key={u.id || i} className="relative">
                    <span className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500 border border-white ring-4 ring-slate-100" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xs font-semibold font-mono text-slate-400">{formatViDate(u.date)}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          u.action === 'Chuyển đến'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                            : 'bg-rose-50 text-rose-700 border border-rose-150'
                        }`}>
                          {u.action || 'Chuyển đến'}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {u.unit}
                        {u.action === 'Chuyển đến' && u.fromUnit && (
                          <span className="text-slate-500 font-medium text-2xs block sm:inline sm:ml-1.5 italic">
                            (Chuyển đến từ: {u.fromUnit})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline 3: Quá trình Chức danh */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Quá trình bổ nhiệm Chức danh
              </h3>
              <div className="relative pl-3.5 border-l border-slate-200 ml-1.5 space-y-4 text-xs">
                {profile.cand.chucDanhHistory && profile.cand.chucDanhHistory.length > 0 ? (
                  [...profile.cand.chucDanhHistory]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((cd, i) => (
                      <div key={cd.id || i} className="relative">
                        <span className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white ring-4 ring-emerald-50" />
                        <div>
                          <span className="text-2xs font-semibold font-mono text-slate-400">{formatViDate(cd.date)}</span>
                          <p className="font-bold text-slate-800 mt-0.5">{cd.ngach} - {cd.bac}</p>
                          <p className="text-slate-400 text-2xs font-semibold">{cd.action}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 italic text-2xs">Chưa có thông tin bổ nhiệm chức danh.</p>
                )}
              </div>
            </div>

            {/* Timeline 4: Lịch sử CCCD */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                Lịch sử thay đổi số CCCD
              </h3>
              <div className="relative pl-3.5 border-l border-slate-200 ml-1.5 space-y-4 text-xs">
                {profile.personal.cccdHistory && profile.personal.cccdHistory.length > 0 ? (
                  [...profile.personal.cccdHistory]
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((c, i) => (
                      <div key={c.id || i} className="relative">
                        <span className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white ring-4 ring-blue-50" />
                        <div>
                          <span className="text-2xs font-semibold font-mono text-slate-400">{formatViDate(c.date)}</span>
                          <p className="font-bold text-slate-800 mt-0.5">Số: {c.number}</p>
                          <p className="text-slate-500 text-2xs">Nơi cấp: {c.place}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 italic text-2xs">Chưa có thông tin CCCD.</p>
                )}
              </div>
            </div>

            {/* Timeline 5: Lịch sử BHYT */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white space-y-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
                Lịch sử Bảo hiểm y tế (BHYT)
              </h3>
              <div className="relative pl-3.5 border-l border-slate-200 ml-1.5 space-y-4 text-xs">
                {profile.personal.bhytHistory && profile.personal.bhytHistory.length > 0 ? (
                  [...profile.personal.bhytHistory]
                    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((b, i) => (
                      <div key={b.id || i} className="relative">
                        <span className="absolute -left-[19.5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white ring-4 ring-emerald-50" />
                        <div>
                          <span className="text-2xs font-semibold font-mono text-slate-400">Từ {formatViDate(b.startDate)} đến {formatViDate(b.endDate)}</span>
                          <p className="font-bold text-slate-800 mt-0.5">Số thẻ: {b.cardNumber}</p>
                          <p className="text-slate-500 text-2xs">KCBBĐ: {b.registrationPlace || '---'}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 italic text-2xs">Chưa có thông tin BHYT.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section D: Danh sách văn bằng đào tạo, bồi dưỡng tích lũy */}
          <div className="border border-slate-150 rounded-2xl p-6 space-y-6 bg-white shadow-3xs">
            <h3 className="font-bold text-slate-950 uppercase tracking-wider text-xs border-b border-slate-150 pb-2.5 flex items-center gap-1.5">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              D. Quản lý Hình ảnh văn bằng & chứng chỉ đào tạo, bồi dưỡng
            </h3>

            {/* Hidden Input for handling image upload */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="application/pdf" 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Nghiệp vụ CA */}
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-950 text-2xs uppercase tracking-wider border-l-2 border-emerald-500 pl-2">1. Đào tạo Nghiệp vụ CAND</h4>
                <ul className="space-y-3">
                  {profile.daoTao.nghiepVu.map(nv => (
                    <li key={nv.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">
                          Trình độ: <span className="text-emerald-700 font-extrabold">{nv.degree}</span> • Trường: {nv.school}
                        </p>
                        <p className="text-slate-600 font-medium">Ngành: {nv.major} • Văn bằng số: <span className="font-mono">{nv.diplomaNumber}</span></p>
                        <p className="text-2xs text-slate-500 font-semibold">Ngày cấp bằng: {formatViDate(nv.dateOfIssue)} • Hình thức: {nv.trainingForm}</p>
                        {nv.imageUploadedAt && (
                          <p className="text-2xs text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                            <Clock className="w-3 h-3 text-indigo-500" /> Updated: {nv.imageUploadedAt}
                          </p>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-150/50">
                        <button
                          type="button"
                          onClick={() => triggerUploadFile('nghiepVu', nv.id, `Văn bằng ${nv.degree} - ${nv.major}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-2xs font-bold text-indigo-700 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                        >
                          <Upload className="w-3 h-3" />
                          {nv.imageUrl ? 'Cập nhật PDF' : 'Tải lên tệp PDF'}
                        </button>
                        {nv.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingImage(nv.imageUrl!);
                              setViewingTitle(`Văn bằng ${nv.degree} - Ngành: ${nv.major}`);
                              setViewingPath(getAbsolutePdfPath(nv.imageUrl!));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-2xs font-bold text-indigo-700 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Xem văn bằng
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {profile.daoTao.nghiepVu.length === 0 && (
                    <p className="text-slate-400 italic text-2xs pl-2">Chưa có thông tin đào tạo nghiệp vụ.</p>
                  )}
                  </ul>
              </div>

              {/* 2. Chuyên môn */}
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-950 text-2xs uppercase tracking-wider border-l-2 border-emerald-500 pl-2">2. Đào tạo Chuyên môn (Ngoài ngành)</h4>
                <ul className="space-y-3">
                  {profile.daoTao.chuyenMon.map(cm => (
                    <li key={cm.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">
                          Trình độ: <span className="text-emerald-700 font-extrabold">{cm.degree}</span> • Trường: {cm.school}
                        </p>
                        <p className="text-slate-600 font-medium">Ngành: {cm.major} • Văn bằng số: <span className="font-mono">{cm.diplomaNumber}</span></p>
                        <p className="text-2xs text-slate-500 font-semibold">Ngày cấp bằng: {formatViDate(cm.dateOfIssue)} • Hình thức: {cm.trainingForm}</p>
                        {cm.imageUploadedAt && (
                          <p className="text-2xs text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                            <Clock className="w-3 h-3 text-indigo-500" /> Updated: {cm.imageUploadedAt}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-150/50">
                        <button
                          type="button"
                          onClick={() => triggerUploadFile('chuyenMon', cm.id, `Văn bằng ${cm.degree} - ${cm.major}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-2xs font-bold text-indigo-700 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                        >
                          <Upload className="w-3 h-3" />
                          {cm.imageUrl ? 'Cập nhật PDF' : 'Tải lên tệp PDF'}
                        </button>
                        {cm.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingImage(cm.imageUrl!);
                              setViewingTitle(`Văn bằng ${cm.degree} - Ngành: ${cm.major}`);
                              setViewingPath(getAbsolutePdfPath(cm.imageUrl!));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-2xs font-bold text-indigo-700 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Xem văn bằng
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {profile.daoTao.chuyenMon.length === 0 && (
                    <p className="text-slate-400 italic text-2xs pl-2">Chưa có thông tin đào tạo chuyên môn.</p>
                  )}
                </ul>
              </div>

              {/* 3. Lý luận chính trị */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-emerald-950 text-2xs uppercase tracking-wider border-l-2 border-emerald-500 pl-2">3. Lý luận chính trị</h4>
                <ul className="space-y-3">
                  {profile.daoTao.lyLuan.map(ll => (
                    <li key={ll.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">
                          Cấp học: <span className="text-indigo-700 font-extrabold">{ll.level}</span> ({ll.type})
                        </p>
                        <p className="text-slate-600 font-medium">Cơ sở đào tạo: {ll.facility} • Số hiệu: <span className="font-mono">{ll.diplomaNumber}</span></p>
                        <p className="text-2xs text-slate-500 font-semibold">Cấp ngày: {formatViDate(ll.dateOfIssue)} • Hình thức: {ll.trainingForm}</p>
                        {ll.imageUploadedAt && (
                          <p className="text-2xs text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                            <Clock className="w-3 h-3 text-indigo-500" /> Updated: {ll.imageUploadedAt}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-150/50">
                        <button
                          type="button"
                          onClick={() => triggerUploadFile('lyLuan', ll.id, `Văn bằng Lý luận ${ll.level}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-2xs font-bold text-indigo-700 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                        >
                          <Upload className="w-3 h-3" />
                          {ll.imageUrl ? 'Cập nhật PDF' : 'Tải lên tệp PDF'}
                        </button>
                        {ll.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingImage(ll.imageUrl!);
                              setViewingTitle(`Văn bằng Lý luận chính trị: ${ll.level}`);
                              setViewingPath(getAbsolutePdfPath(ll.imageUrl!));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-2xs font-bold text-indigo-700 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Xem văn bằng
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {profile.daoTao.lyLuan.length === 0 && (
                    <p className="text-slate-400 italic text-2xs pl-2">Chưa có thông tin lý luận chính trị.</p>
                  )}
                </ul>
              </div>

              {/* 4. Bồi dưỡng tập huấn */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-emerald-950 text-2xs uppercase tracking-wider border-l-2 border-emerald-500 pl-2">4. Bồi dưỡng nghiệp vụ chuyên đề</h4>
                <ul className="space-y-3">
                  {profile.daoTao.boiDuong.map(bd => (
                    <li key={bd.id} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-emerald-800">
                          Chuyên đề: {bd.field}
                        </p>
                        <p className="text-slate-600 font-medium">Cơ sở bồi dưỡng: {bd.facility} • Số chứng chỉ: <span className="font-mono">{bd.diplomaNumber}</span></p>
                        <p className="text-2xs text-slate-500 font-semibold">Quyết định cấp ngày: {formatViDate(bd.dateOfIssue)}</p>
                        {bd.imageUploadedAt && (
                          <p className="text-2xs text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                            <Clock className="w-3 h-3 text-indigo-500" /> Updated: {bd.imageUploadedAt}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex items-center gap-2 border-t border-slate-150/50">
                        <button
                          type="button"
                          onClick={() => triggerUploadFile('boiDuong', bd.id, `Chứng chỉ ${bd.field}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-2xs font-bold text-indigo-700 hover:text-white hover:bg-indigo-600 rounded-lg border border-indigo-200 transition-all cursor-pointer shadow-3xs"
                        >
                          <Upload className="w-3 h-3" />
                          {bd.imageUrl ? 'Cập nhật PDF' : 'Tải lên tệp PDF'}
                        </button>
                        {bd.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setViewingImage(bd.imageUrl!);
                              setViewingTitle(`Chứng chỉ bồi dưỡng chuyên đề: ${bd.field}`);
                              setViewingPath(getAbsolutePdfPath(bd.imageUrl!));
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-2xs font-bold text-indigo-700 rounded-lg border border-indigo-100 transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Xem văn bằng
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                  {profile.daoTao.boiDuong.length === 0 && (
                    <p className="text-slate-400 italic text-2xs pl-2">Chưa có thông tin bồi dưỡng, tập huấn.</p>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* DETAILED DIALOG MODAL: VÔ HIỆU HỒ SƠ */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">Vô hiệu hóa hồ sơ cán bộ</h3>
                <p className="text-2xs text-rose-700 font-semibold mt-0.5">{profile.personal.fullName}</p>
              </div>
            </div>
            <form onSubmit={handleDeactivateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nơi chuyển đi (Đơn vị tiếp nhận mới):</label>
                <input
                  type="text"
                  required
                  value={deactivateDest}
                  onChange={(e) => setDeactivateDest(e.target.value)}
                  placeholder="Ví dụ: PC01, PC02, PC03..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800 font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ngày chuyển đi:</label>
                <DateInput
                  required
                  value={deactivateDate}
                  onChange={(val) => setDeactivateDate(val)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeactivateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED DIALOG MODAL: KÍCH HOẠT HỒ SƠ */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Kích hoạt lại hồ sơ</h3>
                <p className="text-2xs text-emerald-700 font-semibold mt-0.5">{profile.personal.fullName}</p>
              </div>
            </div>
            <form onSubmit={handleActivateSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Đơn vị công tác tiếp nhận (Chuyển đến):</label>
                <select
                  required
                  value={activateSource}
                  onChange={(e) => setActivateSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800 font-medium"
                >
                  <option value="Đội 1 – PC09">Đội 1 – PC09</option>
                  <option value="Đội 2 – PC09">Đội 2 – PC09</option>
                  <option value="Đội 3 – PC09">Đội 3 – PC09</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ngày chuyển đến:</label>
                <DateInput
                  required
                  value={activateDate}
                  onChange={(val) => setActivateDate(val)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden text-slate-800"
                />
              </div>
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Kích hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP: ĐỘC LẬP XEM VĂN BẰNG (IMAGE LIGHTBOX VISUALIZER) */}
      {viewingImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
            {/* Header thanh lịch */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-0.5 min-w-0 flex-1 pr-4">
                <h4 className="text-xs font-bold truncate text-slate-100">{viewingTitle}</h4>
                <p className="text-[10px] font-mono text-slate-400 truncate">Đường dẫn tệp gốc: {viewingPath}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Nút in nhỏ phía trên tài liệu theo yêu cầu */}
                <button
                  type="button"
                  disabled={!pdfBlobUrl}
                  onClick={() => {
                    if (!pdfBlobUrl) return;
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    iframe.src = pdfBlobUrl;
                    document.body.appendChild(iframe);
                    iframe.onload = () => {
                      setTimeout(() => {
                        try {
                          iframe.contentWindow?.focus();
                          iframe.contentWindow?.print();
                        } catch (e) {
                          console.error('Print failed:', e);
                        }
                        setTimeout(() => {
                          document.body.removeChild(iframe);
                        }, 5000);
                      }, 500);
                    };
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer ${
                    !pdfBlobUrl ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="In tài liệu văn bằng"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In tài liệu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewingImage(null);
                    setViewingTitle('');
                    setViewingPath('');
                  }}
                  className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thân cửa sổ đơn giản, tối đa diện tích xem tài liệu */}
            <div className="p-4 bg-slate-950">
              <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                {pdfBlobUrl ? (
                  <iframe 
                    src={pdfBlobUrl} 
                    title={viewingTitle}
                    className="w-full h-[520px] rounded-lg bg-white shadow-lg border border-slate-700"
                  />
                ) : (
                  <div className="w-full h-[520px] flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-xs gap-3">
                    <div className="w-8 h-8 border-4 border-t-blue-500 border-slate-700 rounded-full animate-spin"></div>
                    <span>Đang chuẩn bị luồng dữ liệu PDF bảo mật...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer chân phương */}
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>ĐƠN VỊ KỸ THUẬT HÌNH SỰ - PC09</span>
              <span>LƯU TRỮ TRÊN THƯ MỤC D:/QLCB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
