const express = require('express');
const router = express.Router();
const { createTenant, getAllTenants, getTenantById, updateTenant, deleteTenant,registerTenantAdmin, updateTenantAdmin, getTenantAdmins, deleteTenantAdmin } = require('../controllers/tenantController');
const { auth, isSuperAdmin,isTenantAdmin,isSuperAdminOrTenantAdmin } = require('../middlewares/auth');
const { uploadLogo } = require('../config/logoConfig');

router.post('/tenants', uploadLogo.single('customLogo'), auth, isSuperAdmin, createTenant);         
router.get('/tenants', auth, isSuperAdmin, getAllTenants);         
router.get('/tenants/:id', auth, isSuperAdminOrTenantAdmin, getTenantById);     
router.put('/tenants/:id', uploadLogo.single('customLogo'), auth, isSuperAdminOrTenantAdmin, updateTenant);      
router.delete('/tenants/:id', auth, isSuperAdmin, deleteTenant);
router.post('/registerTenantAdmin/:id', auth, isSuperAdmin, registerTenantAdmin);   
router.put('/updateTenantAdmin/:id/:userId', auth,isSuperAdminOrTenantAdmin, updateTenantAdmin);
router.get('/tenant-admins/:id', auth,isSuperAdminOrTenantAdmin, getTenantAdmins);
router.delete('/tenant-admins/:id/:userId', auth, isSuperAdminOrTenantAdmin, deleteTenantAdmin);

module.exports = router;
