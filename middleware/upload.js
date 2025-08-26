const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept all files, but log what we received for debugging
  console.log('Received file:', file.fieldname, file.mimetype);
  
  // Still validate by mimetype for security
  if (file.mimetype.startsWith('image/') || 
      file.mimetype === 'application/pdf' ||
      file.mimetype.includes('document')) {
    cb(null, true);
  } else {
    cb(new Error('Please upload a valid document (PDF, DOC, DOCX) or image file'), false);
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
