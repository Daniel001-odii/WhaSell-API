const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');



const productImageUpload = multer({
  limits: { fileSize: 800000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/images/products");
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`); // Use UUID to generate a unique filename
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedFileType = ["jpg", "jpeg", "png"];
    if (allowedFileType.includes(file.mimetype.split("/")[1])) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});


// Configuration for profile pictures
const profileImageUpload = multer({
  limits: { fileSize: 200000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/images/profiles');
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = ["jpg", "jpeg", "png"];
    if (allowedFileTypes.includes(file.mimetype.split("/")[1])) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});


// Configuration for profile pictures
const shopImageUpload = multer({
  limits: { fileSize: 200000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/images/shops');
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = ["jpg", "jpeg", "png"];
    if (allowedFileTypes.includes(file.mimetype.split("/")[1])) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only JPG, JPEG, and PNG is allowed!'), false);
    }
  }
});



// Configuration for document uploads
const documentUpload = multer({
  limits: { fileSize: 5000000 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/documents');
    },
    filename: (req, file, cb) => {
      let ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = ["pdf", "doc", "docx"];
    if (allowedFileTypes.includes(file.mimetype.split("/")[1])) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});




module.exports = { 
  productImageUpload, 
  profileImageUpload, 
  shopImageUpload,
  documentUpload 
};