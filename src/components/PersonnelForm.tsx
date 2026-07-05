/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { formatViDate } from '../utils';
import DateInput from './DateInput';
import { useToast } from './Toast';
import {
  PersonnelProfile,
  CCCDRecord,
  RankHistory,
  PositionHistory,
  UnitHistory,
  ChucDanhRecord,
  NghiepVuRecord,
  ChuyenMonRecord,
  LyLuanRecord,
  BoiDuongRecord,
  BHYTRecord
} from '../types';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  Award, 
  ShieldAlert, 
  BadgeCheck, 
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  Briefcase,
  ShieldCheck,
  HeartPulse,
  Printer
} from 'lucide-react';

interface PersonnelFormProps {
  initialProfile?: PersonnelProfile;
  onSubmit: (profileData: Omit<PersonnelProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function PersonnelForm({
  initialProfile,
  onSubmit,
  onCancel,
}: PersonnelFormProps) {
  const { success, error, warning } = useToast();
  // Current active sub-tab for the form categories
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // Section A: Personal Information
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [dob, setDob] = useState('');
  const [hometown, setHometown] = useState('');
  const [ethnicity, setEthnicity] = useState('Kinh');
  const [religion, setReligion] = useState('Không');
  const [phone, setPhone] = useState('');
  const [cccdHistory, setCccdHistory] = useState<CCCDRecord[]>([]);
  const [bhytHistory, setBhytHistory] = useState<BHYTRecord[]>([]);

  // Temporary Inline Form Inputs
  const [tmpBhyt, setTmpBhyt] = useState({ cardNumber: '', registrationPlace: '', startDate: '', endDate: '' });

  // Section B: CAND Info
  const [entryDate, setEntryDate] = useState('');
  const [securityId, setSecurityId] = useState('');
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);
  const [positionHistory, setPositionHistory] = useState<PositionHistory[]>([]);
  const [unitHistory, setUnitHistory] = useState<UnitHistory[]>([]);
  const [chucDanhHistory, setChucDanhHistory] = useState<ChucDanhRecord[]>([]);

  // Section C: Party Member Info
  const [hasDang, setHasDang] = useState(false);
  const [dangEntryDate, setDangEntryDate] = useState('');
  const [dangOfficialDate, setDangOfficialDate] = useState('');
  const [dangCardId, setDangCardId] = useState('');
  const [dangCardIssueDate, setDangCardIssueDate] = useState('');
  const [dangCardIssuePlace, setDangCardIssuePlace] = useState('');

  // Section D: Education and Training
  const [nghiepVu, setNghiepVu] = useState<NghiepVuRecord[]>([]);
  const [chuyenMon, setChuyenMon] = useState<ChuyenMonRecord[]>([]);
  const [lyLuan, setLyLuan] = useState<LyLuanRecord[]>([]);
  const [boiDuong, setBoiDuong] = useState<BoiDuongRecord[]>([]);

  // Temporary Inline Form Inputs
  const [tmpCccd, setTmpCccd] = useState({ number: '', place: '', date: '' });
  const [tmpRank, setTmpRank] = useState({ rank: 'Thiếu úy', date: '' });
  const [tmpPosition, setTmpPosition] = useState({ position: '', date: '' });
  const [tmpUnit, setTmpUnit] = useState({ unit: 'Đội 1 – PC09', date: '', action: 'Chuyển đến' as 'Chuyển đến' | 'Chuyển đi', fromUnit: '' });
  const [tmpChucDanh, setTmpChucDanh] = useState({
    ngach: 'Kỹ thuật viên' as 'Kỹ thuật viên' | 'Trinh sát viên' | 'Giám định viên',
    bac: 'Sơ cấp' as 'Sơ cấp' | 'Trung cấp' | 'Cao cấp',
    action: 'Bổ nhiệm' as 'Bổ nhiệm' | 'Chuyển ngạch' | 'Miễn nhiệm',
    date: '',
  });

  // Section D Temporary Inputs
  const [tmpNghiepVu, setTmpNghiepVu] = useState({
    degree: 'Đại học' as 'Tiến sĩ' | 'Thạc sĩ' | 'Đại học' | 'Cao đẳng' | 'Trung cấp',
    school: '',
    major: '',
    diplomaNumber: '',
    dateOfIssue: '',
    trainingForm: 'Tập trung' as 'Tập trung' | 'Không tập trung' | 'Khác',
  });
  const [tmpNghiepVuImage, setTmpNghiepVuImage] = useState<string | null>(null);
  const [tmpNghiepVuImageName, setTmpNghiepVuImageName] = useState('');

  const [tmpChuyenMon, setTmpChuyenMon] = useState({
    degree: 'Đại học' as 'Tiến sĩ' | 'Thạc sĩ' | 'Đại học' | 'Cao đẳng' | 'Trung cấp',
    school: '',
    major: '',
    diplomaNumber: '',
    dateOfIssue: '',
    trainingForm: 'Tập trung' as 'Tập trung' | 'Không tập trung' | 'Khác',
  });
  const [tmpChuyenMonImage, setTmpChuyenMonImage] = useState<string | null>(null);
  const [tmpChuyenMonImageName, setTmpChuyenMonImageName] = useState('');

  const [tmpLyLuan, setTmpLyLuan] = useState({
    type: 'Bằng' as 'Bằng' | 'Chứng nhận' | 'Chứng chỉ' | 'Khác',
    diplomaNumber: '',
    dateOfIssue: '',
    trainingForm: 'Tập trung' as 'Tập trung' | 'Không tập trung' | 'Khác',
    level: 'Trung cấp' as 'Cao cấp' | 'Trung cấp' | 'Sơ cấp',
    facility: '',
  });
  const [tmpLyLuanImage, setTmpLyLuanImage] = useState<string | null>(null);
  const [tmpLyLuanImageName, setTmpLyLuanImageName] = useState('');

  const [tmpBoiDuong, setTmpBoiDuong] = useState({
    diplomaNumber: '',
    dateOfIssue: '',
    facility: '',
    field: '',
  });
  const [tmpBoiDuongImage, setTmpBoiDuongImage] = useState<string | null>(null);
  const [tmpBoiDuongImageName, setTmpBoiDuongImageName] = useState('');

  // Row-level document viewing lightbox state
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingTitle, setViewingTitle] = useState('');

  // Ref triggers for hidden uploads inside form lists
  const listFileInputRef = useRef<HTMLInputElement>(null);
  const [listUploadTarget, setListUploadTarget] = useState<{
    listType: 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong';
    id: string;
  } | null>(null);

  // CCCD Autofill Constraint logic
  useEffect(() => {
    if (cccdHistory.length > 0) {
      setTmpCccd(prev => ({
        ...prev,
        number: cccdHistory[0].number,
        place: cccdHistory[0].place,
      }));
    }
  }, [cccdHistory]);

