const request = require('supertest');
const express = require('express');
const router = require('../../routes/tenantRoutes');
const tenantController = require('../../controllers/tenantController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isSuperAdmin: jest.fn((req, res, next) => next()),
  isTenantAdmin: jest.fn((req, res, next) => next()),
  isSuperAdminOrTenantAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the multer upload middleware
jest.mock('../../config/logoConfig', () => ({
  uploadLogo: {
    single: jest.fn(() => (req, res, next) => next()),
  },
}));

// Mock the tenantController functions
jest.mock('../../controllers/tenantController', () => ({
  createTenant: jest.fn((req, res) => res.status(201).json({ message: 'Tenant created successfully' })),
  getAllTenants: jest.fn((req, res) => res.status(200).json({ message: 'Tenants retrieved successfully' })),
  getTenantById: jest.fn((req, res) => res.status(200).json({ message: 'Tenant retrieved successfully' })),
  updateTenant: jest.fn((req, res) => res.status(200).json({ message: 'Tenant updated successfully' })),
  deleteTenant: jest.fn((req, res) => res.status(200).json({ message: 'Tenant deleted successfully' })),
  registerTenantAdmin: jest.fn((req, res) => res.status(201).json({ message: 'Tenant admin registered successfully' })),
  updateTenantAdmin: jest.fn((req, res) => res.status(200).json({ message: 'Tenant admin updated successfully' })),
  getTenantAdmins: jest.fn((req, res) => res.status(200).json({ message: 'Tenant admins retrieved successfully' })),
  deleteTenantAdmin: jest.fn((req, res) => res.status(200).json({ message: 'Tenant admin deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isSuperAdmin, isTenantAdmin, isSuperAdminOrTenantAdmin } = require('../../middlewares/auth');
const { uploadLogo } = require('../../config/logoConfig');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Tenant Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test POST /api/tenants
  it('should call createTenant when a valid POST request is made to /api/tenants', async () => {
    const res = await request(app)
      .post('/api/tenants')
      .attach('customLogo', Buffer.from('dummy image'), 'logo.png');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdmin).toHaveBeenCalledTimes(1);
    expect(uploadLogo.single).toHaveBeenCalledWith('customLogo');
    expect(tenantController.createTenant).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Tenant created successfully');
  });

  // Test GET /api/tenants
  it('should call getAllTenants when a valid GET request is made to /api/tenants', async () => {
    const res = await request(app).get('/api/tenants');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.getAllTenants).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenants retrieved successfully');
  });

  // Test GET /api/tenants/:id
  it('should call getTenantById when a valid GET request is made to /api/tenants/:id', async () => {
    const tenantId = '123';
    const res = await request(app).get(`/api/tenants/${tenantId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.getTenantById).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant retrieved successfully');
  });

  // Test PUT /api/tenants/:id
  it('should call updateTenant when a valid PUT request is made to /api/tenants/:id', async () => {
    const tenantId = '123';
    const res = await request(app)
      .put(`/api/tenants/${tenantId}`)
      .attach('customLogo', Buffer.from('dummy image'), 'logo.png');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.updateTenant).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant updated successfully');
  });

  // Test DELETE /api/tenants/:id
  it('should call deleteTenant when a valid DELETE request is made to /api/tenants/:id', async () => {
    const tenantId = '123';
    const res = await request(app).delete(`/api/tenants/${tenantId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.deleteTenant).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant deleted successfully');
  });

  // Test POST /api/registerTenantAdmin/:id
  it('should call registerTenantAdmin when a valid POST request is made to /api/registerTenantAdmin/:id', async () => {
    const tenantId = '123';
    const res = await request(app).post(`/api/registerTenantAdmin/${tenantId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.registerTenantAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Tenant admin registered successfully');
  });

  // Test PUT /api/updateTenantAdmin/:id/:userId
  it('should call updateTenantAdmin when a valid PUT request is made to /api/updateTenantAdmin/:id/:userId', async () => {
    const tenantId = '123';
    const userId = '456';
    const res = await request(app).put(`/api/updateTenantAdmin/${tenantId}/${userId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.updateTenantAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant admin updated successfully');
  });

  // Test GET /api/tenant-admins/:id
  it('should call getTenantAdmins when a valid GET request is made to /api/tenant-admins/:id', async () => {
    const tenantId = '123';
    const res = await request(app).get(`/api/tenant-admins/${tenantId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.getTenantAdmins).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant admins retrieved successfully');
  });

  // Test DELETE /api/tenant-admins/:id/:userId
  it('should call deleteTenantAdmin when a valid DELETE request is made to /api/tenant-admins/:id/:userId', async () => {
    const tenantId = '123';
    const userId = '456';
    const res = await request(app).delete(`/api/tenant-admins/${tenantId}/${userId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isSuperAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(tenantController.deleteTenantAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Tenant admin deleted successfully');
  });
});