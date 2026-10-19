const multer = require('multer');
const { ValidationError } = require('../../../shared/errors/AppError');

// Memory storage so raw buffer can be verified for magic bytes before disk persistence
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB limit
    files: 1
  },
  fileFilter
}).single('image');

/**
 * Middleware handling multipart single image upload with clean error handling
 */
const handleImageUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('Uploaded image exceeds the maximum permitted size of 8 MB'));
        }
        return next(new ValidationError(`Image upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

module.exports = {
  handleImageUpload
};
