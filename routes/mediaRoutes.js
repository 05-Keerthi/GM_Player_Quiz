const express = require('express');
const router = express.Router();
const upload = require('../config/multerConfig');
const mediaController = require('../controllers/mediaController');
const { auth, isAdmin } = require('../middlewares/auth');

// POST /api/media/upload
router.post('/media/upload', upload.array('media'), auth, isAdmin, mediaController.uploadMedia);

// DELETE /api/media/all - Delete all media files
router.delete('/media/all',  auth, isAdmin, mediaController.deleteAllMedia);

// GET /api/media/:id
router.get('/media/:id', auth, isAdmin, mediaController.getMediaDetails);

// DELETE /api/media/:id
router.delete('/media/:id', auth, isAdmin, mediaController.deleteMedia);

// GET /api/media
router.get('/media/',  auth, isAdmin, mediaController.getAllMedia);


module.exports = router;
