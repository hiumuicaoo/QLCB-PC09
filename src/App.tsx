/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePersonnel } from './hooks/usePersonnel';
import { PersonnelProfile } from './types';
import { useToast } from './components/Toast';

// Import subcomponents
import Dashboard from './components/Dashboard';
import PersonnelList from './components/PersonnelList';
import PersonnelForm from './components/PersonnelForm';
import PersonnelDetail from './components/PersonnelDetail';
import Extractor from './components/Extractor';
import AdvancedReview from './components/AdvancedReview';

// Import Icons
import { LayoutDashboard, Users, FileSearch, HelpCircle, ShieldAlert, ShieldCheck, Award, ChevronRight } from 'lucide-react';

export default function App() {
  const { success, error } = useToast();
  const {
    personnel,
    loading,
    addPersonnel,
    updatePersonnel,
    deactivatePersonnel,
    activatePersonnel,
    deletePersonnel,
    resetToSample,
    importDatabase,
    exportDatabase,
    isElectron,
    customDataPath,
    defaultDataPath,
    updateCustomDataPath,
  } = usePersonnel();

  // Navigation states: 'dashboard' | 'list' | 'extractor' | 'form' | 'detail'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProfile, setSelectedProfile] = useState<PersonnelProfile | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);

  // Handle Export File
  const handleExportFile = () => {
    try {
      const dataStr = exportDatabase();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personnel_db_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      error('Có lỗi xảy ra khi xuất tệp dữ liệu.');
    }
  };

  // Handle Import File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const successVal = importDatabase(content);
      if (successVal) {
        success('Nhập dữ liệu thành công!');
        setActiveTab('dashboard');
      } else {
        error('Tệp dữ liệu không đúng định dạng JSON quản lý nhân sự.');
      }
    };
    reader.readAsText(file);
  };

  // Handle Form Submission
  const handleFormSubmit = (profileData: Omit<PersonnelProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isEditMode && selectedProfile) {
      updatePersonnel(selectedProfile.id, profileData);
      success('Đã cập nhật thông tin cán bộ thành công!');
      // Find the updated profile to display in Detail view
      const updatedProfile = {
        ...selectedProfile,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
      setSelectedProfile(updatedProfile);
      setActiveTab('detail');
    } else {
      const newProfile = addPersonnel(profileData);
      success('Đã thêm hồ sơ cán bộ mới thành công!');
      setSelectedProfile(newProfile);
      setActiveTab('detail');
    }
  };

  // Switch tabs cleanly
  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'form' && tab !== 'detail') {
      setSelectedProfile(undefined);
      setIsEditMode(false);
    }
  };

  const handleSelectProfile = (profile: PersonnelProfile) => {
    setSelectedProfile(profile);
    setActiveTab('detail');
  };

  const handleEditProfile = (profile: PersonnelProfile) => {
    setSelectedProfile(profile);
    setIsEditMode(true);
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="main_app_container">
      {/* Upper Status / Flag banner representing prestigious public administrative environment */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />
      
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xs font-bold tracking-wider text-blue-600 uppercase">HỆ THỐNG TIMELINE QUÂN SỐ</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                Quản lý Thông tin Cán bộ Chiến sĩ & Đào tạo Bồi dưỡng
              </h1>
            </div>
          </div>

          {/* Quick status counters */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Tổng quân số:</span>{' '}
              <strong className="text-blue-600">{personnel.filter((p) => p.status === 'active').length} đồng chí</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-slate-500">Đảng viên:</span>{' '}
              <strong className="text-rose-600">
                {personnel.filter((p) => p.status === 'active' && p.dang.hasDang).length} đồng chí
              </strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar Drawer */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">Danh mục chức năng</p>
            
            {/* Dashboard Link */}
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>Tổng quan số liệu</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
            </button>

            {/* Personnel List Link */}
            <button
              onClick={() => handleNavigate('list')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'list' || activeTab === 'detail'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5" />
                <span>Quản lý hồ sơ quân số</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'list' || activeTab === 'detail' ? 'text-white' : 'text-slate-400'}`} />
            </button>

            {/* Timeline Extractor Link */}
            <button
              onClick={() => handleNavigate('extractor')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'extractor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSearch className="w-4.5 h-4.5" />
                <span>Trích xuất & Thống kê</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'extractor' ? 'text-white' : 'text-slate-400'}`} />
            </button>

            {/* Advanced Review Link */}
            <button
              onClick={() => handleNavigate('review')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Rà soát nâng cao</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'review' ? 'text-white' : 'text-slate-400'}`} />
            </button>
          </div>
        </aside>

        {/* Dynamic Main Workspace Content Column */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-150 p-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu hồ sơ nhân sự...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <Dashboard
                  personnel={personnel}
                  onNavigate={handleNavigate}
                  onExport={handleExportFile}
                  onImport={handleImportFile}
                  onReset={resetToSample}
                  isElectron={isElectron}
                  customDataPath={customDataPath}
                  defaultDataPath={defaultDataPath}
                  onUpdateCustomDataPath={updateCustomDataPath}
                />
              )}

              {/* Personnel List Tab */}
              {activeTab === 'list' && (
                <PersonnelList
                  personnel={personnel}
                  onSelect={handleSelectProfile}
                  onEdit={handleEditProfile}
                  onDelete={deletePersonnel}
                  onDeactivate={deactivatePersonnel}
                  onActivate={activatePersonnel}
                  onNavigate={handleNavigate}
                />
              )}

              {/* Personnel Form (Create / Edit) */}
              {activeTab === 'form' && (
                <PersonnelForm
                  initialProfile={isEditMode ? selectedProfile : undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={() => handleNavigate(selectedProfile ? 'detail' : 'list')}
                />
              )}

              {/* Personnel Detailed View */}
              {activeTab === 'detail' && selectedProfile && (
                <PersonnelDetail
                  profile={selectedProfile}
                  onBack={() => handleNavigate('list')}
                  onEdit={() => {
                    setIsEditMode(true);
                    setActiveTab('form');
                  }}
                  onDelete={deletePersonnel}
                  onDeactivate={deactivatePersonnel}
                  onActivate={activatePersonnel}
                  onUpdate={updatePersonnel}
                />
              )}

              {/* Timeline Extractor Tool Tab */}
              {activeTab === 'extractor' && (
                <Extractor personnel={personnel} />
              )}

              {/* Advanced Review Tab */}
              {activeTab === 'review' && (
                <AdvancedReview 
                  personnel={personnel} 
                  onSelectPersonnel={handleSelectProfile}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* System Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 Hệ thống Quản lý Cán bộ Chiến sĩ. Thiết kế chuẩn hoá timeline nghiệp vụ.</p>
          <p>
            Phiên bản 1.0.0 •{' '}
            {isElectron ? (
              <span>
                Thư mục lưu trữ: <strong className="text-slate-600 font-mono text-2xs">{customDataPath || defaultDataPath}</strong>
              </span>
            ) : (
              'Chạy ngoại tuyến an toàn (Local Storage persistent)'
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

