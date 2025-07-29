const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const heicConvert = require('heic-convert');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with CSP configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Create upload and converted directories
const uploadDir = path.join(__dirname, 'uploads');
const convertedDir = path.join(__dirname, 'converted');

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(convertedDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check both MIME type and file extension
    const allowedTypes = ['image/heic', 'image/heif'];
    const allowedExtensions = ['.heic', '.heif'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only HEIC/HEIF files are allowed'), false);
    }
  }
});

// In-memory storage for file tracking (in production, use Redis or database)
const fileStore = new Map();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload files
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileId = uuidv4();
      const fileInfo = {
        id: fileId,
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        size: file.size,
        status: 'uploaded',
        uploadedAt: new Date()
      };
      
      fileStore.set(fileId, fileInfo);
      uploadedFiles.push(fileInfo);
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Convert files
app.post('/api/convert', async (req, res) => {
  try {
    const { fileIds, outputFormat = 'jpeg', stripExif = false } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds)) {
      return res.status(400).json({ error: 'File IDs required' });
    }

    const results = [];
    
    for (const fileId of fileIds) {
      const fileInfo = fileStore.get(fileId);
      if (!fileInfo) {
        results.push({ fileId, success: false, error: 'File not found' });
        continue;
      }

      try {
        fileInfo.status = 'converting';
        fileStore.set(fileId, fileInfo);

        const outputFilename = `${uuidv4()}.${outputFormat}`;
        const outputPath = path.join(convertedDir, outputFilename);
        
        // Convert HEIC to target format
        let convertedBuffer;
        
        if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
          // Use heic-convert for HEIC to JPEG
          const inputBuffer = await fs.readFile(fileInfo.path);
          convertedBuffer = await heicConvert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: 0.9
          });
        } else if (outputFormat === 'png') {
          // Use heic-convert for HEIC to PNG
          const inputBuffer = await fs.readFile(fileInfo.path);
          convertedBuffer = await heicConvert({
            buffer: inputBuffer,
            format: 'PNG'
          });
        } else {
          throw new Error('Unsupported output format');
        }

        // Save converted file
        await fs.writeFile(outputPath, convertedBuffer);

        // Update file info
        fileInfo.status = 'converted';
        fileInfo.convertedPath = outputPath;
        fileInfo.convertedFilename = outputFilename;
        fileInfo.outputFormat = outputFormat;
        fileInfo.convertedAt = new Date();
        fileStore.set(fileId, fileInfo);

        results.push({
          fileId,
          success: true,
          convertedFilename: outputFilename,
          originalName: fileInfo.originalName
        });

      } catch (error) {
        console.error(`Conversion error for ${fileId}:`, error);
        fileInfo.status = 'error';
        fileInfo.error = error.message;
        fileStore.set(fileId, fileInfo);
        
        results.push({
          fileId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// Get file status
app.get('/api/files', (req, res) => {
  const files = Array.from(fileStore.values());
  res.json({
    files: files.filter(f => f.status === 'uploaded'),
    convertedFiles: files.filter(f => f.status === 'converted')
  });
});

// Download file
app.get('/api/download/:fileId', (req, res) => {
  try {
    const fileInfo = fileStore.get(req.params.fileId);
    if (!fileInfo || fileInfo.status !== 'converted') {
      return res.status(404).json({ error: 'File not found or not converted' });
    }

    const outputName = fileInfo.originalName.replace(/\.(heic|heif)$/i, `.${fileInfo.outputFormat}`);
    res.download(fileInfo.convertedPath, outputName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Download all files as ZIP
app.get('/api/download-all', async (req, res) => {
  try {
    const convertedFiles = Array.from(fileStore.values()).filter(f => f.status === 'converted');
    
    if (convertedFiles.length === 0) {
      return res.status(404).json({ error: 'No converted files found' });
    }

    if (convertedFiles.length === 1) {
      // Single file download
      const fileInfo = convertedFiles[0];
      const outputName = fileInfo.originalName.replace(/\.(heic|heif)$/i, `.${fileInfo.outputFormat}`);
      return res.download(fileInfo.convertedPath, outputName);
    }

    // Multiple files - create ZIP (simplified for demo)
    // In production, use a library like archiver
    res.status(501).json({ error: 'Multiple file download not implemented yet' });
  } catch (error) {
    console.error('Download all error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Clear all files
app.post('/api/clear', async (req, res) => {
  try {
    // Delete all files
    for (const [fileId, fileInfo] of fileStore.entries()) {
      try {
        if (fileInfo.path && await fs.pathExists(fileInfo.path)) {
          await fs.remove(fileInfo.path);
        }
        if (fileInfo.convertedPath && await fs.pathExists(fileInfo.convertedPath)) {
          await fs.remove(fileInfo.convertedPath);
        }
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
      }
    }
    
    fileStore.clear();
    
    res.json({ success: true, message: 'All files cleared' });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({ error: 'Clear failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HEIC to JPG Converter running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to use the converter`);
}); 