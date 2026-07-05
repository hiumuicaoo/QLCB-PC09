/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PersonnelProfile } from '../types';
import { useToast } from './Toast';
import { Shield, Users, UserCheck, GraduationCap, Award, FileUp, FileDown, RefreshCw, Folder } from 'lucide-react';
import { getDegreeScore, getRankScore } from '../utils';

interface DashboardProps {
  personnel: PersonnelProfile[];
  onNavigate: (tab: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  isElectron?: boolean;
  customDataPath?: string;
  defaultDataPath?: string;
  onUpdateCustomDataPath?: (path: string) => boolean;
}

export default function Dashboard({
  personnel,
  onNavigate,
  onExport,
  onImport,
  onReset,
  isElectron,
  customDataPath,
  defaultDataPath,
  onUpdateCustomDataPath,
}: DashboardProps) {
  const { success } = useToast();
  const [pathInput, setPathInput] = useState(customDataPath || '');

  useEffect(() => {
    setPathInput(customDataPath || '');
  }, [customDataPath]);

  const handleSavePath = () => {
    if (onUpdateCustomDataPath) {
      const trimmed = pathInput.trim();
      const successVal = onUpdateCustomDataPath(trimmed);
      if (successVal) {
        success(`Đã áp dụng đường dẫn lưu trữ mới thành công!\nToàn bộ dữ liệu hiện tại đã được đồng bộ về: ${trimmed || defaultDataPath}`);
      }
    }
  };

  const handleResetPath = () => {
    if (onUpdateCustomDataPath) {
      if (window.confirm('Bạn có chắc chắn muốn đặt lại đường dẫn lưu trữ về mặc định trong thư mục người dùng?')) {
        const successVal = onUpdateCustomDataPath('');
        if (successVal) {
          setPathInput('');
          success(`Đã đặt lại đường dẫn lưu trữ về mặc định:\n${defaultDataPath}`);
        }
      }
    }
  };
  // Statistics Calculations
  const activePersonnel = personnel.filter((p) => p.status === 'active');
  const totalCount = activePersonnel.length;
  const partyCount = activePersonnel.filter((p) => p.dang.hasDang).length;
  const femaleCount = activePersonnel.filter((p) => p.personal.gender === 'Nữ').length;
  const maleCount = totalCount - femaleCount;

  // Ranks Statistics
  const rankCounts: Record<string, number> = {};
  activePersonnel.forEach((p) => {
    // get latest rank
    if (p.cand.rankHistory.length > 0) {
      const sortedRanks = [...p.cand.rankHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestRank = sortedRanks[0].rank;
      rankCounts[latestRank] = (rankCounts[latestRank] || 0) + 1;
    }
  });

  // Education Statistics
  let phdCount = 0;
  let masterCount = 0;
  let bachelorCount = 0;
  let collegeCount = 0;
  let intermediateCount = 0;

  activePersonnel.forEach((p) => {
    let maxScore = 0;
    // Check all training
    p.daoTao.nghiepVu.forEach((nv) => {
      maxScore = Math.max(maxScore, getDegreeScore(nv.degree));
    });
    p.daoTao.chuyenMon.forEach((cm) => {
      maxScore = Math.max(maxScore, getDegreeScore(cm.degree));
    });

    if (maxScore === 5) phdCount++;
    else if (maxScore === 4) masterCount++;
    else if (maxScore === 3) bachelorCount++;
    else if (maxScore === 2) collegeCount++;
    else if (maxScore === 1) intermediateCount++;
  });

  const hasDegreeCount = phdCount + masterCount + bachelorCount + collegeCount + intermediateCount;

  return (
    <div className="space-y-6" id="dashboard_view">
      {/* Upper Welcome and Actions Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-xs gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Hệ thống Quản lý Thông tin Nhân sự
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan số liệu, trình độ và công tác quản lý thông tin cán bộ chiến sĩ tại đơn vị.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 cursor-pointer transition-colors">
            <FileUp className="w-3.5 h-3.5 text-slate-500" />
            Nhập dữ liệu (JSON)
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            Xuất dữ liệu (JSON)
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded-lg border border-rose-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
            {(import.meta as any).env?.PROD || (typeof window !== 'undefined' && /electron/i.test(window.navigator.userAgent))
              ? 'Xóa sạch cơ sở dữ liệu'
              : 'Khôi phục mặc định'}
          </button>
        </div>
      </div>
      {isElectron && (
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100 p-5 rounded-2xl shadow-2xs space-y-3" id="electron_storage_config_card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-600/10 text-blue-700 rounded-lg shrink-0 mt-0.5">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cấu hình thư mục lưu trữ dữ liệu (Phiên bản EXE)</h3>
                <p className="text-2xs text-slate-500 mt-0.5 leading-relaxed">
                  Tập trung lưu trữ tệp dữ liệu hồ sơ nhân sự của đơn vị dưới dạng tệp JSON tại đường dẫn bên dưới. Bạn có thể thay đổi đường dẫn này sang bất kỳ thư mục nào (ví dụ: ổ đĩa D, ổ đĩa E hoặc một ổ cứng mạng) để đồng bộ, sao lưu và tránh mất mát dữ liệu.
                </p>
              </div>
            </div>
            
            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Dữ liệu đồng bộ tự động
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Mặc định: ${defaultDataPath}`}
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 pr-16"
              />
              {pathInput !== (customDataPath || '') && (
                <button
                  onClick={() => setPathInput(customDataPath || '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-2xs text-slate-400 hover:text-slate-600 underline font-medium"
                >
                  Khôi phục
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleSavePath}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Áp dụng đường dẫn mới
              </button>
              {customDataPath && (
                <button
                  onClick={handleResetPath}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  title="Đặt lại về mặc định"
                >
                  Mặc định
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-slate-500 font-medium pt-1 border-t border-slate-100">
            <p>
              📍 Thư mục đang áp dụng:{' '}
              <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {customDataPath || defaultDataPath}
              </span>
            </p>
            <p>
              📄 Tệp cơ sở dữ liệu:{' '}
              <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                personnel_db.json
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total personnel */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tổng số nhân sự</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-0.5">{totalCount} đồng chí</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nam: {maleCount} • Nữ: {femaleCount}
            </p>
          </div>
        </div>

        {/* Party Members */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Đảng viên Đảng CSVN</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-0.5">{partyCount} đồng chí</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ: {totalCount > 0 ? Math.round((partyCount / totalCount) * 100) : 0}% cán bộ
            </p>
          </div>
        </div>

        {/* Higher Education */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Trình độ Đại học trở lên</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-0.5">
              {phdCount + masterCount + bachelorCount} đồng chí
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tiến sĩ: {phdCount} • Thạc sĩ: {masterCount}
            </p>
          </div>
        </div>

        {/* Variable updates */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Chứng chỉ bồi dưỡng</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-0.5">
              {activePersonnel.reduce((acc, curr) => acc + curr.daoTao.boiDuong.length, 0)} chứng chỉ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Liên tục bổ sung, thay thế</p>
          </div>
        </div>
      </div>

      {/* Main Stats Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Rank Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Cấp bậc hàm hiện tại</h3>
          {Object.keys(rankCounts).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              Chưa có thông tin cấp bậc hàm
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(rankCounts)
                .sort((a, b) => getRankScore(b[0]) - getRankScore(a[0]))
                .map(([rank, count]) => {
                  const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                  return (
                    <div key={rank} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span>{rank}</span>
                        <span>{count} đồng chí ({Math.round(percentage)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right: Highest Education Level Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Trình độ đào tạo cao nhất đạt được</h3>
          {hasDegreeCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
              Chưa có dữ liệu đào tạo bồi dưỡng
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Tiến sĩ', count: phdCount, color: 'bg-emerald-600' },
                { label: 'Thạc sĩ', count: masterCount, color: 'bg-teal-500' },
                { label: 'Đại học', count: bachelorCount, color: 'bg-cyan-500' },
                { label: 'Cao đẳng', count: collegeCount, color: 'bg-amber-500' },
                { label: 'Trung cấp', count: intermediateCount, color: 'bg-indigo-400' },
              ].map((lvl) => {
                const percentage = totalCount > 0 ? (lvl.count / totalCount) * 100 : 0;
                return (
                  <div key={lvl.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{lvl.label}</span>
                      <span>{lvl.count} đồng chí ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${lvl.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900">Danh sách quân số cập nhật</h3>
          <button
            onClick={() => onNavigate('list')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Xem tất cả
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-medium uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-3">Họ và tên</th>
                <th className="px-6 py-3">Số hiệu CAND</th>
                <th className="px-6 py-3">Cấp bậc hàm</th>
                <th className="px-6 py-3">Chức vụ</th>
                <th className="px-6 py-3">Đơn vị</th>
                <th className="px-6 py-3">Đảng viên</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {activePersonnel.slice(0, 5).map((p) => {
                const latestRank = p.cand.rankHistory.length > 0
                  ? [...p.cand.rankHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].rank
                  : '---';
                const latestPosition = p.cand.positionHistory.length > 0
                  ? [...p.cand.positionHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].position
                  : '---';
                const latestUnit = p.cand.unitHistory.length > 0
                  ? [...p.cand.unitHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].unit
                  : '---';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{p.personal.fullName}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">{p.cand.securityId}</td>
                    <td className="px-6 py-3.5">{latestRank}</td>
                    <td className="px-6 py-3.5">{latestPosition}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-[200px] truncate">{latestUnit}</td>
                    <td className="px-6 py-3.5">
                      {p.dang.hasDang ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
                          Đảng viên
                        </span>
                      ) : (
                        <span className="text-slate-400">---</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {activePersonnel.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                    Chưa có nhân sự nào trong hệ thống. Nhấp vào "Thêm Nhân sự" để bắt đầu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
