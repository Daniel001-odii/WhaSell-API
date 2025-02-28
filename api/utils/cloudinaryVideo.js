const cloudinary = require("cloudinary").v2;

 // Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

function trimmedVideo(video_key) {
  return cloudinary.url(video_key, {
    resource_type: "video",
    transformation: [{ start_offset: "0", end_offset: "20" }],
  });
}
/*
// Upload a video
async function uploadVideo(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
    });
    console.log("Video uploaded:", result.secure_url);
    const trimmed_result = trimmedVideo(result.public_id);
    return trimmed_result;
  } catch (error) {
    console.error("Upload error:", error);
  }
} */

// Upload a video with an eager thumbnail transformation
async function uploadVideo(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      eager: [{ format: "jpg", transformation: [{ width: 400, crop: "scale", effect: "sharpen" }] }], // Generates a 400px-wide thumbnail
    });

    console.log("Video uploaded:", result.secure_url);
    console.log("Thumbnail generated:", result.eager[0].secure_url);

    return {
      videoUrl: result.secure_url,
      thumbnailUrl: result.eager[0].secure_url,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}


// delete video
const deleteVideo = async (req, res) => {
  const publicId = req.params.publicId; // Get Public ID from URL parameter

  // Check if Public ID is provided
  if (!publicId) {
    return res.status(400).json({ message: "Public ID is required" });
  }

  try {
    // Delete the video from Cloudinary
    const videoDeletion = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    // Delete the thumbnail (thumbnails are stored as images, same public ID but different type)
    const thumbnailDeletion = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

    // Handle deletion responses
    if (videoDeletion.result === "ok" || thumbnailDeletion.result === "ok") {
      return res.status(200).json({
        message: "Video and thumbnail deleted successfully",
        videoDeleted: videoDeletion.result,
        thumbnailDeleted: thumbnailDeletion.result,
      });
    } else {
      return res.status(400).json({
        message: "Failed to delete video or thumbnail",
        videoDeletion,
        thumbnailDeletion,
      });
    }
  } catch (error) {
    // Handle any errors (e.g., network issues, invalid credentials)
    return res.status(500).json({ message: "Error deleting video or thumbnail", error: error.message });
  }
};

// Example usage
module.exports = { uploadVideo, deleteVideo };
// uploadVideo('./myvideo.mp4');
