const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mkv/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb('Error: Only images and videos are allowed!');
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10000000 } // Limit to 10MB
});

module.exports = upload;
