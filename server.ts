import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure data directory
  const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const DB_FILE = path.join(DATA_DIR, 'personnel_db.json');
  const PDF_DIR = path.join(DATA_DIR, 'van_bang_pdf');

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }

  // Increase body size limits to handle base64 PDFs
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // Serve PDFs statically
  app.use('/van_bang_pdf', express.static(PDF_DIR));

  // 1. Get Personnel List
  app.get('/api/personnel', (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        return res.json(JSON.parse(content));
      }
      return res.json([]);
    } catch (err) {
      console.error('Lỗi khi đọc database:', err);
      return res.status(500).json({ error: 'Không thể đọc cơ sở dữ liệu' });
    }
  });

  // 2. Save Personnel List (Extracting Base64 PDFs)
  app.post('/api/personnel', (req, res) => {
    try {
      const updatedList = req.body;
      if (!Array.isArray(updatedList)) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
      }

      const folderMapping: Record<string, string> = {
        nghiepVu: 'nghiep_vu',
        chuyenMon: 'chuyen_mon',
        lyLuan: 'ly_luan',
        boiDuong: 'boi_duong'
      };

      const processedList = updatedList.map(profile => {
        if (!profile.daoTao) return profile;
        
        const updatedDaoTao = { ...profile.daoTao };
        let profileChanged = false;

        const types = ['nghiepVu', 'chuyenMon', 'lyLuan', 'boiDuong'] as const;
        for (const type of types) {
          const list = updatedDaoTao[type];
          if (Array.isArray(list)) {
            let listChanged = false;
            const newList = list.map((item: any) => {
              if (item.imageUrl && item.imageUrl.startsWith('data:application/pdf;base64,')) {
                try {
                  const subFolderName = folderMapping[type];
                  const targetSubDir = path.join(PDF_DIR, subFolderName);
                  
                  if (!fs.existsSync(targetSubDir)) {
                    fs.mkdirSync(targetSubDir, { recursive: true });
                  }

                  const fileName = `${item.id}.pdf`;
                  const targetFile = path.join(targetSubDir, fileName);
                  const base64Data = item.imageUrl.replace(/^data:application\/pdf;base64,/, '');
                  
                  fs.writeFileSync(targetFile, base64Data, 'base64');
                  
                  listChanged = true;
                  profileChanged = true;
                  
                  // Return relative URL path that will be served statically by Express
                  return {
                    ...item,
                    imageUrl: `van_bang_pdf/${subFolderName}/${fileName}`,
                  };
                } catch (err) {
                  console.error(`Lỗi khi lưu tệp đính kèm ${type}:`, err);
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

      // Write processed database to DB_FILE
      fs.writeFileSync(DB_FILE, JSON.stringify(processedList, null, 2), 'utf8');
      return res.json(processedList);
    } catch (err) {
      console.error('Lỗi khi ghi database:', err);
      return res.status(500).json({ error: 'Không thể lưu cơ sở dữ liệu' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
