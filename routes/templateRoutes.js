const express = require('express');
const router = express.Router();
const {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/templateController');
const { auth,isAdmin } = require('../middlewares/auth');

router.post('/create-template',  auth,isAdmin, createTemplate);

router.get('/templates',  auth,isAdmin, getAllTemplates);

router.get('/template/:id',  auth,isAdmin, getTemplateById);

router.put('/template/:id', auth,isAdmin, updateTemplate);

router.delete('/template/:id', auth,isAdmin, deleteTemplate);

module.exports = router;
