/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PersonnelProfile } from '../types';
import DateInput from './DateInput';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Phone, 
  UserX, 
  UserCheck, 
  Lock, 
  Unlock,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatViDate } from '../utils';
import { useToast } from './Toast';

interface PersonnelListProps {
  personnel: PersonnelProfile[];
  onSelect: (profile: PersonnelProfile) => void;
  onEdit: (profile: PersonnelProfile) => void;
  onDelete: (id: string) => void;
  onDeactivate: (id: string, destination: string, date: string) => void;
  onActivate: (id: string, source: string, date: string) => void;
  onNavigate: (tab: string) => void;
}

export default function PersonnelList({
  personnel,
  onSelect,
  onEdit,
  onDelete,
  onDeactivate,
  onActivate,
  onNavigate,
}: PersonnelListProps) {
  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [dangFilter, setDangFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  
  // Tab state inside list: 'active' (Đang công tác) or 'inactive' (Đã chuyển đi)
  const [statusTab, setStatusTab] = useState<'active' | 'inactive'>('active');

  // Deactivate modal popup state
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [deactivatingName, setDeactivatingName] = useState<string>('');
  const [deactivateDest, setDeactivateDest] = useState('');
  const [deactivateDate, setDeactivateDate] = useState(new Date().toISOString().split('T')[0]);

  // Activate modal popup state
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [activatingName, setActivatingName] = useState<string>('');
  const [activateSource, setActivateSource] = useState('Đội 1 – PC09');
  const [activateDate, setActivateDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Search & Filtering
  const filteredPersonnel = personnel.filter((p) => {
    // Treat undefined status as 'active'
    const currentStatus = p.status || 'active';
    if (currentStatus !== statusTab) return false;

    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      p.personal.fullName.toLowerCase().includes(searchLower) ||
      p.cand.securityId.toLowerCase().includes(searchLower) ||
      p.personal.phone.includes(searchLower) ||
      p.personal.hometown.toLowerCase().includes(searchLower);

    const matchGender = genderFilter ? p.personal.gender === genderFilter : true;
    const matchDang = dangFilter ? p.dang.hasDang === (dangFilter === 'Đảng viên') : true;

    // Check if matching degree filter
    let matchDegree = true;
    if (degreeFilter) {
      const allDegrees: string[] = [];
      p.daoTao.nghiepVu.forEach(nv => allDegrees.push(nv.degree));
      p.daoTao.chuyenMon.forEach(cm => allDegrees.push(cm.degree));
      matchDegree = allDegrees.includes(degreeFilter);
    }

    return matchSearch && matchGender && matchDang && matchDegree;
  });

  // Handle Action Submissions
  const handleConfirmDeactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatingId) return;
    
    onDeactivate(deactivatingId, deactivateDest, deactivateDate);
    success(`Đã vô hiệu hóa hồ sơ của đồng chí ${deactivatingName}. Trạng thái chuyển công tác đến ${deactivateDest} đã được cập nhật.`);
    
    // Close modal & reset state
    setDeactivatingId(null);
    setDeactivatingName('');
    setDeactivateDest('');
  };

  const handleConfirmActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activatingId) return;

    onActivate(activatingId, activateSource, activateDate);
    success(`Đã kích hoạt trở lại hồ sơ đồng chí ${activatingName}. Quân số được điều động tiếp nhận về ${activateSource}.`);

    // Close modal & reset state
    setActivatingId(null);
    setActivatingName('');
    setActivateSource('Đội 1 – PC09');
    setStatusTab('active'); // Switch to active tab to see the activated personnel
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="personnel_list_view">
      {/* Tab Switcher for Active vs Inactive Personnel */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setStatusTab('active')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            statusTab === 'active'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Unlock className="w-4 h-4 text-emerald-500" />
          Đang công tác ({personnel.filter(p => (p.status || 'active') === 'active').length})
        </button>
        <button
          onClick={() => setStatusTab('inactive')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
            statusTab === 'inactive'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Lock className="w-4 h-4 text-rose-500" />
          Đã chuyển đi (Vô hiệu hóa) ({personnel.filter(p => p.status === 'inactive').length})
        </button>
      </div>

      {/* Search and Filters Block */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo họ tên, số hiệu CAND, số điện thoại, quê quán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>
          {statusTab === 'active' && (
            <button
              onClick={() => onNavigate('form')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Thêm hồ sơ cán bộ
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Giới tính */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Giới tính</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
            >
              <option value="">Tất cả giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* Đảng viên */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Đảng viên</label>
            <select
              value={dangFilter}
              onChange={(e) => setDangFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
            >
              <option value="">Tất cả</option>
              <option value="Đảng viên">Đảng viên</option>
              <option value="Chưa vào Đảng">Chưa vào Đảng</option>
            </select>
          </div>

          {/* Trình độ học vị */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Trình độ học vị</label>
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-slate-700"
            >
              <option value="">Tất cả học vị</option>
              <option value="Tiến sĩ">Tiến sĩ</option>
              <option value="Thạc sĩ">Thạc sĩ</option>
              <option value="Đại học">Đại học</option>
              <option value="Cao đẳng">Cao đẳng</option>
              <option value="Trung cấp">Trung cấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid count summary */}
      <p className="text-xs font-medium text-slate-500 px-1">
        Tìm thấy <span className="text-blue-600 font-semibold">{filteredPersonnel.length}</span> hồ sơ{' '}
        {statusTab === 'active' ? 'đang công tác' : 'đã chuyển đi (vô hiệu hóa)'}
      </p>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredPersonnel.map((p) => {
          const sortedRanks = [...p.cand.rankHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const activeRank = sortedRanks.length > 0 ? sortedRanks[0].rank : 'Chưa thăng/hạ cấp bậc hàm';

          const sortedUnits = [...p.cand.unitHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const activeUnit = sortedUnits.length > 0 ? sortedUnits[0].unit : 'Chưa phân công';

          const sortedPositions = [...p.cand.positionHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const activePosition = sortedPositions.length > 0 ? sortedPositions[0].position : 'Cán bộ';

          const countNV = p.daoTao.nghiepVu.length;
          const countCM = p.daoTao.chuyenMon.length;
          const countLL = p.daoTao.lyLuan.length;
          const countBD = p.daoTao.boiDuong.length;

          // Get the latest Chức danh
          const sortedChucDanh = p.cand.chucDanhHistory ? [...p.cand.chucDanhHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
          const currentChucDanh = sortedChucDanh.length > 0 ? sortedChucDanh[0] : null;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border ${
                statusTab === 'active' ? 'border-slate-100 hover:border-slate-250 shadow-2xs' : 'border-rose-100/70 bg-slate-50/20'
              } hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group`}
            >
              {/* Header card info */}
              <div className="p-5 border-b border-slate-50 bg-linear-to-b from-slate-50/50 to-white">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {p.personal.fullName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      SH: {p.cand.securityId} • {p.personal.gender}
                    </p>
                  </div>
                  {p.dang.hasDang ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                      Đảng viên
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-100">
                      Quần chúng
                    </span>
                  )}
                </div>

                {/* Sub info */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="font-semibold truncate">{activeRank}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Sinh: {formatViDate(p.personal.dob)}</span>
                  </div>
                </div>
              </div>

              {/* Body indicators */}
              <div className="p-5 flex-1 space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-2xs font-bold uppercase tracking-wider">Đơn vị & Chức vụ</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{activePosition}</p>
                    <p className="text-slate-500 text-2xs mt-0.5">{activeUnit}</p>
                  </div>
                </div>

                {/* Chức danh hiển thị */}
                {currentChucDanh && (
                  <div className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-2xs font-semibold uppercase tracking-wider">Chức danh</p>
                      <p className="font-bold text-slate-800 mt-0.5">
                        {currentChucDanh.ngach} {currentChucDanh.bac}
                      </p>
                      <p className="text-slate-500 text-2xs mt-0.5">
                        {currentChucDanh.action} ngày {formatViDate(currentChucDanh.date)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-2xs font-bold uppercase tracking-wider">Đào tạo & Bồi dưỡng (Mục D)</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 text-2xs">
                        Nghiệp vụ: <b>{countNV}</b>
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 text-2xs">
                        Chuyên môn: <b>{countCM}</b>
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 text-2xs">
                        Lý luận: <b>{countLL}</b>
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-100 text-2xs">
                        Bồi dưỡng: <b>{countBD}</b>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-slate-500">{p.personal.phone || 'Chưa cập nhật SĐT'}</span>
                </div>
              </div>

              {/* Footer action buttons */}
              <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelect(p)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem chi tiết
                </button>

                {statusTab === 'active' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeactivatingId(p.id);
                        setDeactivatingName(p.personal.fullName);
                        setDeactivateDest('PC01');
                        setDeactivateDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-2xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 transition-all cursor-pointer"
                      title="Vô hiệu hồ sơ"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Vô hiệu
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn XOÁ HOÀN TOÀN hồ sơ của đồng chí ${p.personal.fullName} khỏi cơ sở dữ liệu? Hành động này không thể khôi phục.`)) {
                          onDelete(p.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-2xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all cursor-pointer"
                      title="Xoá hồ sơ vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xoá
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setActivatingId(p.id);
                        setActivatingName(p.personal.fullName);
                        setActivateSource('PC01');
                        setActivateDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-2xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-xl border border-emerald-200 hover:border-emerald-600 transition-all cursor-pointer shadow-2xs"
                      title="Kích hoạt hồ sơ"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Kích hoạt lại
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn XOÁ HOÀN TOÀN hồ sơ của đồng chí ${p.personal.fullName} khỏi cơ sở dữ liệu? Hành động này không thể khôi phục.`)) {
                          onDelete(p.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-2xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition-all cursor-pointer"
                      title="Xoá hồ sơ vĩnh viễn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xoá
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredPersonnel.length === 0 && (
          <div className="col-span-full bg-white py-16 px-6 rounded-2xl border border-slate-150 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-medium">Không tìm thấy cán bộ chiến sĩ nào khớp với bộ lọc hiện tại.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('');
                setDangFilter('');
                setDegreeFilter('');
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Đặt lại các bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* POPUP MODAL: VÔ HIỆU HỒ SƠ */}
      {deactivatingId && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950">Vô hiệu hóa hồ sơ cán bộ</h3>
                <p className="text-2xs text-rose-700 font-semibold mt-0.5">Nhân sự: {deactivatingName}</p>
              </div>
            </div>
            <form onSubmit={handleConfirmDeactivate} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Đồng chí <b>{deactivatingName}</b> sẽ được chuyển trạng thái sang <b>Không quản lý</b>. Vui lòng cập nhật đầy đủ thông tin chuyển đi:
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nơi chuyển đi (Đơn vị tiếp nhận mới):</label>
                <input
                  type="text"
                  required
                  value={deactivateDest}
                  onChange={(e) => setDeactivateDest(e.target.value)}
                  placeholder="Ví dụ: PC01, PC02, PC03..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ngày chuyển đi:</label>
                <DateInput
                  required
                  value={deactivateDate}
                  onChange={(val) => setDeactivateDate(val)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDeactivatingId(null);
                    setDeactivatingName('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Xác nhận vô hiệu hóa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: KÍCH HOẠT HỒ SƠ */}
      {activatingId && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">Kích hoạt lại hồ sơ cán bộ</h3>
                <p className="text-2xs text-emerald-700 font-semibold mt-0.5">Nhân sự: {activatingName}</p>
              </div>
            </div>
            <form onSubmit={handleConfirmActivate} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Đồng chí <b>{activatingName}</b> quay lại công tác. Vui lòng cập nhật đầy đủ thông tin chuyển đến để mở khóa hồ sơ và phục hồi quân số chính thức:
              </p>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Đơn vị công tác tiếp nhận (Chuyển đến):</label>
                <select
                  required
                  value={activateSource}
                  onChange={(e) => setActivateSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActivatingId(null);
                    setActivatingName('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-lg cursor-pointer animate-pulse"
                >
                  Xác nhận kích hoạt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
