const { bucket } = require("../config/firebase.config");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");



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
// Add this helper function at the top with other utilities
const processVideo = async (inputPath) => {
  try {
    const outputPath = path.join(
      path.dirname(inputPath),
      `processed_${path.basename(inputPath)}`
    );

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setDuration(30) // Trim to first 30 seconds
        .videoBitrate("80%") // Reduce quality to 80% of original
        .outputOptions([
          "-preset fast", // Faster encoding speed
          "-c:a copy", // Copy audio without re-encoding
          "-map 0:v:0", // Ensure video stream is included
          "-map 0:a?", // Include audio if present, optional
        ])
        .on("end", () => resolve(outputPath))
        .on("error", (err) => reject(err))
        .save(outputPath);
    });
  } catch (error) {
    console.error("Video processing error:", error);
    return inputPath; // Return original if processing fails
  }
};

const uploadGlipVideo = async (file) => {
  try {
    const filePath = file.filepath;
    if (!file?.filepath || !file?.originalFilename) {
      return { success: false, error: "Invalid file object" };
    }
    
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    const stats = await fs.stat(file.filepath);
    if (stats.size > maxSize) {
      return { success: false, error: "File size exceeds 100MB limit" };
    }
    
    // Process video (trim to 30s and reduce quality)
    const processedFilePath = await processVideo(filePath);
    
    // Generate unique filename to prevent overwrites
    const fileExtension = path.extname(file.originalFilename);
    const fileName = `${Date.now()}_${path.basename(file.originalFilename, fileExtension)}${fileExtension}`;
    const remoteFilePath = `product-glips/${fileName}`;

    // Upload processed video
    const uploadResponse = await bucket.upload(processedFilePath, {
      destination: remoteFilePath,
      metadata: {
        // Add metadata for better management
        metadata: {
          originalName: file.originalFilename,
          processed: "true",
          uploadDate: new Date().toISOString()
        }
      }
    });

    // Clean up processed file if different from original
    if (processedFilePath !== filePath) {
      await fs.unlink(processedFilePath).catch(err => 
        console.error("Cleanup error:", err)
      );
    }

    // Get signed URL with improved options
    const options = {
      action: "read",
      expires: "01-01-2100",
      version: "v4" // Use v4 signing for better security
    };
    
    const [signedUrl] = await bucket.file(remoteFilePath).getSignedUrl(options);

    return {
      success: true,
      url: signedUrl,
      filePath: remoteFilePath // Return storage path for potential deletion
    };
  } catch (error) {
    console.error("Video upload error:", error);
    return { 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    };
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
