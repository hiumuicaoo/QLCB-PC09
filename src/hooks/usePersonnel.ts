/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PersonnelProfile } from '../types';
import { SAMPLE_PERSONNEL } from '../data/sampleData';

const isProdOrElectron = (import.meta as any).env?.PROD || (typeof window !== 'undefined' && /electron/i.test(window.navigator.userAgent));

// Check if running in Electron renderer
const isElectron = typeof window !== 'undefined' && (window as any).process && (window as any).process.type === 'renderer';

const getElectronDefaultPath = () => {
  if (!isElectron) return '';
  try {
    const os = (window as any).require('os');
    const path = (window as any).require('path');
    const fs = (window as any).require('fs');
    
    // Ưu tiên tuyệt đối thư mục D:\QLCB trên máy tính theo yêu cầu của cán bộ
    const targetDir = 'D:\\QLCB';
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      return targetDir;
    } catch (e) {
      // Nếu không thể truy cập ổ D (ví dụ chạy trên MacOS/Linux hoặc ổ đĩa bị khóa), quay về thư mục người dùng
      console.warn('Không thể tạo hoặc truy cập D:\\QLCB, quay về thư mục mặc định người dùng:', e);
      return path.join(os.homedir(), 'PC09_Data');
    }
  } catch (err) {
    console.error('Error getting default Electron path:', err);
    return 'D:\\QLCB';
  }
};

