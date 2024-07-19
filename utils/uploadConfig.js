const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});


const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'product-images/');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

const upload = multer({ storage: storage });
const product_image_upload = multer({ storage: storage2 });

module.exports = upload;
module.exports = product_image_upload;
