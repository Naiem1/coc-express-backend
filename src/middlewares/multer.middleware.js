import multer from 'multer';

// Multer middleware for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // flow: can be multiple file as same name in the local server, in the local server file stored for very tiny amouont of time
  },
});

export const upload = multer({
  storage,
});