export function usePersonnel() {
  const [personnel, setPersonnel] = useState<PersonnelProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [customDataPath, setCustomDataPath] = useState(() => {
    return localStorage.getItem('custom_data_path') || '';
  });

  // Save to Disk and LocalStorage
  const saveToStorage = (updatedList: PersonnelProfile[]) => {
    try {
      let processedList = [...updatedList];

      if (isElectron) {
        try {
          const fs = (window as any).require('fs');
          const path = (window as any).require('path');
          const customPath = localStorage.getItem('custom_data_path') || '';
          const defaultPath = getElectronDefaultPath();
          const activePath = customPath || defaultPath;
          
          // Thư mục cha chứa các loại văn bằng
          const basePdfDir = path.join(activePath, 'van_bang_pdf');
          if (!fs.existsSync(basePdfDir)) {
            fs.mkdirSync(basePdfDir, { recursive: true });
          }

          // Định nghĩa các thư mục con gọn gàng cho từng loại
          const folderMapping = {
            nghiepVu: 'nghiep_vu',
            chuyenMon: 'chuyen_mon',
            lyLuan: 'ly_luan',
            boiDuong: 'boi_duong'
          };

          processedList = updatedList.map(profile => {
            const updatedDaoTao = { ...profile.daoTao };
            let profileChanged = false;

            const types = ['nghiepVu', 'chuyenMon', 'lyLuan', 'boiDuong'] as const;
            for (const type of types) {
              const list = updatedDaoTao[type] as any[];
              if (Array.isArray(list)) {
                let listChanged = false;
                const newList = list.map(item => {
                  if (item.imageUrl && item.imageUrl.startsWith('data:application/pdf;base64,')) {
                    try {
                      const subFolderName = folderMapping[type];
                      const targetSubDir = path.join(basePdfDir, subFolderName);
                      
                      // Đảm bảo thư mục con tồn tại
                      if (!fs.existsSync(targetSubDir)) {
                        fs.mkdirSync(targetSubDir, { recursive: true });
                      }

                      const fileName = `${item.id}.pdf`;
                      const targetFile = path.join(targetSubDir, fileName);
                      const base64Data = item.imageUrl.replace(/^data:application\/pdf;base64,/, '');
                      fs.writeFileSync(targetFile, base64Data, 'base64');
                      
                      listChanged = true;
                      profileChanged = true;
                      return {
                        ...item,
                        imageUrl: `van_bang_pdf/${subFolderName}/${fileName}`, // Lưu đường dẫn tương đối gọn gàng trong DB
                      };
                    } catch (err) {
                      console.error('Lỗi khi lưu tệp đính kèm vật lý:', err);
                    }
                  }
                  return item;
                });
                if (listChanged) {
                  updatedDaoTao[type] = newList;
                }
              }
            }

            if (profileChanged) {
              return {
                ...profile,
                daoTao: updatedDaoTao,
              };
            }
            return profile;
          });
        } catch (e) {
          console.error('Lỗi xử lý lưu tệp đính kèm trong Electron:', e);
        }
      }

      localStorage.setItem('personnel_db', JSON.stringify(processedList));
      setPersonnel(processedList);

      if (!isElectron && isServerConnected) {
        fetch('/api/personnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processedList)
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPersonnel(data);
            localStorage.setItem('personnel_db', JSON.stringify(data));
          }
        })
        .catch(err => {
          console.error('Lỗi khi đồng bộ lên server:', err);
        });
      }

      if (isElectron) {
        const customPath = localStorage.getItem('custom_data_path') || '';
        const defaultPath = getElectronDefaultPath();
        const activePath = customPath || defaultPath;
        
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const targetFile = path.join(activePath, 'personnel_db.json');
        
        if (!fs.existsSync(activePath)) {
          fs.mkdirSync(activePath, { recursive: true });
        }
        
        fs.writeFileSync(targetFile, JSON.stringify(processedList, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('Lỗi khi ghi dữ liệu:', e);
    }
  };

  // Load from Disk (Electron) or LocalStorage (Web)
  useEffect(() => {
    if (isElectron) {
      try {
        const customPath = localStorage.getItem('custom_data_path') || '';
        const defaultPath = getElectronDefaultPath();
        const activePath = customPath || defaultPath;
        
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const targetFile = path.join(activePath, 'personnel_db.json');
        
        // Ensure folder exists
        if (!fs.existsSync(activePath)) {
          fs.mkdirSync(activePath, { recursive: true });
        }
        
        if (fs.existsSync(targetFile)) {
          const content = fs.readFileSync(targetFile, 'utf8');
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            // Tự động giải nén/chuyển đổi bất kỳ dữ liệu Base64 nào có sẵn sang file vật lý và lưu DB
            saveToStorage(data);
          } else {
            setPersonnel([]);
          }
        } else {
          // File does not exist, initialize it
          const legacy = localStorage.getItem('personnel_db');
          const initialData = legacy ? JSON.parse(legacy) : (isProdOrElectron ? [] : SAMPLE_PERSONNEL);
          // Tự động giải nén/chuyển đổi dữ liệu và đồng bộ hóa sang file vật lý
          saveToStorage(initialData);
        }
      } catch (err) {
        console.error('Lỗi khi đọc file trên Electron:', err);
        const stored = localStorage.getItem('personnel_db');
        setPersonnel(stored ? JSON.parse(stored) : []);
      } finally {
        setLoading(false);
      }
    } else {
      // Thử kết nối và tải dữ liệu từ server trước
      fetch('/api/personnel')
        .then(res => {
          if (!res.ok) throw new Error('API response not ok');
          return res.json();
        })
        .then(serverData => {
          if (Array.isArray(serverData)) {
            setIsServerConnected(true);
            if (serverData.length > 0) {
              setPersonnel(serverData);
              localStorage.setItem('personnel_db', JSON.stringify(serverData));
              setLoading(false);
            } else {
              // Server kết nối thành công nhưng cơ sở dữ liệu trống. Kiểm tra di chuyển dữ liệu cũ từ LocalStorage lên server
              const localStored = localStorage.getItem('personnel_db');
              if (localStored) {
                const localData = JSON.parse(localStored);
                if (Array.isArray(localData) && localData.length > 0) {
                  // Đồng bộ dữ liệu cũ lên server mới
                  fetch('/api/personnel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: localStored
                  })
                  .then(r => r.json())
                  .then(migratedData => {
                    if (Array.isArray(migratedData)) {
                      setPersonnel(migratedData);
                    } else {
                      setPersonnel(localData);
                    }
                  })
                  .catch(err => {
                    console.error('Lỗi khi tự động đồng bộ dữ liệu cũ lên server:', err);
                    setPersonnel(localData);
                  })
                  .finally(() => setLoading(false));
                } else {
                  // Cả hai đều trống, nạp mẫu thử
                  const initialData = isProdOrElectron ? [] : SAMPLE_PERSONNEL;
                  if (initialData.length > 0) {
                    fetch('/api/personnel', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(initialData)
                    })
                    .then(r => r.json())
                    .then(migratedData => {
                      setPersonnel(Array.isArray(migratedData) ? migratedData : initialData);
                    })
                    .catch(() => setPersonnel(initialData))
                    .finally(() => setLoading(false));
                  } else {
                    setPersonnel([]);
                    setLoading(false);
                  }
                }
              } else {
                const initialData = isProdOrElectron ? [] : SAMPLE_PERSONNEL;
                if (initialData.length > 0) {
                  fetch('/api/personnel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(initialData)
                  })
                  .then(r => r.json())
                  .then(migratedData => {
                    setPersonnel(Array.isArray(migratedData) ? migratedData : initialData);
                  })
                  .catch(() => setPersonnel(initialData))
                  .finally(() => setLoading(false));
                } else {
                  setPersonnel([]);
                  setLoading(false);
                }
              }
            }
          } else {
            throw new Error('Dữ liệu không hợp lệ');
          }
        })
        .catch(err => {
          console.warn('Không thể kết nối đến server backend (chạy chế độ Offline LocalStorage):', err);
          setIsServerConnected(false);
          // Quay về LocalStorage khi ngoại tuyến
          try {
            const stored = localStorage.getItem('personnel_db');
            if (stored) {
              setPersonnel(JSON.parse(stored));
            } else {
              const initialData = isProdOrElectron ? [] : SAMPLE_PERSONNEL;
              localStorage.setItem('personnel_db', JSON.stringify(initialData));
              setPersonnel(initialData);
            }
          } catch (e) {
            console.error('Lỗi khi đọc LocalStorage:', e);
            setPersonnel([]);
          } finally {
            setLoading(false);
          }
        });
    }
  }, []);

  // Update Custom Data Path (Electron only)
  const updateCustomDataPath = (newPath: string): boolean => {
    if (!isElectron) return false;
    try {
      const fs = (window as any).require('fs');
      const path = (window as any).require('path');
      const trimmedPath = newPath.trim();
      const defaultPath = getElectronDefaultPath();

      const oldCustomPath = localStorage.getItem('custom_data_path') || '';
      const oldActivePath = oldCustomPath || defaultPath;
      const newActivePath = trimmedPath || defaultPath;

      // 1. Sao chép thư mục tệp đính kèm van_bang_pdf trước (nếu có)
      if (oldActivePath !== newActivePath) {
        const oldPdfDir = path.join(oldActivePath, 'van_bang_pdf');
        const newPdfDir = path.join(newActivePath, 'van_bang_pdf');

        const copyFolderRecursiveSync = (src: string, dest: string) => {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          const items = fs.readdirSync(src);
          for (const item of items) {
            const srcItem = path.join(src, item);
            const destItem = path.join(dest, item);
            if (fs.lstatSync(srcItem).isDirectory()) {
              copyFolderRecursiveSync(srcItem, destItem);
            } else {
              fs.copyFileSync(srcItem, destItem);
            }
          }
        };

        if (fs.existsSync(oldPdfDir)) {
          try {
            copyFolderRecursiveSync(oldPdfDir, newPdfDir);
            console.log(`Đã sao chép gọn gàng toàn bộ thư mục van_bang_pdf sang vị trí mới: ${newPdfDir}`);
          } catch (copyErr) {
            console.error('Lỗi sao chép thư mục tệp đính kèm sang thư mục mới:', copyErr);
          }
        }

        // Hỗ trợ đồng bộ/chuyển đổi nếu có dữ liệu từ thư mục pdf_attachments cũ
        const oldLegacyAttachmentsDir = path.join(oldActivePath, 'pdf_attachments');
        if (fs.existsSync(oldLegacyAttachmentsDir)) {
          try {
            const files = fs.readdirSync(oldLegacyAttachmentsDir);
            for (const file of files) {
              const srcFile = path.join(oldLegacyAttachmentsDir, file);
              const destDir = path.join(newActivePath, 'van_bang_pdf', 'boi_duong');
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              const destFile = path.join(destDir, file);
              fs.copyFileSync(srcFile, destFile);
            }
          } catch (e) {
            console.error('Lỗi di chuyển tệp đính kèm cũ sang cấu trúc mới:', e);
          }
        }
      }
      
      if (!trimmedPath) {
        localStorage.removeItem('custom_data_path');
        setCustomDataPath('');
        
        const defaultFile = path.join(defaultPath, 'personnel_db.json');
        if (fs.existsSync(defaultFile)) {
          const content = fs.readFileSync(defaultFile, 'utf8');
          const loadedData = JSON.parse(content);
          setPersonnel(loadedData);
          localStorage.setItem('personnel_db', JSON.stringify(loadedData));
        }
        return true;
      }

      if (!fs.existsSync(trimmedPath)) {
        fs.mkdirSync(trimmedPath, { recursive: true });
      }

      const targetFile = path.join(trimmedPath, 'personnel_db.json');
      if (fs.existsSync(targetFile)) {
        const content = fs.readFileSync(targetFile, 'utf8');
        const loadedData = JSON.parse(content);
        if (Array.isArray(loadedData)) {
          setPersonnel(loadedData);
          localStorage.setItem('custom_data_path', trimmedPath);
          setCustomDataPath(trimmedPath);
          localStorage.setItem('personnel_db', JSON.stringify(loadedData));
          return true;
        }
      } else {
        fs.writeFileSync(targetFile, JSON.stringify(personnel, null, 2), 'utf8');
        localStorage.setItem('custom_data_path', trimmedPath);
        setCustomDataPath(trimmedPath);
        return true;
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật thư mục dữ liệu:', err);
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Lỗi: Thư mục không hợp lệ hoặc không có quyền ghi.', 'error');
      } else {
        alert('Lỗi: Thư mục không hợp lệ hoặc không có quyền ghi.');
      }
      return false;
    }
    return false;
  };

  // Add a new profile
  const addPersonnel = (profile: Omit<PersonnelProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProfile: PersonnelProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newList = [...personnel, newProfile];
    saveToStorage(newList);
    return newProfile;
  };

  // Update an existing profile
  const updatePersonnel = (id: string, updatedData: Partial<PersonnelProfile>) => {
    const newList = personnel.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        } as PersonnelProfile;
      }
      return item;
    });
    saveToStorage(newList);
  };

  // Deactivate a profile (Vô hiệu hồ sơ)
  const deactivatePersonnel = (id: string, destination: string, date: string) => {
    const newList = personnel.map((item) => {
      if (item.id === id) {
        const statusRecord = {
          id: `status_${Date.now()}`,
          type: 'deactivate' as const,
          date,
          location: destination,
        };
        const newUnitRecord = {
          id: `unit_${Date.now()}`,
          unit: destination, // Nơi chuyển đi (ví dụ: PC01, PC02...)
          date,
          action: 'Chuyển đi' as const,
        };
        const updatedStatusHistory = item.statusHistory ? [...item.statusHistory, statusRecord] : [statusRecord];
        const updatedUnitHistory = [...item.cand.unitHistory, newUnitRecord];
        return {
          ...item,
          status: 'inactive' as const,
          statusHistory: updatedStatusHistory,
          cand: {
            ...item.cand,
            unitHistory: updatedUnitHistory,
          },
          updatedAt: new Date().toISOString(),
        } as PersonnelProfile;
      }
      return item;
    });
    saveToStorage(newList);
  };

  // Activate a profile (Kích hoạt hồ sơ)
  const activatePersonnel = (id: string, source: string, date: string) => {
    const newList = personnel.map((item) => {
      if (item.id === id) {
        const statusRecord = {
          id: `status_${Date.now()}`,
          type: 'activate' as const,
          date,
          location: source,
        };
        const newUnitRecord = {
          id: `unit_${Date.now()}`,
          unit: source, // Đơn vị công tác chuyển đến (chọn Đội 1 – PC09, Đội 2 – PC09, Đội 3 – PC09)
          date,
          action: 'Chuyển đến' as const,
        };
        const updatedStatusHistory = item.statusHistory ? [...item.statusHistory, statusRecord] : [statusRecord];
        const updatedUnitHistory = [...item.cand.unitHistory, newUnitRecord];
        return {
          ...item,
          status: 'active' as const,
          statusHistory: updatedStatusHistory,
          cand: {
            ...item.cand,
            unitHistory: updatedUnitHistory,
          },
          updatedAt: new Date().toISOString(),
        } as PersonnelProfile;
      }
      return item;
    });
    saveToStorage(newList);
  };

  // Delete a profile
  const deletePersonnel = (id: string) => {
    const newList = personnel.filter((item) => item.id !== id);
    saveToStorage(newList);
  };

  // Reset to original sample data (or clear all in production)
  const resetToSample = () => {
    if (isProdOrElectron) {
      if (window.confirm('⚠️ Bạn có chắc chắn muốn XÓA SẠCH toàn bộ cơ sở dữ liệu? Hành động này không thể hoàn tác.')) {
        saveToStorage([]);
      }
    } else {
      if (window.confirm('Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu về dữ liệu mẫu ban đầu? Toàn bộ các dữ liệu tự thêm sẽ bị xóa.')) {
        saveToStorage(SAMPLE_PERSONNEL);
      }
    }
  };

  // Import from JSON
  const importDatabase = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        // Basic schema validation
        const isValid = parsed.every(item => item && item.id && item.personal && item.cand && item.daoTao);
        if (isValid) {
          saveToStorage(parsed);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Lỗi import dữ liệu:', e);
      return false;
    }
  };

  // Export to JSON string
  const exportDatabase = (): string => {
    return JSON.stringify(personnel, null, 2);
  };

  return {
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
    defaultDataPath: isElectron ? getElectronDefaultPath() : '',
    updateCustomDataPath,
  };
}
