const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Media = require('../../models/Media');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Media Model Unit Tests', () => {
  afterEach(async () => {
    await Media.deleteMany({});
  });

  test('should create a Media entry with valid data', async () => {
    const mediaData = {
      filename: 'test-image.jpg',
      path: '/uploads/test-image.jpg',
      mimetype: 'image/jpeg'
    };

    const media = await Media.create(mediaData);

    expect(media._id).toBeDefined();
    expect(media.filename).toBe(mediaData.filename);
    expect(media.path).toBe(mediaData.path);
    expect(media.mimetype).toBe(mediaData.mimetype);
    expect(media.createdAt).toBeDefined();
  });

  test('should require all required fields', async () => {
    const mediaData = {
      filename: 'test-image.jpg',
      // missing path and mimetype
    };

    await expect(Media.create(mediaData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set createdAt automatically', async () => {
    const mediaData = {
      filename: 'test-document.pdf',
      path: '/uploads/test-document.pdf',
      mimetype: 'application/pdf'
    };

    const media = await Media.create(mediaData);

    expect(media.createdAt).toBeDefined();
    expect(media.createdAt).toBeInstanceOf(Date);
  });

  test('should successfully update media metadata', async () => {
    const mediaData = {
      filename: 'old-name.jpg',
      path: '/uploads/old-name.jpg',
      mimetype: 'image/jpeg'
    };

    const media = await Media.create(mediaData);
    
    const updatedFilename = 'new-name.jpg';
    const updatedPath = '/uploads/new-name.jpg';
    
    media.filename = updatedFilename;
    media.path = updatedPath;
    await media.save();

    const updatedMedia = await Media.findById(media._id);
    expect(updatedMedia.filename).toBe(updatedFilename);
    expect(updatedMedia.path).toBe(updatedPath);
  });

  test('should handle different mimetypes correctly', async () => {
    const mediaTypes = [
      {
        filename: 'image.jpg',
        path: '/uploads/image.jpg',
        mimetype: 'image/jpeg'
      },
      {
        filename: 'document.pdf',
        path: '/uploads/document.pdf',
        mimetype: 'application/pdf'
      },
      {
        filename: 'video.mp4',
        path: '/uploads/video.mp4',
        mimetype: 'video/mp4'
      }
    ];

    for (const mediaData of mediaTypes) {
      const media = await Media.create(mediaData);
      expect(media.mimetype).toBe(mediaData.mimetype);
    }
  });

  test('should find media by filename', async () => {
    const mediaData = {
      filename: 'searchable-image.jpg',
      path: '/uploads/searchable-image.jpg',
      mimetype: 'image/jpeg'
    };

    await Media.create(mediaData);

    const foundMedia = await Media.findOne({ filename: mediaData.filename });
    expect(foundMedia).toBeDefined();
    expect(foundMedia.filename).toBe(mediaData.filename);
  });

  test('should delete media entry', async () => {
    const mediaData = {
      filename: 'to-be-deleted.jpg',
      path: '/uploads/to-be-deleted.jpg',
      mimetype: 'image/jpeg'
    };

    const media = await Media.create(mediaData);
    const mediaId = media._id;

    await Media.findByIdAndDelete(mediaId);
    const deletedMedia = await Media.findById(mediaId);
    expect(deletedMedia).toBeNull();
  });
});