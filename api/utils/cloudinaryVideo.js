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
}


// Controller to delete a video from Cloudinary
const deleteVideo = async (req, res) => {
    const publicId = req.params.publicId; // Get Public ID from URL parameter
  
    // Check if Public ID is provided
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
  
    try {
      // Delete the video from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  
      // Handle the response from Cloudinary
      if (result.result === 'ok') {
        return res.status(200).json({ message: 'Video deleted successfully' });
      } else if (result.result === 'not found') {
        return res.status(404).json({ message: 'Video not found' });
      } else {
        return res.status(400).json({ message: 'Failed to delete video', details: result });
      }
    } catch (error) {
      // Handle any errors (e.g., network issues, invalid credentials)
      return res.status(500).json({ message: 'Error deleting video', error: error.message });
    }
  };
// Example usage
module.exports = { uploadVideo, deleteVideo };
// uploadVideo('./myvideo.mp4');
