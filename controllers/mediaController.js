const Media = require('../models/Media');
const fs = require('fs');
const path = require('path');

// POST /api/media/upload (for multiple files)
exports.uploadMedia = async (req, res) => {
  try {
    const { files } = req; 
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Save media details for each uploaded file
    const mediaDocuments = files.map((file) => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
    }));

    const media = await Media.insertMany(mediaDocuments);
    res.status(200).json({ message: 'Media uploaded successfully', media });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// GET /api/media/:id
exports.getMediaDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Media ID is required' });
    }
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    // Construct the full URL for the media file
    const host = req.protocol + '://' + req.get('host'); 
    const encodedPath = media.path.replace(/ /g, '%20').replace(/\\/g, '/'); // Encode spaces, normalize slashes
    const url = `${host}/${encodedPath}`;

    // Return media details with the URL
    res.status(200).json({
      media: {
        ...media.toObject(),
        url,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// DELETE /api/media/:id
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Media ID is required' });
    }
    
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ message: 'Media not found' });

    // Delete file from file system
    fs.unlink(path.resolve(media.path), (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting file', error: err });
      }
    });

    await Media.findByIdAndDelete(id);
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// DELETE /api/media/all (delete all media files)
exports.deleteAllMedia = async (req, res) => {
    try {
      const mediaFiles = await Media.find();
  
      // Delete all files from the filesystem
      mediaFiles.forEach((media) => {
        fs.unlink(path.resolve(media.path), (err) => {
          if (err) {
            console.error(`Failed to delete file ${media.path}:`, err);
          }
        });
      });
  
      // Remove all records from the database
      await Media.deleteMany({});
      res.status(200).json({ message: 'All media files deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  };
  
// GET /api/media
exports.getAllMedia = async (req, res) => {
  try {
    const media = await Media.find(); 
    if (!media || media.length === 0) {
      return res.status(404).json({ message: 'No media files found' });
    }

    // Construct full URL for each media file
    const host = req.protocol + '://' + req.get('host'); 
    const mediaWithPaths = media.map((item) => {
      // Replace only spaces with %20
      const encodedPath = item.path.replace(/ /g, '%20').replace(/\\/g, '/'); // Also convert backslashes to forward slashes
      return {
        ...item.toObject(),
        url: `${host}/${encodedPath}`, 
      };
    });

    res.status(200).json({ media: mediaWithPaths });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