  // Populate form if in edit mode
  useEffect(() => {
    if (initialProfile) {
      setFullName(initialProfile.personal.fullName);
      setGender(initialProfile.personal.gender);
      setDob(initialProfile.personal.dob);
      setHometown(initialProfile.personal.hometown);
      setEthnicity(initialProfile.personal.ethnicity);
      setReligion(initialProfile.personal.religion);
      setPhone(initialProfile.personal.phone);
      setCccdHistory(initialProfile.personal.cccdHistory || []);
      setBhytHistory(initialProfile.personal.bhytHistory || []);

      setEntryDate(initialProfile.cand.entryDate);
      setSecurityId(initialProfile.cand.securityId);
      setRankHistory(initialProfile.cand.rankHistory || []);
      setPositionHistory(initialProfile.cand.positionHistory || []);
      setUnitHistory(initialProfile.cand.unitHistory || []);
      setChucDanhHistory(initialProfile.cand.chucDanhHistory || []);

      setHasDang(initialProfile.dang.hasDang);
      setDangEntryDate(initialProfile.dang.entryDate || '');
      setDangOfficialDate(initialProfile.dang.officialDate || '');
      setDangCardId(initialProfile.dang.cardId || '');
      setDangCardIssueDate(initialProfile.dang.cardIssueDate || '');
      setDangCardIssuePlace(initialProfile.dang.cardIssuePlace || '');

      setNghiepVu(initialProfile.daoTao.nghiepVu || []);
      setChuyenMon(initialProfile.daoTao.chuyenMon || []);
      setLyLuan(initialProfile.daoTao.lyLuan || []);
      setBoiDuong(initialProfile.daoTao.boiDuong || []);
    }
  }, [initialProfile]);

