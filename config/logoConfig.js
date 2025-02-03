const multer = require('multer');
const path = require('path');

// Set storage engine
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'Logos/'); // Store logos in the Logos directory
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
  });

// File filter for images and videos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|jfif|avi|mkv|pdf|doc|docx|xls|xlsx|txt|csv|webp|svg|bmp|tiff|mp3|wav|ogg/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
    if (mimeType && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not allowed!'));
    }
  };

  const uploadLogo = multer({ 
    storage: logoStorage, 
    fileFilter,
    limits: { fileSize: 5000000 } // Limit to 5MB for logos
  });

module.exports = { uploadLogo };
