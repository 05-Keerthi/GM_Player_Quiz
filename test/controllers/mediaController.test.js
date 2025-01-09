const mongoose = require('mongoose');
const Media = require('../../models/Media');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../models/Media');
jest.mock('fs');
jest.mock('path');

const {
  uploadMedia,
  getMediaDetails,
  deleteMedia,
  deleteAllMedia,
  getAllMedia
} = require('../../controllers/mediaController');

describe('Media Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000'),
      files: []
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('uploadMedia', () => {
    it('should upload multiple files successfully', async () => {
      // Setup
      const mockFiles = [
        {
          filename: 'test1.jpg',
          path: 'uploads/test1.jpg',
          mimetype: 'image/jpeg'
        },
        {
          filename: 'test2.png',
          path: 'uploads/test2.png',
          mimetype: 'image/png'
        }
      ];
      req.files = mockFiles;

      const mockMediaDocs = mockFiles.map(file => ({
        _id: new mongoose.Types.ObjectId(),
        ...file
      }));

      Media.insertMany.mockResolvedValue(mockMediaDocs);

      // Execute
      await uploadMedia(req, res);

      // Assert
      expect(Media.insertMany).toHaveBeenCalledWith(mockFiles.map(file => ({
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype
      })));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Media uploaded successfully',
        media: mockMediaDocs
      });
    });

    it('should return 400 when no files are uploaded', async () => {
      // Setup
      req.files = [];

      // Execute
      await uploadMedia(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No files uploaded'
      });
    });

    it('should handle errors during upload', async () => {
      // Setup
      req.files = [{ filename: 'test.jpg', path: 'uploads/test.jpg', mimetype: 'image/jpeg' }];
      const error = new Error('Upload error');
      Media.insertMany.mockRejectedValue(error);

      // Execute
      await uploadMedia(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error
      });
    });
  });

  describe('getMediaDetails', () => {
    it('should get media details successfully', async () => {
      // Setup
      const mediaId = 'media123';
      req.params = { id: mediaId };
      
      const mockMedia = {
        _id: mediaId,
        filename: 'test.jpg',
        path: 'uploads\\test.jpg',
        mimetype: 'image/jpeg',
        toObject: jest.fn().mockReturnThis()
      };

      Media.findById.mockResolvedValue(mockMedia);

      // Execute
      await getMediaDetails(req, res);

      // Assert
      expect(Media.findById).toHaveBeenCalledWith(mediaId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        media: {
          ...mockMedia,
          url: 'http://localhost:5000/uploads/test.jpg'
        }
      });
    });

    it('should handle spaces in media path', async () => {
      // Setup
      const mediaId = 'media123';
      req.params = { id: mediaId };
      
      const mockMedia = {
        _id: mediaId,
        filename: 'test image.jpg',
        path: 'uploads\\test image.jpg',
        mimetype: 'image/jpeg',
        toObject: jest.fn().mockReturnThis()
      };

      Media.findById.mockResolvedValue(mockMedia);

      // Execute
      await getMediaDetails(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        media: {
          ...mockMedia,
          url: 'http://localhost:5000/uploads/test%20image.jpg'
        }
      });
    });

    it('should return 404 when media not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Media.findById.mockResolvedValue(null);

      // Execute
      await getMediaDetails(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Media not found'
      });
    });
  });

  describe('deleteMedia', () => {
    it('should delete media successfully', async () => {
      // Setup
      const mediaId = 'media123';
      req.params = { id: mediaId };
      
      const mockMedia = {
        _id: mediaId,
        path: 'uploads/test.jpg'
      };

      Media.findById.mockResolvedValue(mockMedia);
      Media.findByIdAndDelete.mockResolvedValue(mockMedia);
      path.resolve.mockReturnValue('uploads/test.jpg');
      fs.unlink.mockImplementation((path, callback) => callback(null));

      // Execute
      await deleteMedia(req, res);

      // Assert
      expect(Media.findById).toHaveBeenCalledWith(mediaId);
      expect(fs.unlink).toHaveBeenCalled();
      expect(Media.findByIdAndDelete).toHaveBeenCalledWith(mediaId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Media deleted successfully'
      });
    });

    it('should handle filesystem errors during deletion', async () => {
      // Setup
      const mediaId = 'media123';
      req.params = { id: mediaId };
      
      const mockMedia = {
        _id: mediaId,
        path: 'uploads/test.jpg'
      };

      Media.findById.mockResolvedValue(mockMedia);
      path.resolve.mockReturnValue('uploads/test.jpg');
      fs.unlink.mockImplementation((path, callback) => callback(new Error('Filesystem error')));

      // Execute
      await deleteMedia(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting file',
        error: expect.any(Error)
      });
    });
  });

  describe('deleteAllMedia', () => {
    it('should delete all media successfully', async () => {
      // Setup
      const mockMediaFiles = [
        { _id: 'media1', path: 'uploads/test1.jpg' },
        { _id: 'media2', path: 'uploads/test2.jpg' }
      ];

      Media.find.mockResolvedValue(mockMediaFiles);
      Media.deleteMany.mockResolvedValue({ deletedCount: 2 });
      path.resolve.mockImplementation(path => path);
      fs.unlink.mockImplementation((path, callback) => callback(null));

      // Execute
      await deleteAllMedia(req, res);

      // Assert
      expect(Media.find).toHaveBeenCalled();
      expect(fs.unlink).toHaveBeenCalledTimes(2);
      expect(Media.deleteMany).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All media files deleted successfully'
      });
    });
  });

  describe('getAllMedia', () => {
    it('should get all media files successfully', async () => {
      // Setup
      const mockMediaFiles = [
        {
          _id: 'media1',
          filename: 'test1.jpg',
          path: 'uploads\\test1.jpg',
          mimetype: 'image/jpeg',
          toObject: jest.fn().mockReturnThis()
        },
        {
          _id: 'media2',
          filename: 'test2.jpg',
          path: 'uploads\\test2.jpg',
          mimetype: 'image/jpeg',
          toObject: jest.fn().mockReturnThis()
        }
      ];

      Media.find.mockResolvedValue(mockMediaFiles);

      // Execute
      await getAllMedia(req, res);

      // Assert
      expect(Media.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        media: expect.arrayContaining([
          expect.objectContaining({
            url: 'http://localhost:5000/uploads/test1.jpg'
          })
        ])
      });
    });

    it('should return 404 when no media files exist', async () => {
      // Setup
      Media.find.mockResolvedValue([]);

      // Execute
      await getAllMedia(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No media files found'
      });
    });
  });
});