  // General Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      warning('Vui lòng điền Họ và tên.');
      setActiveTab('A');
      return;
    }
    if (!dob) {
      warning('Vui lòng nhập Ngày tháng năm sinh.');
      setActiveTab('A');
      return;
    }
    if (!securityId.trim()) {
      warning('Vui lòng nhập Số hiệu CAND.');
      setActiveTab('B');
      return;
    }

    const payload: Omit<PersonnelProfile, 'id' | 'createdAt' | 'updatedAt'> = {
      status: initialProfile?.status || 'active',
      statusHistory: initialProfile?.statusHistory || [],
      personal: {
        fullName,
        gender,
        dob,
        hometown,
        ethnicity,
        religion,
        phone,
        cccdHistory,
        bhytHistory,
      },
      cand: {
        entryDate,
        securityId,
        rankHistory,
        positionHistory,
        unitHistory,
        chucDanhHistory,
      },
      dang: {
        hasDang,
        entryDate: hasDang ? dangEntryDate : undefined,
        officialDate: hasDang ? dangOfficialDate : undefined,
        cardId: hasDang ? dangCardId : undefined,
        cardIssueDate: hasDang ? dangCardIssueDate : undefined,
        cardIssuePlace: hasDang ? dangCardIssuePlace : undefined,
      },
      daoTao: {
        nghiepVu,
        chuyenMon,
        lyLuan,
        boiDuong,
      },
    };

    onSubmit(payload);
  };

  // Timeline Addition Handlers
  const addCccd = () => {
    if (!tmpCccd.number || !tmpCccd.date) {
      warning('Vui lòng nhập số CCCD và ngày cấp.');
      return;
    }
    const newRecord: CCCDRecord = {
      id: `cccd_${Date.now()}`,
      number: tmpCccd.number,
      place: tmpCccd.place || 'Cục Cảnh sát QLHC về TTXH',
      date: tmpCccd.date,
    };
    setCccdHistory([...cccdHistory, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
    // Clear only date for subsequent additions, keeping fixed number/place
    setTmpCccd(prev => ({ ...prev, date: '' }));
  };

  const addBhyt = () => {
    if (!tmpBhyt.cardNumber || !tmpBhyt.startDate || !tmpBhyt.endDate) {
      warning('Vui lòng điền số thẻ BHYT, ngày hiệu lực và ngày hết hạn.');
      return;
    }
    const newRecord: BHYTRecord = {
      id: `bhyt_${Date.now()}`,
      cardNumber: tmpBhyt.cardNumber,
      registrationPlace: tmpBhyt.registrationPlace,
      startDate: tmpBhyt.startDate,
      endDate: tmpBhyt.endDate,
    };
    setBhytHistory([...bhytHistory, newRecord].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    setTmpBhyt({ cardNumber: '', registrationPlace: '', startDate: '', endDate: '' });
  };

  const addRank = () => {
    if (!tmpRank.rank || !tmpRank.date) {
      warning('Vui lòng chọn cấp bậc và ngày thăng/hạ cấp bậc hàm.');
      return;
    }
    const newRecord: RankHistory = {
      id: `rank_${Date.now()}`,
      rank: tmpRank.rank,
      date: tmpRank.date,
    };
    setRankHistory([...rankHistory, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setTmpRank({ rank: 'Thiếu úy', date: '' });
  };

  const addPosition = () => {
    if (!tmpPosition.position || !tmpPosition.date) {
      warning('Vui lòng điền chức vụ và ngày bổ nhiệm.');
      return;
    }
    const newRecord: PositionHistory = {
      id: `pos_${Date.now()}`,
      position: tmpPosition.position,
      date: tmpPosition.date,
    };
    setPositionHistory([...positionHistory, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setTmpPosition({ position: '', date: '' });
  };

  const addUnit = () => {
    if (!tmpUnit.unit || !tmpUnit.date) {
      warning('Vui lòng điền đơn vị và ngày tiếp nhận/điều động.');
      return;
    }
    const newRecord: UnitHistory = {
      id: `unit_${Date.now()}`,
      unit: tmpUnit.unit,
      date: tmpUnit.date,
      action: tmpUnit.action,
      fromUnit: tmpUnit.action === 'Chuyển đến' ? tmpUnit.fromUnit : undefined,
    };
    setUnitHistory([...unitHistory, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setTmpUnit({ unit: 'Đội 1 – PC09', date: '', action: 'Chuyển đến', fromUnit: '' });
  };

  const addChucDanh = () => {
    if (!tmpChucDanh.date) {
      warning('Vui lòng nhập ngày quyết định chức danh.');
      return;
    }
    const newRecord: ChucDanhRecord = {
      id: `cd_${Date.now()}`,
      ngach: tmpChucDanh.ngach,
      bac: tmpChucDanh.bac,
      action: tmpChucDanh.action,
      date: tmpChucDanh.date,
    };
    setChucDanhHistory([...chucDanhHistory, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setTmpChucDanh({
      ngach: 'Kỹ thuật viên',
      bac: 'Sơ cấp',
      action: 'Bổ nhiệm',
      date: '',
    });
  };

  // Local Section D Helper: Convert files to Base64
  const processNewImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      error("⚠️ LỖI: Hệ thống chỉ chấp nhận tải lên văn bằng dạng PDF!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'nghiepVu') {
        setTmpNghiepVuImage(base64);
        setTmpNghiepVuImageName(file.name);
      } else if (type === 'chuyenMon') {
        setTmpChuyenMonImage(base64);
        setTmpChuyenMonImageName(file.name);
      } else if (type === 'lyLuan') {
        setTmpLyLuanImage(base64);
        setTmpLyLuanImageName(file.name);
      } else if (type === 'boiDuong') {
        setTmpBoiDuongImage(base64);
        setTmpBoiDuongImageName(file.name);
      }
      
      const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';
      let storageFolderMessage = '';
      if (isElectron) {
        try {
          const customPath = localStorage.getItem('custom_data_path') || '';
          const path = (window as any).require('path');
          
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
          } catch (e) {}

          const activePath = customPath || defaultPath;
          const subMapping = {
            nghiepVu: 'nghiep_vu',
            chuyenMon: 'chuyen_mon',
            lyLuan: 'ly_luan',
            boiDuong: 'boi_duong'
          };
          const targetSubDir = subMapping[type] || 'khac';
          storageFolderMessage = `Tệp tin PDF này sẽ được lưu vật lý vào thư mục:\n👉 ${path.join(activePath, 'van_bang_pdf', targetSubDir)}`;
        } catch (err) {
          storageFolderMessage = `Đã lưu tệp đính kèm vật lý (Chạy dưới chế độ Offline)`;
        }
      } else {
        storageFolderMessage = `Đã tải lên bộ nhớ tạm ứng dụng`;
      }
      success(`[HỆ THỐNG OFFLINE] Đã tải lên văn bằng PDF thành công!\n\n${storageFolderMessage}`);
    };
    reader.readAsDataURL(file);
  };

  // Section D Submission Handlers with Image Required Validation
  const addNghiepVu = () => {
    if (!tmpNghiepVu.school || !tmpNghiepVu.major || !tmpNghiepVu.diplomaNumber || !tmpNghiepVu.dateOfIssue) {
      warning('Vui lòng nhập đầy đủ thông tin bằng cấp nghiệp vụ.');
      return;
    }
    // Mandatory image verification
    if (!tmpNghiepVuImage) {
      warning('❌ CẢNH BÁO: Bạn bắt buộc phải "Upload tệp PDF" văn bằng trước khi thêm vào hồ sơ cán bộ!');
      return;
    }

    const newRecord: NghiepVuRecord = {
      id: `nv_${Date.now()}`,
      ...tmpNghiepVu,
      imageUrl: tmpNghiepVuImage,
      imageUploadedAt: new Date().toLocaleString('vi-VN'),
    };
    setNghiepVu([...nghiepVu, newRecord].sort((a, b) => new Date(a.dateOfIssue).getTime() - new Date(b.dateOfIssue).getTime()));
    
    // Reset fields & image states
    setTmpNghiepVu({
      degree: 'Đại học',
      school: '',
      major: '',
      diplomaNumber: '',
      dateOfIssue: '',
      trainingForm: 'Tập trung',
    });
    setTmpNghiepVuImage(null);
    setTmpNghiepVuImageName('');
  };

  const addChuyenMon = () => {
    if (!tmpChuyenMon.school || !tmpChuyenMon.major || !tmpChuyenMon.diplomaNumber || !tmpChuyenMon.dateOfIssue) {
      warning('Vui lòng nhập đầy đủ thông tin bằng cấp chuyên môn.');
      return;
    }
    // Mandatory image verification
    if (!tmpChuyenMonImage) {
      warning('❌ CẢNH BÁO: Bạn bắt buộc phải "Upload tệp PDF" văn bằng chuyên môn trước khi thêm vào hồ sơ!');
      return;
    }

    const newRecord: ChuyenMonRecord = {
      id: `cm_${Date.now()}`,
      ...tmpChuyenMon,
      imageUrl: tmpChuyenMonImage,
      imageUploadedAt: new Date().toLocaleString('vi-VN'),
    };
    setChuyenMon([...chuyenMon, newRecord].sort((a, b) => new Date(a.dateOfIssue).getTime() - new Date(b.dateOfIssue).getTime()));
    
    setTmpChuyenMon({
      degree: 'Đại học',
      school: '',
      major: '',
      diplomaNumber: '',
      dateOfIssue: '',
      trainingForm: 'Tập trung',
    });
    setTmpChuyenMonImage(null);
    setTmpChuyenMonImageName('');
  };

  const addLyLuan = () => {
    if (!tmpLyLuan.diplomaNumber || !tmpLyLuan.dateOfIssue || !tmpLyLuan.facility) {
      warning('Vui lòng nhập đầy đủ thông tin lý luận chính trị.');
      return;
    }
    // Mandatory image verification
    if (!tmpLyLuanImage) {
      warning('❌ CẢNH BÁO: Bạn bắt buộc phải "Upload tệp PDF" chứng từ lý luận trước khi thêm vào hồ sơ!');
      return;
    }

    const newRecord: LyLuanRecord = {
      id: `ll_${Date.now()}`,
      ...tmpLyLuan,
      imageUrl: tmpLyLuanImage,
      imageUploadedAt: new Date().toLocaleString('vi-VN'),
    };
    setLyLuan([...lyLuan, newRecord].sort((a, b) => new Date(a.dateOfIssue).getTime() - new Date(b.dateOfIssue).getTime()));
    
    setTmpLyLuan({
      type: 'Bằng',
      diplomaNumber: '',
      dateOfIssue: '',
      trainingForm: 'Tập trung',
      level: 'Trung cấp',
      facility: '',
    });
    setTmpLyLuanImage(null);
    setTmpLyLuanImageName('');
  };

  const addBoiDuong = () => {
    if (!tmpBoiDuong.diplomaNumber || !tmpBoiDuong.dateOfIssue || !tmpBoiDuong.facility || !tmpBoiDuong.field) {
      warning('Vui lòng nhập đầy đủ thông tin chứng chỉ bồi dưỡng.');
      return;
    }
    // Mandatory image verification
    if (!tmpBoiDuongImage) {
      warning('❌ CẢNH BÁO: Bạn bắt buộc phải "Upload tệp PDF" chứng chỉ bồi dưỡng trước khi thêm vào hồ sơ!');
      return;
    }

    const newRecord: BoiDuongRecord = {
      id: `bd_${Date.now()}`,
      ...tmpBoiDuong,
      imageUrl: tmpBoiDuongImage,
      imageUploadedAt: new Date().toLocaleString('vi-VN'),
    };
    setBoiDuong([...boiDuong, newRecord].sort((a, b) => new Date(a.dateOfIssue).getTime() - new Date(b.dateOfIssue).getTime()));
    
    setTmpBoiDuong({
      diplomaNumber: '',
      dateOfIssue: '',
      facility: '',
      field: '',
    });
    setTmpBoiDuongImage(null);
    setTmpBoiDuongImageName('');
  };

  // Row-level inline updates inside table list
  const triggerListImageUpload = (listType: 'nghiepVu' | 'chuyenMon' | 'lyLuan' | 'boiDuong', id: string) => {
    setListUploadTarget({ listType, id });
    setTimeout(() => {
      listFileInputRef.current?.click();
    }, 50);
  };

  const handleListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !listUploadTarget) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      error("⚠️ LỖI: Hệ thống chỉ chấp nhận tải lên văn bằng dạng PDF!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const nowStr = new Date().toLocaleString('vi-VN');
      const { listType, id } = listUploadTarget;

      if (listType === 'nghiepVu') {
        setNghiepVu(nghiepVu.map(item => item.id === id ? { ...item, imageUrl: base64, imageUploadedAt: nowStr } : item));
      } else if (listType === 'chuyenMon') {
        setChuyenMon(chuyenMon.map(item => item.id === id ? { ...item, imageUrl: base64, imageUploadedAt: nowStr } : item));
      } else if (listType === 'lyLuan') {
        setLyLuan(lyLuan.map(item => item.id === id ? { ...item, imageUrl: base64, imageUploadedAt: nowStr } : item));
      } else if (listType === 'boiDuong') {
        setBoiDuong(boiDuong.map(item => item.id === id ? { ...item, imageUrl: base64, imageUploadedAt: nowStr } : item));
      }

      const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';
      let storageFolderMessage = '';
      if (isElectron) {
        try {
          const customPath = localStorage.getItem('custom_data_path') || '';
          const path = (window as any).require('path');
          
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
          } catch (e) {}

          const activePath = customPath || defaultPath;
          const subMapping = {
            nghiepVu: 'nghiep_vu',
            chuyenMon: 'chuyen_mon',
            lyLuan: 'ly_luan',
            boiDuong: 'boi_duong'
          };
          const targetSubDir = subMapping[listType as 'nghiepVu'|'chuyenMon'|'lyLuan'|'boiDuong'] || 'khac';
          storageFolderMessage = `Tệp gốc đã được lưu đè trực tiếp tại:\n👉 ${path.join(activePath, 'van_bang_pdf', targetSubDir, `${id}.pdf`)}`;
        } catch (err) {
          storageFolderMessage = `Đã cập nhật tệp đính kèm vật lý`;
        }
      } else {
        storageFolderMessage = `Lưu trữ trong bộ nhớ đệm trình duyệt`;
      }
      success(`[HỆ THỐNG OFFLINE] Đã cập nhật tệp PDF thành công!\n\n${storageFolderMessage}\n\nThời gian cập nhật: ${nowStr}`);
      setListUploadTarget(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 shadow-xs overflow-hidden" id="personnel_form_view">
      {/* Hidden File Input for list-level updates */}
      <input 
        type="file" 
        ref={listFileInputRef} 
        accept="application/pdf" 
        className="hidden" 
        onChange={handleListFileChange} 
      />

      {/* Header Form */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-bold text-slate-950 uppercase">
            {initialProfile ? `Chỉnh sửa hồ sơ: ${initialProfile.personal.fullName}` : 'Thêm hồ sơ cán bộ mới'}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Lưu lại toàn bộ hồ sơ
        </button>
      </div>

      {/* Categories Sub-Tabs Header */}
      <div className="flex bg-slate-50/50 border-b border-slate-100 px-6 overflow-x-auto gap-2">
        {(['A', 'B', 'C', 'D'] as const).map((tab) => {
          const tabLabels = {
            A: 'A. Thông tin cá nhân',
            B: 'B. Thông tin Công tác CAND',
            C: 'C. Thông tin Đảng viên',
            D: 'D. Đào tạo & Bồi dưỡng',
          };
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* Form Content Body */}
      <div className="p-6">
        
        {/* TAB A: PERSONAL INFO */}
        {activeTab === 'A' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-l-2 border-blue-500 pl-2">
              Thông tin cá nhân cơ bản
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Họ tên */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Họ và tên <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Ngày sinh */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Ngày sinh <span className="text-rose-500">*</span></label>
                <DateInput
                  required
                  value={dob}
                  onChange={(val) => setDob(val)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Giới tính */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Giới tính</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Quê quán */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Quê quán (Cố định)</label>
                <input
                  type="text"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                  placeholder="Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Dân tộc */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Dân tộc (Cố định)</label>
                <input
                  type="text"
                  value={ethnicity}
                  onChange={(e) => setEthnicity(e.target.value)}
                  placeholder="Kinh"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Tôn giáo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tôn giáo (Cố định)</label>
                <input
                  type="text"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="Không"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Số điện thoại di động</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            {/* CCCD Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                Lịch sử Số định danh / CCCD (chỉ thêm mốc ngày cấp mới)
              </h4>

              {/* Input row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">
                    Số định danh / CCCD {cccdHistory.length > 0 && <span className="text-indigo-600">(Đã khóa)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={cccdHistory.length > 0}
                    placeholder={cccdHistory.length > 0 ? cccdHistory[0].number : "Nhập số căn cước"}
                    value={tmpCccd.number}
                    onChange={(e) => setTmpCccd({ ...tmpCccd, number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">
                    Nơi cấp {cccdHistory.length > 0 && <span className="text-indigo-600">(Đã khóa)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={cccdHistory.length > 0}
                    placeholder={cccdHistory.length > 0 ? cccdHistory[0].place : "Cục Cảnh sát QLHC về TTXH"}
                    value={tmpCccd.place}
                    onChange={(e) => setTmpCccd({ ...tmpCccd, place: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white disabled:bg-slate-100 disabled:text-slate-500 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày cấp mới</label>
                  <DateInput
                    value={tmpCccd.date}
                    onChange={(val) => setTmpCccd({ ...tmpCccd, date: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCccd}
                  className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Ghi nhận cấp mới
                </button>
              </div>

              {/* Table CCCD history */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Mốc ngày cấp</th>
                      <th className="px-4 py-2">Số định danh / CCCD</th>
                      <th className="px-4 py-2">Nơi cấp</th>
                      <th className="px-4 py-2 text-right">Hủy bỏ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cccdHistory.map((c, i) => (
                      <tr key={c.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(c.date)}</td>
                        <td className="px-4 py-2 font-mono">{c.number}</td>
                        <td className="px-4 py-2 text-slate-500">{c.place}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setCccdHistory(cccdHistory.filter((item) => item.id !== c.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cccdHistory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có lịch sử CCCD nào được thiết lập.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BHYT Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-500" />
                Lịch sử Bảo hiểm y tế (BHYT)
              </h4>

              {/* Input row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Số thẻ BHYT</label>
                  <input
                    type="text"
                    placeholder="Nhập số thẻ BHYT"
                    value={tmpBhyt.cardNumber}
                    onChange={(e) => setTmpBhyt({ ...tmpBhyt, cardNumber: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Nơi đăng ký KCBBĐ</label>
                  <input
                    type="text"
                    placeholder="Nhập nơi đăng ký KCBBĐ"
                    value={tmpBhyt.registrationPlace}
                    onChange={(e) => setTmpBhyt({ ...tmpBhyt, registrationPlace: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày hiệu lực</label>
                  <DateInput
                    value={tmpBhyt.startDate}
                    onChange={(val) => setTmpBhyt({ ...tmpBhyt, startDate: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày hết hạn</label>
                  <DateInput
                    value={tmpBhyt.endDate}
                    onChange={(val) => setTmpBhyt({ ...tmpBhyt, endDate: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addBhyt}
                  className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Ghi nhận BHYT
                </button>
              </div>

              {/* Table BHYT history */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Mốc thời gian (Hiệu lực)</th>
                      <th className="px-4 py-2">Số thẻ BHYT</th>
                      <th className="px-4 py-2">Nơi đăng ký KCBBĐ</th>
                      <th className="px-4 py-2">Ngày hết hạn</th>
                      <th className="px-4 py-2 text-right">Hủy bỏ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bhytHistory.map((b, i) => (
                      <tr key={b.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(b.startDate)}</td>
                        <td className="px-4 py-2 font-mono">{b.cardNumber}</td>
                        <td className="px-4 py-2 text-slate-500">{b.registrationPlace || '---'}</td>
                        <td className="px-4 py-2 font-bold text-slate-500">{formatViDate(b.endDate)}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setBhytHistory(bhytHistory.filter((item) => item.id !== b.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {bhytHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có lịch sử BHYT nào được thiết lập.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB B: CAND INFO */}
        {activeTab === 'B' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
              Thông tin công tác CAND
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Ngày vào ngành CAND (Cố định)</label>
                <DateInput
                  value={entryDate}
                  onChange={(val) => setEntryDate(val)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Số hiệu CAND (Cố định)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 123-456"
                  value={securityId}
                  onChange={(e) => setSecurityId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* 1. Rank History */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                Lịch sử thăng cấp bậc hàm (Sắp xếp theo thời gian)
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Cấp bậc hàm</label>
                  <select
                    value={tmpRank.rank}
                    onChange={(e) => setTmpRank({ ...tmpRank, rank: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Thiếu úy">Thiếu úy</option>
                    <option value="Trung úy">Trung úy</option>
                    <option value="Thượng úy">Thượng úy</option>
                    <option value="Đại úy">Đại úy</option>
                    <option value="Thiếu tá">Thiếu tá</option>
                    <option value="Trung tá">Trung tá</option>
                    <option value="Thượng tá">Thượng tá</option>
                    <option value="Đại tá">Đại tá</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Ngày thăng/hạ cấp bậc hàm</label>
                  <DateInput
                    value={tmpRank.date}
                    onChange={(val) => setTmpRank({ ...tmpRank, date: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addRank}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm cấp hàm
                </button>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Ngày thăng/hạ cấp bậc hàm</th>
                      <th className="px-4 py-2">Bậc hàm</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankHistory.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(r.date)}</td>
                        <td className="px-4 py-2 font-bold text-indigo-700">{r.rank}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setRankHistory(rankHistory.filter((item) => item.id !== r.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rankHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có thông tin cấp hàm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Position History */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Quá trình Bổ nhiệm Chức vụ (Thay đổi theo thời gian)
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Chức vụ</label>
                  <input
                    type="text"
                    placeholder="Đội trưởng, Phó Đội trưởng..."
                    value={tmpPosition.position}
                    onChange={(e) => setTmpPosition({ ...tmpPosition, position: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Ngày bổ nhiệm</label>
                  <DateInput
                    value={tmpPosition.date}
                    onChange={(val) => setTmpPosition({ ...tmpPosition, date: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPosition}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm chức vụ
                </button>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Ngày bổ nhiệm</th>
                      <th className="px-4 py-2">Chức vụ</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {positionHistory.map((p, i) => (
                      <tr key={p.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(p.date)}</td>
                        <td className="px-4 py-2 text-slate-800 font-bold">{p.position}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setPositionHistory(positionHistory.filter((item) => item.id !== p.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {positionHistory.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có thông tin chức vụ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Unit History (PC09-centric) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Quá trình Điều động Đơn vị công tác (Mốc ngày, Hành động Chuyển đến/Chuyển đi, Đơn vị công tác)
              </h4>
              <div className={`bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 ${tmpUnit.action === 'Chuyển đến' ? 'lg:grid-cols-5' : 'md:grid-cols-4'} gap-3 items-end`}>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Hành động</label>
                  <select
                    value={tmpUnit.action}
                    onChange={(e) => {
                      const act = e.target.value as 'Chuyển đến' | 'Chuyển đi';
                      setTmpUnit({
                        ...tmpUnit,
                        action: act,
                        unit: act === 'Chuyển đến' ? 'Đội 1 – PC09' : '',
                        fromUnit: ''
                      });
                    }}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    <option value="Chuyển đến">Chuyển đến</option>
                    <option value="Chuyển đi">Chuyển đi</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Đơn vị công tác</label>
                  {tmpUnit.action === 'Chuyển đến' ? (
                    <select
                      value={tmpUnit.unit}
                      onChange={(e) => setTmpUnit({ ...tmpUnit, unit: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="Đội 1 – PC09">Đội 1 – PC09</option>
                      <option value="Đội 2 – PC09">Đội 2 – PC09</option>
                      <option value="Đội 3 – PC09">Đội 3 – PC09</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ví dụ: PC01, PC02..."
                      value={tmpUnit.unit}
                      onChange={(e) => setTmpUnit({ ...tmpUnit, unit: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  )}
                </div>
                {tmpUnit.action === 'Chuyển đến' && (
                  <div className="space-y-1">
                    <label className="text-2xs font-semibold text-slate-500">Chuyển đến từ (Đơn vị cũ)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: PC02, PC01, Công an huyện..."
                      value={tmpUnit.fromUnit || ''}
                      onChange={(e) => setTmpUnit({ ...tmpUnit, fromUnit: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Mốc ngày điều động</label>
                  <DateInput
                    value={tmpUnit.date}
                    onChange={(val) => setTmpUnit({ ...tmpUnit, date: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={addUnit}
                  className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm điều động
                </button>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Mốc ngày điều động</th>
                      <th className="px-4 py-2">Hành động</th>
                      <th className="px-4 py-2">Đơn vị công tác</th>
                      <th className="px-4 py-2">Chuyển đến từ</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unitHistory.map((u, i) => (
                      <tr key={u.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(u.date)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                            u.action === 'Chuyển đến'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                              : 'bg-rose-50 text-rose-700 border border-rose-150'
                          }`}>
                            {u.action || 'Chuyển đến'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-800 font-medium">{u.unit}</td>
                        <td className="px-4 py-2 text-slate-600 font-medium italic">
                          {u.action === 'Chuyển đến' ? (u.fromUnit || '---') : '---'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setUnitHistory(unitHistory.filter((item) => item.id !== u.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {unitHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có lịch sử chuyển đơn vị.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Chức danh History */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                Quá trình bổ nhiệm Chức danh (Ngạch, Bậc, Thời điểm bổ nhiệm/chuyển ngạch/miễn nhiệm)
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Ngạch chức danh</label>
                  <select
                    value={tmpChucDanh.ngach}
                    onChange={(e) => setTmpChucDanh({ ...tmpChucDanh, ngach: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                    <option value="Trinh sát viên">Trinh sát viên</option>
                    <option value="Giám định viên">Giám định viên</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Bậc</label>
                  <select
                    value={tmpChucDanh.bac}
                    onChange={(e) => setTmpChucDanh({ ...tmpChucDanh, bac: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Sơ cấp">Sơ cấp</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Cao cấp">Cao cấp</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Hành động</label>
                  <select
                    value={tmpChucDanh.action}
                    onChange={(e) => setTmpChucDanh({ ...tmpChucDanh, action: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Bổ nhiệm">Bổ nhiệm</option>
                    <option value="Chuyển ngạch">Chuyển ngạch</option>
                    <option value="Miễn nhiệm">Miễn nhiệm</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-semibold text-slate-500">Ngày quyết định</label>
                  <DateInput
                    value={tmpChucDanh.date}
                    onChange={(val) => setTmpChucDanh({ ...tmpChucDanh, date: val })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addChucDanh}
                  className="col-span-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-indigo-200 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Ghi nhận bổ nhiệm Chức danh
                </button>
              </div>

              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2">Ngày quyết định</th>
                      <th className="px-4 py-2">Ngạch</th>
                      <th className="px-4 py-2">Bậc</th>
                      <th className="px-4 py-2">Quyết định/Hành động</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chucDanhHistory.map((cd, i) => (
                      <tr key={cd.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-900">{formatViDate(cd.date)}</td>
                        <td className="px-4 py-2 font-bold text-slate-800">{cd.ngach}</td>
                        <td className="px-4 py-2 font-medium">{cd.bac}</td>
                        <td className="px-4 py-2 font-semibold text-indigo-700">{cd.action}</td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setChucDanhHistory(chucDanhHistory.filter((item) => item.id !== cd.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {chucDanhHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có lịch sử chức danh nào được tạo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB C: PARTY MEMBER INFO */}
        {activeTab === 'C' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-l-2 border-rose-500 pl-2">
              Thông tin kết nạp Đảng
            </h3>

            {/* Checkbox to define if Party member */}
            <label className="flex items-center gap-3 p-4 bg-rose-50/40 border border-rose-100 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={hasDang}
                onChange={(e) => setHasDang(e.target.checked)}
                className="w-4.5 h-4.5 text-rose-600 focus:ring-rose-500/20 border-slate-300 rounded-sm cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-900">Đồng chí này đã kết nạp Đảng Cộng Sản Việt Nam</span>
                <p className="text-2xs text-slate-400 mt-0.5">Tích chọn để hiển thị các biểu mẫu kê khai chi tiết số thẻ, ngày vào Đảng...</p>
              </div>
            </label>

            {hasDang && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-slate-100 rounded-2xl bg-white text-xs text-slate-700 animate-slideDown">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Ngày kết nạp Đảng (Ngày dự bị) <span className="text-rose-500">*</span></label>
                    <DateInput
                      required
                      value={dangEntryDate}
                      onChange={(val) => setDangEntryDate(val)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Ngày chuyển Đảng chính thức <span className="text-rose-500">*</span></label>
                    <DateInput
                      required
                      value={dangOfficialDate}
                      onChange={(val) => setDangOfficialDate(val)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Số thẻ Đảng viên <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập 8 số thẻ Đảng"
                      value={dangCardId}
                      onChange={(e) => setDangCardId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4 md:pl-5 md:border-l border-slate-150">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Ngày cấp thẻ Đảng viên</label>
                    <DateInput
                      value={dangCardIssueDate}
                      onChange={(val) => setDangCardIssueDate(val)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Nơi cấp thẻ Đảng viên</label>
                    <input
                      type="text"
                      placeholder="Đảng ủy Công an Thành phố..."
                      value={dangCardIssuePlace}
                      onChange={(e) => setDangCardIssuePlace(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB D: TRAINING & CAPACITY BUILDING (Mục D) */}
        {activeTab === 'D' && (
          <div className="space-y-8 animate-fadeIn text-xs text-slate-700">
            <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-800 leading-relaxed font-semibold">
              <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Nguyên tắc quản lý Văn bằng (Mục D)
              </h4>
              <p className="text-2xs font-medium">
                👉 [BẮT BUỘC]: Đối với mỗi văn bằng thêm mới, hình ảnh văn bằng scan/ảnh chụp bắt buộc phải được tải lên hệ thống trước khi click thêm văn bằng.
              </p>
            </div>

            {/* 1. NGHIỆP VỤ CA */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                1. Đào tạo Nghiệp vụ Công an
              </h3>
              
              {/* Form Input Nghiệp vụ */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Học vị</label>
                  <select
                    value={tmpNghiepVu.degree}
                    onChange={(e) => setTmpNghiepVu({ ...tmpNghiepVu, degree: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Trung cấp">Trung cấp</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Trường đào tạo</label>
                  <input
                    type="text"
                    placeholder="Học viện CSND..."
                    value={tmpNghiepVu.school}
                    onChange={(e) => setTmpNghiepVu({ ...tmpNghiepVu, school: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Ngành học</label>
                  <input
                    type="text"
                    placeholder="Luật, Cảnh sát..."
                    value={tmpNghiepVu.major}
                    onChange={(e) => setTmpNghiepVu({ ...tmpNghiepVu, major: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Số văn bằng</label>
                  <input
                    type="text"
                    placeholder="Số văn bằng"
                    value={tmpNghiepVu.diplomaNumber}
                    onChange={(e) => setTmpNghiepVu({ ...tmpNghiepVu, diplomaNumber: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày cấp bằng</label>
                  <DateInput
                    value={tmpNghiepVu.dateOfIssue}
                    onChange={(val) => setTmpNghiepVu({ ...tmpNghiepVu, dateOfIssue: val })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="text-2xs font-bold text-slate-600">Hình thức đào tạo</label>
                  <select
                    value={tmpNghiepVu.trainingForm}
                    onChange={(e) => setTmpNghiepVu({ ...tmpNghiepVu, trainingForm: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Tập trung">Tập trung</option>
                    <option value="Không tập trung">Không tập trung</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* IMAGE UPLOADER ELEMENT (MANDATORY BEFORE SAVING) */}
                <div className="col-span-full border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-2xs font-bold text-slate-700">Tập tin Văn bằng PDF scan (Bắt buộc)</span>
                      {tmpNghiepVuImageName ? (
                        <p className="text-4xs text-emerald-600 font-extrabold font-mono">ĐÃ UPLOAD: {tmpNghiepVuImageName}</p>
                      ) : (
                        <p className="text-4xs text-rose-500 font-bold">⚠️ Chưa tải lên tệp PDF văn bằng</p>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => processNewImageUpload(e, 'nghiepVu')}
                    className="text-3xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-3xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={addNghiepVu}
                  className="col-span-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg border border-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm văn bằng Nghiệp vụ
                </button>
              </div>

              {/* List table */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Học vị</th>
                      <th className="px-4 py-2">Trường</th>
                      <th className="px-4 py-2">Ngành</th>
                      <th className="px-4 py-2">Số văn bằng</th>
                      <th className="px-4 py-2">Hình ảnh văn bằng (D:/QLCB)</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {nghiepVu.map((nv, index) => (
                      <tr key={nv.id || index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-emerald-800">{nv.degree}</td>
                        <td className="px-4 py-2 font-medium">{nv.school}</td>
                        <td className="px-4 py-2 text-slate-600 font-semibold">{nv.major}</td>
                        <td className="px-4 py-2 font-mono">{nv.diplomaNumber}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => triggerListImageUpload('nghiepVu', nv.id)}
                              className="px-2 py-1 border border-indigo-200 text-3xs font-extrabold text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Cập nhật hình ảnh
                            </button>
                            {nv.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingImage(nv.imageUrl!);
                                  setViewingTitle(`Văn bằng Nghiệp vụ - ${nv.degree} - Ngành: ${nv.major}`);
                                }}
                                className="px-2 py-1 border border-emerald-200 text-3xs font-extrabold text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                Xem văn bằng
                              </button>
                            )}
                          </div>
                          {nv.imageUploadedAt && (
                            <p className="text-5xs text-slate-400 mt-1 font-mono">Đồng bộ: {nv.imageUploadedAt}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setNghiepVu(nghiepVu.filter((item) => item.id !== nv.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {nghiepVu.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có đào tạo nghiệp vụ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. CHUYÊN MÔN NGOÀI NGÀNH */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                2. Đào tạo Chuyên môn (Ngoài ngành)
              </h3>
              
              {/* Form Input Chuyên môn */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Học vị</label>
                  <select
                    value={tmpChuyenMon.degree}
                    onChange={(e) => setTmpChuyenMon({ ...tmpChuyenMon, degree: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Tiến sĩ">Tiến sĩ</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Cao đẳng">Cao đẳng</option>
                    <option value="Trung cấp">Trung cấp</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Trường đào tạo</label>
                  <input
                    type="text"
                    placeholder="ĐH Bách Khoa..."
                    value={tmpChuyenMon.school}
                    onChange={(e) => setTmpChuyenMon({ ...tmpChuyenMon, school: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngành học</label>
                  <input
                    type="text"
                    placeholder="CNTT, Điện tử..."
                    value={tmpChuyenMon.major}
                    onChange={(e) => setTmpChuyenMon({ ...tmpChuyenMon, major: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Số văn bằng</label>
                  <input
                    type="text"
                    placeholder="Số văn bằng"
                    value={tmpChuyenMon.diplomaNumber}
                    onChange={(e) => setTmpChuyenMon({ ...tmpChuyenMon, diplomaNumber: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày cấp bằng</label>
                  <DateInput
                    value={tmpChuyenMon.dateOfIssue}
                    onChange={(val) => setTmpChuyenMon({ ...tmpChuyenMon, dateOfIssue: val })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Hình thức đào tạo</label>
                  <select
                    value={tmpChuyenMon.trainingForm}
                    onChange={(e) => setTmpChuyenMon({ ...tmpChuyenMon, trainingForm: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Tập trung">Tập trung</option>
                    <option value="Không tập trung">Không tập trung</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* IMAGE UPLOADER ELEMENT (MANDATORY BEFORE SAVING) */}
                <div className="col-span-full border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-2xs font-bold text-slate-700">Tập tin Văn bằng PDF scan (Bắt buộc)</span>
                      {tmpChuyenMonImageName ? (
                        <p className="text-4xs text-emerald-600 font-extrabold font-mono">ĐÃ UPLOAD: {tmpChuyenMonImageName}</p>
                      ) : (
                        <p className="text-4xs text-rose-500 font-bold">⚠️ Chưa tải lên tệp PDF văn bằng</p>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => processNewImageUpload(e, 'chuyenMon')}
                    className="text-3xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-3xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={addChuyenMon}
                  className="col-span-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg border border-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm văn bằng Chuyên môn
                </button>
              </div>

              {/* List table */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Học vị</th>
                      <th className="px-4 py-2">Trường</th>
                      <th className="px-4 py-2">Ngành</th>
                      <th className="px-4 py-2">Số văn bằng</th>
                      <th className="px-4 py-2">Hình ảnh văn bằng (D:/QLCB)</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {chuyenMon.map((cm, index) => (
                      <tr key={cm.id || index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-emerald-800">{cm.degree}</td>
                        <td className="px-4 py-2 font-medium">{cm.school}</td>
                        <td className="px-4 py-2 text-slate-600 font-semibold">{cm.major}</td>
                        <td className="px-4 py-2 font-mono">{cm.diplomaNumber}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => triggerListImageUpload('chuyenMon', cm.id)}
                              className="px-2 py-1 border border-indigo-200 text-3xs font-extrabold text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Cập nhật hình ảnh
                            </button>
                            {cm.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingImage(cm.imageUrl!);
                                  setViewingTitle(`Văn bằng Chuyên môn - ${cm.degree} - Ngành: ${cm.major}`);
                                }}
                                className="px-2 py-1 border border-emerald-200 text-3xs font-extrabold text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                Xem văn bằng
                              </button>
                            )}
                          </div>
                          {cm.imageUploadedAt && (
                            <p className="text-5xs text-slate-400 mt-1 font-mono">Đồng bộ: {cm.imageUploadedAt}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setChuyenMon(chuyenMon.filter((item) => item.id !== cm.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {chuyenMon.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có đào tạo chuyên môn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. LÝ LUẬN CHÍNH TRỊ */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                3. Lý luận chính trị
              </h3>
              
              {/* Form Input Lý luận */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Loại văn bằng</label>
                  <select
                    value={tmpLyLuan.type}
                    onChange={(e) => setTmpLyLuan({ ...tmpLyLuan, type: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Bằng">Bằng</option>
                    <option value="Chứng nhận">Chứng nhận</option>
                    <option value="Chứng chỉ">Chứng chỉ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Cơ sở đào tạo</label>
                  <input
                    type="text"
                    placeholder="Học viện Chính trị..."
                    value={tmpLyLuan.facility}
                    onChange={(e) => setTmpLyLuan({ ...tmpLyLuan, facility: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Cấp học / Trình độ</label>
                  <select
                    value={tmpLyLuan.level}
                    onChange={(e) => setTmpLyLuan({ ...tmpLyLuan, level: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Cao cấp">Cao cấp</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Sơ cấp">Sơ cấp</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Số quyết định/VB</label>
                  <input
                    type="text"
                    placeholder="Số văn bằng"
                    value={tmpLyLuan.diplomaNumber}
                    onChange={(e) => setTmpLyLuan({ ...tmpLyLuan, diplomaNumber: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày cấp</label>
                  <DateInput
                    value={tmpLyLuan.dateOfIssue}
                    onChange={(val) => setTmpLyLuan({ ...tmpLyLuan, dateOfIssue: val })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Hình thức</label>
                  <select
                    value={tmpLyLuan.trainingForm}
                    onChange={(e) => setTmpLyLuan({ ...tmpLyLuan, trainingForm: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Tập trung">Tập trung</option>
                    <option value="Không tập trung">Không tập trung</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* IMAGE UPLOADER ELEMENT (MANDATORY BEFORE SAVING) */}
                <div className="col-span-full border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-2xs font-bold text-slate-700">Tập tin Văn bằng PDF scan (Bắt buộc)</span>
                      {tmpLyLuanImageName ? (
                        <p className="text-4xs text-emerald-600 font-extrabold font-mono">ĐÃ UPLOAD: {tmpLyLuanImageName}</p>
                      ) : (
                        <p className="text-4xs text-rose-500 font-bold">⚠️ Chưa tải lên tệp PDF văn bằng</p>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => processNewImageUpload(e, 'lyLuan')}
                    className="text-3xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-3xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={addLyLuan}
                  className="col-span-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg border border-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm văn bằng Lý luận
                </button>
              </div>

              {/* List table */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Loại VB</th>
                      <th className="px-4 py-2">Cơ sở đào tạo</th>
                      <th className="px-4 py-2">Trình độ</th>
                      <th className="px-4 py-2">Số văn bằng</th>
                      <th className="px-4 py-2">Hình ảnh văn bằng (D:/QLCB)</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {lyLuan.map((ll, index) => (
                      <tr key={ll.id || index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-slate-700">{ll.type}</td>
                        <td className="px-4 py-2 font-medium">{ll.facility}</td>
                        <td className="px-4 py-2 font-semibold text-indigo-700">{ll.level}</td>
                        <td className="px-4 py-2 font-mono">{ll.diplomaNumber}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => triggerListImageUpload('lyLuan', ll.id)}
                              className="px-2 py-1 border border-indigo-200 text-3xs font-extrabold text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Cập nhật hình ảnh
                            </button>
                            {ll.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingImage(ll.imageUrl!);
                                  setViewingTitle(`Văn bằng Lý luận - Trình độ: ${ll.level}`);
                                }}
                                className="px-2 py-1 border border-emerald-200 text-3xs font-extrabold text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                Xem văn bằng
                              </button>
                            )}
                          </div>
                          {ll.imageUploadedAt && (
                            <p className="text-5xs text-slate-400 mt-1 font-mono">Đồng bộ: {ll.imageUploadedAt}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setLyLuan(lyLuan.filter((item) => item.id !== ll.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {lyLuan.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có đào tạo lý luận chính trị.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. BỒI DƯỠNG CHUYÊN ĐỀ */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                4. Bồi dưỡng nghiệp vụ chuyên đề
              </h3>
              
              {/* Form Input Bồi dưỡng */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Chuyên đề / Lĩnh vực bồi dưỡng</label>
                  <input
                    type="text"
                    placeholder="Giám định số khung, ADN..."
                    value={tmpBoiDuong.field}
                    onChange={(e) => setTmpBoiDuong({ ...tmpBoiDuong, field: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Cơ sở bồi dưỡng</label>
                  <input
                    type="text"
                    placeholder="Viện Khoa học Hình sự..."
                    value={tmpBoiDuong.facility}
                    onChange={(e) => setTmpBoiDuong({ ...tmpBoiDuong, facility: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Số quyết định/VB</label>
                  <input
                    type="text"
                    placeholder="Số văn bằng"
                    value={tmpBoiDuong.diplomaNumber}
                    onChange={(e) => setTmpBoiDuong({ ...tmpBoiDuong, diplomaNumber: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-slate-600">Ngày cấp quyết định</label>
                  <DateInput
                    value={tmpBoiDuong.dateOfIssue}
                    onChange={(val) => setTmpBoiDuong({ ...tmpBoiDuong, dateOfIssue: val })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* IMAGE UPLOADER ELEMENT (MANDATORY BEFORE SAVING) */}
                <div className="col-span-full border border-dashed border-slate-300 rounded-lg p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-2xs font-bold text-slate-700">Tập tin Văn bằng PDF scan (Bắt buộc)</span>
                      {tmpBoiDuongImageName ? (
                        <p className="text-4xs text-emerald-600 font-extrabold font-mono">ĐÃ UPLOAD: {tmpBoiDuongImageName}</p>
                      ) : (
                        <p className="text-4xs text-rose-500 font-bold">⚠️ Chưa tải lên tệp PDF văn bằng</p>
                      )}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => processNewImageUpload(e, 'boiDuong')}
                    className="text-3xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-3xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={addBoiDuong}
                  className="col-span-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-lg border border-emerald-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm chứng chỉ Bồi dưỡng
                </button>
              </div>

              {/* List table */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                    <tr>
                      <th className="px-4 py-2">Chuyên đề</th>
                      <th className="px-4 py-2">Cơ sở bồi dưỡng</th>
                      <th className="px-4 py-2">Số quyết định</th>
                      <th className="px-4 py-2">Ngày cấp</th>
                      <th className="px-4 py-2">Hình ảnh văn bằng (D:/QLCB)</th>
                      <th className="px-4 py-2 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {boiDuong.map((bd, index) => (
                      <tr key={bd.id || index} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 font-bold text-emerald-800">{bd.field}</td>
                        <td className="px-4 py-2 font-medium">{bd.facility}</td>
                        <td className="px-4 py-2 font-mono">{bd.diplomaNumber}</td>
                        <td className="px-4 py-2">{formatViDate(bd.dateOfIssue)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => triggerListImageUpload('boiDuong', bd.id)}
                              className="px-2 py-1 border border-indigo-200 text-3xs font-extrabold text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Cập nhật hình ảnh
                            </button>
                            {bd.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingImage(bd.imageUrl!);
                                  setViewingTitle(`Chứng chỉ Bồi dưỡng - ${bd.field}`);
                                }}
                                className="px-2 py-1 border border-emerald-200 text-3xs font-extrabold text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-2.5 h-2.5" />
                                Xem văn bằng
                              </button>
                            )}
                          </div>
                          {bd.imageUploadedAt && (
                            <p className="text-5xs text-slate-400 mt-1 font-mono">Đồng bộ: {bd.imageUploadedAt}</p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => setBoiDuong(boiDuong.filter((item) => item.id !== bd.id))}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {boiDuong.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-400 italic">
                          Chưa có đào tạo bồi dưỡng chuyên đề.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* POPUP LIGHTBOX FOR VIEWING IMAGES DIRECTLY IN FORM */}
      {viewingImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleIn border border-slate-200">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold">{viewingTitle}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    iframe.src = viewingImage;
                    document.body.appendChild(iframe);
                    iframe.onload = () => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                        document.body.removeChild(iframe);
                      }, 5000);
                    };
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-2xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> In văn bằng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewingImage(null);
                    setViewingTitle('');
                  }}
                  className="text-slate-400 hover:text-white font-bold px-2.5 py-1 hover:bg-slate-800 rounded-lg cursor-pointer text-xs"
                >
                  Đóng [X]
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-800 flex flex-col gap-3">
              <iframe 
                src={viewingImage} 
                title={viewingTitle}
                className="w-full h-[450px] rounded-lg bg-white shadow-lg border border-slate-700"
              />
              <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-emerald-400 text-4xs font-medium space-y-0.5 leading-normal">
                <p className="font-bold">💡 CẤU HÌNH IN HAI MẶT TRỰC TIẾP:</p>
                <p>Trong hộp thoại cài đặt in của trình duyệt hiện ra sau khi nhấn "In văn bằng":</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Tìm mục <span className="font-bold text-white">"In hai mặt" (Print on both sides / Duplex)</span></li>
                  <li>Tích chọn hoặc bật tính năng này lên, sau đó chọn <span className="font-bold text-white">"Lật theo cạnh dài" (Flip on long edge)</span> hoặc tương đương để in 2 mặt chính xác.</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-5xs text-slate-400 font-mono font-bold">
              LƯU TRỮ VẬT LÝ AN TOÀN TRÊN D:/QLCB
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
