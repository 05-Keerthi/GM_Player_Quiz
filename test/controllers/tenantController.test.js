const mongoose = require('mongoose');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const { sendInviteEmail } = require('../../services/mailService');

// Mock all dependencies
jest.mock('../../models/Tenant');
jest.mock('../../models/User');
jest.mock('../../services/mailService');

const {
  createTenant,
  registerTenantAdmin,
  updateTenantAdmin,
  getTenantAdmins,
  deleteTenantAdmin,
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
} = require('../../controllers/tenantController');

describe('Tenant Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {
        _id: 'user123',
        role: 'superadmin'
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000'),
      file: null
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

  describe('createTenant', () => {
    const mockTenantData = {
      name: 'Test Tenant',
      customDomain: 'test.domain.com',
    };

    it('should create a tenant successfully', async () => {
      // Setup
      req.body = mockTenantData;
      req.file = {
        filename: 'test-logo.png'
      };

      const mockTenant = {
        ...mockTenantData,
        _id: 'tenant123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      Tenant.findOne.mockResolvedValue(null);
      Tenant.mockImplementation(() => mockTenant);

      // Execute
      await createTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        name: mockTenantData.name
      }));
    });

    it('should return error if custom domain already exists', async () => {
      // Setup
      req.body = mockTenantData;
      Tenant.findOne.mockResolvedValue({ _id: 'existingTenant' });

      // Execute
      await createTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'customDomain'
          })
        ])
      });
    });
  });

  describe('registerTenantAdmin', () => {
    const mockAdminData = {
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'password123',
      mobile: '1234567890',
      role: 'tenant_admin'
    };

    it('should register tenant admin successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      req.body = mockAdminData;

      Tenant.findById.mockResolvedValue({ _id: 'tenant123', name: 'Test Tenant' });
      User.findOne.mockResolvedValue(null);

      const mockUser = {
        ...mockAdminData,
        _id: 'user123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.mockImplementation(() => mockUser);
      sendInviteEmail.mockResolvedValue(true);

      // Execute
      await registerTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin created successfully',
        user: expect.objectContaining({
          username: mockAdminData.username
        })
      });
    });

    it('should return error if tenant not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      req.body = mockAdminData;
      Tenant.findById.mockResolvedValue(null);

      // Execute
      await registerTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant not found'
      });
    });
  });

  describe('getTenantAdmins', () => {
    it('should get tenant admins successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      const mockAdmins = [
        { _id: 'admin1', username: 'admin1' },
        { _id: 'admin2', username: 'admin2' }
      ];

      User.find.mockResolvedValue(mockAdmins);

      // Execute
      await getTenantAdmins(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAdmins);
    });
  });

  describe('updateTenantAdmin', () => {
    it('should update tenant admin successfully', async () => {
      // Setup
      req.params = { id: 'tenant123', userId: 'user123' };
      req.body = { username: 'updatedadmin' };

      Tenant.findById.mockResolvedValue({ _id: 'tenant123' });
      User.findOne.mockResolvedValue({ _id: 'user123' });
      
      const mockUpdatedUser = {
        _id: 'user123',
        username: 'updatedadmin'
      };
      
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Execute
      await updateTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin updated successfully',
        user: mockUpdatedUser
      });
    });
  });

  describe('deleteTenantAdmin', () => {
    it('should delete tenant admin successfully', async () => {
      // Setup
      req.params = { id: 'tenant123', userId: 'user123' };
      
      Tenant.findById.mockResolvedValue({ _id: 'tenant123' });
      User.findOne.mockResolvedValue({ _id: 'user123' });
      User.findByIdAndDelete.mockResolvedValue({ _id: 'user123' });

      // Execute
      await deleteTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin deleted successfully'
      });
    });
  });

  describe('getAllTenants', () => {
    it('should get all tenants successfully', async () => {
      // Setup
      const mockTenants = [
        { _id: 'tenant1', name: 'Tenant 1' },
        { _id: 'tenant2', name: 'Tenant 2' }
      ];

      Tenant.find.mockResolvedValue(mockTenants);

      // Execute
      await getAllTenants(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTenants);
    });
  });

  describe('getTenantById', () => {
    it('should get tenant by id successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      const mockTenant = { _id: 'tenant123', name: 'Test Tenant' };

      Tenant.findById.mockResolvedValue(mockTenant);

      // Execute
      await getTenantById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTenant);
    });

    it('should return error if tenant not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Tenant.findById.mockResolvedValue(null);

      // Execute
      await getTenantById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant not found'
      });
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      req.body = { name: 'Updated Tenant' };
      const mockTenant = {
        _id: 'tenant123',
        name: 'Updated Tenant',
        customLogo: 'existing-logo.png'
      };

      Tenant.findById.mockResolvedValue(mockTenant);
      Tenant.findByIdAndUpdate.mockResolvedValue(mockTenant);

      // Execute
      await updateTenant(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(mockTenant);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      Tenant.findByIdAndDelete.mockResolvedValue({ _id: 'tenant123' });

      // Execute
      await deleteTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant deleted successfully'
      });
    });
  });
});