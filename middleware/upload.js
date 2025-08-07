const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.fieldname === 'proofOfAddress') {
    // Allow documents and images for proof of address
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a valid document (PDF, DOC, DOCX) or image file'), false);
    }
  } else if (file.fieldname === 'profileImage') {
    // Only allow images for profile pictures
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload a valid image file'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter,
});

module.exports = upload;
