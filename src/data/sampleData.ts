/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersonnelProfile } from '../types';

export const SAMPLE_PERSONNEL: PersonnelProfile[] = (import.meta as any).env?.PROD ? [] : [
  {
    id: 'profile_nguyen_van_a',
    status: 'inactive',
    statusHistory: [
      { id: 'sh_1', type: 'deactivate', date: '2025-05-12', location: 'PC01' }
    ],
    personal: {
      fullName: 'Nguyễn Văn A',
      gender: 'Nam',
      dob: '1990-04-12',
      hometown: 'Hoài Đức, Hà Nội',
      ethnicity: 'Kinh',
      religion: 'Không',
      phone: '0987654321',
      cccdHistory: [
        {
          id: 'cccd_1',
          number: '012345678',
          place: 'Công an Thành phố Hà Nội',
          date: '2010-05-10',
        },
        {
          id: 'cccd_2',
          number: '001090001234',
          place: 'Cục Cảnh sát QLHC về TTXH',
          date: '2016-06-20',
        },
        {
          id: 'cccd_3',
          number: '001090009999',
          place: 'Cục Cảnh sát QLHC về TTXH',
          date: '2021-05-15',
        },
      ],
      bhytHistory: [
        {
          id: 'bhyt_a1',
          cardNumber: 'GD4010123456789',
          registrationPlace: 'Bệnh viện Đa khoa Hà Đông',
          startDate: '2020-01-01',
          endDate: '2022-12-31',
        },
        {
          id: 'bhyt_a2',
          cardNumber: 'GD4010199999999',
          registrationPlace: 'Bệnh viện 19-8 Bộ Công an',
          startDate: '2023-01-01',
          endDate: '2025-12-31',
        },
      ],
    },
    cand: {
      entryDate: '2008-09-05',
      securityId: '123-456',
      rankHistory: [
        { id: 'rank_1', rank: 'Thiếu úy', date: '2012-06-16' },
        { id: 'rank_2', rank: 'Trung úy', date: '2014-06-16' },
        { id: 'rank_3', rank: 'Thượng úy', date: '2017-06-16' },
        { id: 'rank_4', rank: 'Đại úy', date: '2021-06-16' },
        { id: 'rank_5', rank: 'Thiếu tá', date: '2025-06-16' },
      ],
      positionHistory: [
        { id: 'pos_1', position: 'Chiến sĩ', date: '2008-10-01' },
        { id: 'pos_2', position: 'Phó Đội trưởng', date: '2016-03-10' },
        { id: 'pos_3', position: 'Đội trưởng', date: '2021-04-15' },
      ],
      unitHistory: [
        { id: 'unit_1', unit: 'Đội 1 – PC09', date: '2020-02-23', action: 'Chuyển đến', fromUnit: 'PC02' },
        { id: 'unit_2', unit: 'Đội 3 – PC09', date: '2023-10-10', action: 'Chuyển đến', fromUnit: 'PX01' },
        { id: 'unit_3', unit: 'PC01', date: '2025-05-12', action: 'Chuyển đi' },
      ],
      chucDanhHistory: [
        { id: 'cd_1', ngach: 'Kỹ thuật viên', bac: 'Sơ cấp', action: 'Bổ nhiệm', date: '2010-01-12' },
        { id: 'cd_2', ngach: 'Kỹ thuật viên', bac: 'Trung cấp', action: 'Bổ nhiệm', date: '2013-10-29' },
        { id: 'cd_3', ngach: 'Giám định viên', bac: 'Trung cấp', action: 'Chuyển ngạch', date: '2018-07-01' },
        { id: 'cd_4', ngach: 'Giám định viên', bac: 'Trung cấp', action: 'Miễn nhiệm', date: '2025-07-01' },
      ],
    },
    dang: {
      hasDang: true,
      entryDate: '2012-05-19',
      officialDate: '2013-05-19',
      cardId: '12345678',
      cardIssueDate: '2013-10-10',
      cardIssuePlace: 'Đảng ủy Công an Thành phố Hà Nội',
    },
    daoTao: {
      nghiepVu: [
        {
          id: 'nv_1',
          degree: 'Trung cấp',
          school: 'Trường Trung cấp Cảnh sát nhân dân I',
          major: 'Cảnh sát điều tra',
          diplomaNumber: '001',
          dateOfIssue: '2010-12-12',
          trainingForm: 'Tập trung',
        },
        {
          id: 'nv_2',
          degree: 'Đại học',
          school: 'Học viện Cảnh sát nhân dân',
          major: 'Điều tra trinh sát',
          diplomaNumber: '321',
          dateOfIssue: '2019-09-16',
          trainingForm: 'Không tập trung',
        },
      ],
      chuyenMon: [
        {
          id: 'cm_1',
          degree: 'Trung cấp',
          school: 'Trường Trung cấp Bưu chính Viễn thông',
          major: 'Điện tử viễn thông',
          diplomaNumber: '651',
          dateOfIssue: '2013-12-12',
          trainingForm: 'Tập trung',
        },
        {
          id: 'cm_2',
          degree: 'Đại học',
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Công nghệ thông tin',
          diplomaNumber: '877',
          dateOfIssue: '2015-05-06',
          trainingForm: 'Tập trung',
        },
        {
          id: 'cm_3',
          degree: 'Đại học',
          school: 'Viện Đại học Mở Hà Nội',
          major: 'Ngôn ngữ Anh',
          diplomaNumber: '999',
          dateOfIssue: '2021-08-09',
          trainingForm: 'Không tập trung',
        },
      ],
      lyLuan: [
        {
          id: 'll_1',
          type: 'Bằng',
          diplomaNumber: '345',
          dateOfIssue: '2016-02-02',
          trainingForm: 'Tập trung',
          level: 'Sơ cấp',
          facility: 'Trung tâm bồi dưỡng chính trị Huyện Hoài Đức',
        },
        {
          id: 'll_2',
          type: 'Chứng chỉ',
          diplomaNumber: '657',
          dateOfIssue: '2019-12-06',
          trainingForm: 'Không tập trung',
          level: 'Trung cấp',
          facility: 'Học viện Chính trị Công an nhân dân',
        },
      ],
      boiDuong: [
        {
          id: 'bd_1',
          diplomaNumber: '345',
          dateOfIssue: '2013-02-02',
          facility: 'Trường Cao đẳng Cảnh sát nhân dân I',
          field: 'Nghiệp vụ trinh sát hình sự',
        },
        {
          id: 'bd_2',
          diplomaNumber: '987',
          dateOfIssue: '2015-08-11',
          facility: 'Học viện An ninh nhân dân',
          field: 'Ứng dụng Công nghệ thông tin trong đấu tranh phòng chống tội phạm mạng',
        },
      ],
    },
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-06-28T15:30:00Z',
  },
  {
    id: 'profile_tran_thi_b',
    personal: {
      fullName: 'Trần Thị B',
      gender: 'Nữ',
      dob: '1988-08-25',
      hometown: 'Ý Yên, Nam Định',
      ethnicity: 'Kinh',
      religion: 'Không',
      phone: '0912345678',
      cccdHistory: [
        {
          id: 'cccd_b1',
          number: '001088002345',
          place: 'Cục Cảnh sát QLHC về TTXH',
          date: '2018-10-12',
        },
      ],
      bhytHistory: [
        {
          id: 'bhyt_b1',
          cardNumber: 'GD4010188888888',
          registrationPlace: 'Bệnh viện 19-8 Bộ Công an',
          startDate: '2018-10-12',
          endDate: '2028-10-12',
        },
      ],
    },
    cand: {
      entryDate: '2006-09-01',
      securityId: '888-999',
      rankHistory: [
        { id: 'rank_b1', rank: 'Trung úy', date: '2010-06-16' },
        { id: 'rank_b2', rank: 'Thượng úy', date: '2013-06-16' },
        { id: 'rank_b3', rank: 'Đại úy', date: '2017-06-16' },
        { id: 'rank_b4', rank: 'Thiếu tá', date: '2021-06-16' },
        { id: 'rank_b5', rank: 'Trung tá', date: '2025-06-16' },
      ],
      positionHistory: [
        { id: 'pos_b1', position: 'Chiến sĩ', date: '2006-10-01' },
        { id: 'pos_b2', position: 'Phó Đội trưởng', date: '2014-05-15' },
        { id: 'pos_b3', position: 'Đội trưởng', date: '2019-11-20' },
        { id: 'pos_b4', position: 'Phó Trưởng phòng', date: '2024-03-10' },
      ],
      unitHistory: [
        { id: 'unit_b1', unit: 'Đội 1 – PC09', date: '2006-10-01', action: 'Chuyển đến', fromUnit: 'Trường Đại học CSND' },
        { id: 'unit_b2', unit: 'Đội 2 – PC09', date: '2019-11-20', action: 'Chuyển đến', fromUnit: 'PX01' },
      ],
    },
    dang: {
      hasDang: true,
      entryDate: '2009-11-03',
      officialDate: '2010-11-03',
      cardId: '87654321',
      cardIssueDate: '2011-01-15',
      cardIssuePlace: 'Đảng ủy Công an Thành phố Hà Nội',
    },
    daoTao: {
      nghiepVu: [
        {
          id: 'nv_b1',
          degree: 'Đại học',
          school: 'Học viện Cảnh sát nhân dân',
          major: 'Quản lý hành chính về trật tự xã hội',
          diplomaNumber: '4455',
          dateOfIssue: '2010-07-15',
          trainingForm: 'Tập trung',
        },
        {
          id: 'nv_b2',
          degree: 'Thạc sĩ',
          school: 'Học viện Cảnh sát nhân dân',
          major: 'Tội phạm học và phòng ngừa tội phạm',
          diplomaNumber: '6677',
          dateOfIssue: '2016-11-20',
          trainingForm: 'Không tập trung',
        },
      ],
      chuyenMon: [
        {
          id: 'cm_b1',
          degree: 'Đại học',
          school: 'Trường Đại học Luật Hà Nội',
          major: 'Luật Hành chính',
          diplomaNumber: '1122',
          dateOfIssue: '2014-06-30',
          trainingForm: 'Không tập trung',
        },
        {
          id: 'cm_b2',
          degree: 'Tiến sĩ',
          school: 'Trường Đại học Luật Hà Nội',
          major: 'Luật học',
          diplomaNumber: '9988',
          dateOfIssue: '2022-12-15',
          trainingForm: 'Không tập trung',
        },
      ],
      lyLuan: [
        {
          id: 'll_b1',
          type: 'Bằng',
          diplomaNumber: '1212',
          dateOfIssue: '2018-05-10',
          trainingForm: 'Tập trung',
          level: 'Trung cấp',
          facility: 'Học viện Chính trị Công an nhân dân',
        },
        {
          id: 'll_b2',
          type: 'Bằng',
          diplomaNumber: '5566',
          dateOfIssue: '2023-09-20',
          trainingForm: 'Tập trung',
          level: 'Cao cấp',
          facility: 'Học viện Chính trị Quốc gia Hồ Chí Minh',
        },
      ],
      boiDuong: [
        {
          id: 'bd_b1',
          diplomaNumber: '3344',
          dateOfIssue: '2012-04-15',
          facility: 'Trường Đào tạo bồi dưỡng nghiệp vụ CAND',
          field: 'Quản lý nhà nước chương trình Chuyên viên',
        },
        {
          id: 'bd_b2',
          diplomaNumber: '7788',
          dateOfIssue: '2024-07-10',
          facility: 'Học viện Chính trị Công an nhân dân',
          field: 'Bồi dưỡng chức danh Phó Trưởng phòng và tương đương',
        },
      ],
    },
    createdAt: '2026-06-20T08:00:00Z',
    updatedAt: '2026-06-28T16:00:00Z',
  },
  {
    id: 'profile_le_van_c',
    personal: {
      fullName: 'Lê Văn C',
      gender: 'Nam',
      dob: '1995-11-05',
      hometown: 'Thanh Hà, Hải Dương',
      ethnicity: 'Kinh',
      religion: 'Không',
      phone: '0977888999',
      cccdHistory: [
        {
          id: 'cccd_c1',
          number: '030095004567',
          place: 'Cục Cảnh sát QLHC về TTXH',
          date: '2016-12-05',
        },
      ],
      bhytHistory: [
        {
          id: 'bhyt_c1',
          cardNumber: 'GD4010177777777',
          registrationPlace: 'Bệnh viện Y học cổ truyền Bộ Công an',
          startDate: '2016-12-05',
          endDate: '2026-12-05',
        },
      ],
    },
    cand: {
      entryDate: '2013-09-05',
      securityId: '555-666',
      rankHistory: [
        { id: 'rank_c1', rank: 'Trung úy', date: '2018-06-16' },
        { id: 'rank_c2', rank: 'Thượng úy', date: '2021-06-16' },
        { id: 'rank_c3', rank: 'Đại úy', date: '2025-06-16' },
      ],
      positionHistory: [
        { id: 'pos_c1', position: 'Chiến sĩ', date: '2013-10-01' },
        { id: 'pos_c2', position: 'Phó Đội trưởng', date: '2024-10-15' },
      ],
      unitHistory: [
        { id: 'unit_c1', unit: 'Đội 2 – PC09', date: '2013-10-01', action: 'Chuyển đến', fromUnit: 'PX01' },
        { id: 'unit_c2', unit: 'Đội 3 – PC09', date: '2020-02-01', action: 'Chuyển đến', fromUnit: 'Đội 1 – PC09' },
      ],
    },
    dang: {
      hasDang: false,
    },
    daoTao: {
      nghiepVu: [
        {
          id: 'nv_c1',
          degree: 'Cao đẳng',
          school: 'Trường Cao đẳng Cảnh sát nhân dân II',
          major: 'Phòng cháy chữa cháy',
          diplomaNumber: '778899',
          dateOfIssue: '2016-07-20',
          trainingForm: 'Tập trung',
        },
        {
          id: 'nv_c2',
          degree: 'Đại học',
          school: 'Trường Đại học Phòng cháy chữa cháy',
          major: 'Kỹ thuật phòng cháy chữa cháy và CNCH',
          diplomaNumber: '112233',
          dateOfIssue: '2022-09-15',
          trainingForm: 'Không tập trung',
        },
      ],
      chuyenMon: [],
      lyLuan: [
        {
          id: 'll_c1',
          type: 'Chứng nhận',
          diplomaNumber: '4455',
          dateOfIssue: '2017-04-10',
          trainingForm: 'Tập trung',
          level: 'Sơ cấp',
          facility: 'Trung tâm Chính trị Quận Cầu Giấy',
        },
      ],
      boiDuong: [
        {
          id: 'bd_c1',
          diplomaNumber: '2233',
          dateOfIssue: '2018-11-20',
          facility: 'Trường Đại học PCCC',
          field: 'Bồi dưỡng nghiệp vụ cứu nạn, cứu hộ nâng cao',
        },
      ],
    },
    createdAt: '2026-06-22T09:00:00Z',
    updatedAt: '2026-06-28T14:20:00Z',
  },
];
