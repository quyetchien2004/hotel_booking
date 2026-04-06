import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      const error = new Error('Chi chap nhan tep hinh anh cho CCCD');
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});

export const uploadCccdImage = upload.single('cccdImage');

export const uploadCccdVerificationImages = upload.fields([
  { name: 'cccdImage', maxCount: 1 },
  { name: 'faceImage', maxCount: 1 },
]);