const { bucket } = require('../config/firebase.config');


const formidable = require('formidable');

// Function to initialize and configure formidable
const initializeFormidable = () => {
  return formidable({ multiple: true });
};

const uploadProductImages = async (file) => {
    try {
      // Path to the image file on the local machine
      const filePath = file.filepath;
  
      // Set a preferred path on Firebase Storage
      const remoteFilePath = `product-images/${file.originalFilename}`;
  
      // Upload the image using the bucket.upload() function
      await bucket.upload(filePath, { destination: remoteFilePath });
  
      // Options for the getSignedUrl() function
      const options = {
        action: 'read',
        expires: '01-01-2100'
      };
  
      // Get the signed URL for the uploaded file
      const signedUrl = await bucket.file(remoteFilePath).getSignedUrl(options);
      const imageUrl = signedUrl[0];
  
      return { success: true, url: imageUrl };
    } catch (uploadError) {
      return { success: false, error: uploadError.message };
    }
  };



  const uploadUserProfileImage = async (file) => {
    try {
      // Path to the image file on the local machine
      const filePath = file.filepath;
  
      // Set a preferred path on Firebase Storage
      const remoteFilePath = `product-images/${file.originalFilename}`;
  
      // Upload the image using the bucket.upload() function
      await bucket.upload(filePath, { destination: remoteFilePath });
  
      // Options for the getSignedUrl() function
      const options = {
        action: 'read',
        expires: '01-01-2100'
      };
  
      // Get the signed URL for the uploaded file
      const signedUrl = await bucket.file(remoteFilePath).getSignedUrl(options);
      const imageUrl = signedUrl[0];
  
      return { success: true, url: imageUrl };
    } catch (uploadError) {
      return { success: false, error: uploadError.message };
    }
  };


  const deleteFile = async (filePath) => {
    try {
      // Reference the file in the Firebase Storage bucket
      const file = bucket.file(filePath);
  
      // Delete the file
      await file.delete();
  
      return { success: true, message: `File ${filePath} deleted successfully.` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  
  module.exports = { uploadProductImages, uploadUserProfileImage, deleteFile };