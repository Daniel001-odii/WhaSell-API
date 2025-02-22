const { bucket } = require("../config/firebase.config");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const resizeImage = async (filePath) => {
  try {
    const outputPath = path.join(path.dirname(filePath), `compressed_${path.basename(filePath)}`);

    await sharp(filePath)
      .resize({ width: Math.round(await sharp(filePath).metadata().then(m => m.width * 0.5)) }) // Reduce width by 50%
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error("Image compression error:", error);
    return filePath; // Return original file if compression fails
  }
};

const uploadFile = async (file, folder) => {
  try {
    const filePath = file.filepath;

    // Resize image if it's an image file
    const compressedFilePath = await resizeImage(filePath);

    // Set a preferred path on Firebase Storage
    const remoteFilePath = `${folder}/${file.originalFilename}`;

    // Upload the processed image
    await bucket.upload(compressedFilePath, { destination: remoteFilePath });

    // Clean up the compressed file (optional)
    if (compressedFilePath !== filePath) {
      await fs.unlink(compressedFilePath);
    }

    // Get the signed URL for the uploaded file
    const options = {
      action: "read",
      expires: "01-01-2100",
    };
    const signedUrl = await bucket.file(remoteFilePath).getSignedUrl(options);
    return { success: true, url: signedUrl[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const uploadProductImages = async (file) => uploadFile(file, "product-images");
const uploadShopImageOnRegister = async (file) => uploadFile(file, "shop-images");
const uploadShopProfileImage = async (file) => uploadFile(file, "shop-images");

// Video uploads remain unchanged
const uploadGlipVideo = async (file) => {
  try {
    const filePath = file.filepath;
    const remoteFilePath = `product-glips/${file.originalFilename}`;

    await bucket.upload(filePath, { destination: remoteFilePath });

    const options = { action: "read", expires: "01-01-2100" };
    const signedUrl = await bucket.file(remoteFilePath).getSignedUrl(options);

    return { success: true, url: signedUrl[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const deleteFile = async (filePath) => {
  try {
    await bucket.file(filePath).delete();
    return { success: true, message: `File ${filePath} deleted successfully.` };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  uploadProductImages,
  uploadShopImageOnRegister,
  uploadShopProfileImage,
  uploadGlipVideo,
  deleteFile,
};
