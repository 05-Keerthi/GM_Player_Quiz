const express = require('express');
const router = express.Router();
const { createTenant, getAllTenants, getTenantById, updateTenant, deleteTenant,registerTenantAdmin } = require('../controllers/tenantController');
const { auth, isSuperAdmin } = require('../middlewares/auth');

router.post('/tenants', auth, isSuperAdmin, createTenant);         
router.get('/tenants', auth, isSuperAdmin, getAllTenants);         
router.get('/tenants/:id', auth, isSuperAdmin, getTenantById);     
router.put('/tenants/:id', auth, isSuperAdmin, updateTenant);      
router.delete('/tenants/:id', auth, isSuperAdmin, deleteTenant);
router.post('/registerTenantAdmin/:id', auth, isSuperAdmin, registerTenantAdmin);   

module.exports = router;
