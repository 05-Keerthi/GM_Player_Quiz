const multer = require('multer');
const path = require('path');
const upload = require('../../config/multerConfig'); 

describe('Multer Configuration', () => {
  describe('Storage Configuration', () => {
    let storage;

    beforeEach(() => {
      // Extract storage from the multer configuration
      storage = upload.storage;
    });

    it('should set the correct destination', () => {
      const cb = jest.fn();
      storage.getDestination({}, {}, cb); // Use the internal `getDestination` method
      expect(cb).toHaveBeenCalledWith(null, 'uploads/');
    });

    it('should generate a unique filename', () => {
      const cb = jest.fn();
      const mockFile = { originalname: 'test.jpg' };

      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      storage.getFilename({}, mockFile, cb); // Use the internal `getFilename` method

      expect(cb).toHaveBeenCalledWith(
        null,
        expect.stringMatching(/^1234567890-\d+-test\.jpg$/)
      );

      jest.restoreAllMocks(); // Restore mocks
    });
  });

  describe('File Filter', () => {
    let fileFilter;

    beforeEach(() => {
      // Extract file filter from the multer configuration
      fileFilter = upload.fileFilter;
    });

    const mockCallback = jest.fn();

    it.each([
      ['image/jpeg', 'test.jpg'],
      ['image/png', 'test.png'],
      ['image/gif', 'test.gif'],
      ['video/mp4', 'test.mp4'],
      ['application/pdf', 'test.pdf'],
      ['application/msword', 'test.doc'],
      ['audio/mp3', 'test.mp3'],
      ['audio/wav', 'test.wav'],
      ['image/webp', 'test.webp'],
      ['text/csv', 'test.csv'],
      ['image/svg+xml', 'test.svg'],
    ])('should accept valid file type: %s with extension %s', (mimetype, originalname) => {
      const mockFile = { mimetype, originalname };
      fileFilter({}, mockFile, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null, true);
    });

    it.each([
      ['application/exe', 'test.exe'],
      ['text/html', 'test.html'],
      ['application/javascript', 'test.js'],
      ['invalid/type', 'test.xyz'],
    ])('should reject invalid file type: %s with extension %s', (mimetype, originalname) => {
      const mockFile = { mimetype, originalname };
      fileFilter({}, mockFile, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith('Error: File type mot allowed!');
    });

    it('should reject file with mismatched extension and mimetype', () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        originalname: 'test.pdf', // mismatched extension
      };
      fileFilter({}, mockFile, mockCallback);
      expect(mockCallback).toHaveBeenCalledWith('Error: File type mot allowed!');
    });
  });

  describe('Size Limits', () => {
    it('should set the correct file size limit', () => {
      expect(upload.limits.fileSize).toBe(100000000); // Check for 10MB limit
    });
  });
});
