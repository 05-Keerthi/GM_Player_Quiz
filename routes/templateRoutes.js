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

// POST: Create a new template
router.post('/create-template',  auth,isAdmin, createTemplate);

// GET: Get all templates
router.get('/templates',  auth,isAdmin, getAllTemplates);

// GET: Get a template by name
router.get('/template/:id',  auth,isAdmin, getTemplateById);

// PUT: Update a template by name
router.put('/template/:id', auth,isAdmin, updateTemplate);

// DELETE: Delete a template by name
router.delete('/template/:id', auth,isAdmin, deleteTemplate);

module.exports = router;
