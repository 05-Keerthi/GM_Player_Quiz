const mongoose = require('mongoose');
const Tenant = require('../../models/Tenant');
const User = require('../../models/User');
const { sendInviteEmail } = require('../../services/mailService');

// Mock the dependencies
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
  deleteTenant
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
      }
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
      customDomain: 'test.example.com'
    };

    it('should create a tenant successfully', async () => {
      // Setup
      req.body = mockTenantData;
      
      const mockNewTenant = {
        _id: 'tenant123',
        ...mockTenantData,
        save: jest.fn().mockResolvedValue(undefined)
      };

      Tenant.findOne.mockResolvedValue(null);
      Tenant.mockImplementation(() => mockNewTenant);

      // Execute
      await createTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNewTenant);
      expect(mockNewTenant.save).toHaveBeenCalled();
    });

    it('should return error if custom domain already exists', async () => {
      // Setup
      req.body = mockTenantData;
      Tenant.findOne.mockResolvedValue({ _id: 'existing123', customDomain: 'test.example.com' });

      // Execute
      await createTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        errors: [{ field: 'customDomain', message: 'Custom domain already exists' }]
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

      const mockTenant = {
        _id: 'tenant123',
        name: 'Test Tenant'
      };

      const mockNewAdmin = {
        _id: 'user123',
        ...mockAdminData,
        tenantId: 'tenant123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      Tenant.findById.mockResolvedValue(mockTenant);
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockNewAdmin);

      // Execute
      await registerTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin created successfully',
        user: mockNewAdmin
      });
      expect(sendInviteEmail).toHaveBeenCalled();
    });

    it('should return error if not super admin', async () => {
      // Setup
      req.user.role = 'tenant_admin';
      req.params = { id: 'tenant123' };
      req.body = mockAdminData;

      // Execute
      await registerTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only super admin can create a tenant admin'
      });
    });
  });

  describe('updateTenantAdmin', () => {
    const mockUpdateData = {
      username: 'updatedadmin',
      email: 'updated@test.com'
    };

    it('should update tenant admin successfully', async () => {
      // Setup
      req.params = { id: 'tenant123', userId: 'user123' };
      req.body = mockUpdateData;

      const mockTenant = { _id: 'tenant123' };
      const mockUser = {
        _id: 'user123',
        tenantId: 'tenant123',
        ...mockUpdateData
      };

      Tenant.findById.mockResolvedValue(mockTenant);
      User.findOne.mockResolvedValue(mockUser);
      User.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Execute
      await updateTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin updated successfully',
        user: mockUser
      });
    });
  });

  describe('getTenantAdmins', () => {
    it('should get tenant admins successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      const mockAdmins = [
        { _id: 'user1', username: 'admin1', role: 'tenant_admin' },
        { _id: 'user2', username: 'admin2', role: 'tenant_admin' }
      ];

      User.find.mockResolvedValue(mockAdmins);

      // Execute
      await getTenantAdmins(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAdmins);
    });

    it('should deny access for non-authorized tenant admin', async () => {
      // Setup
      req.user = { role: 'tenant_admin', tenantId: 'different123' };
      req.params = { id: 'tenant123' };

      // Execute
      await getTenantAdmins(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. You can only view your own tenant users.'
      });
    });
  });

  describe('deleteTenantAdmin', () => {
    it('should delete tenant admin successfully', async () => {
      // Setup
      req.params = { id: 'tenant123', userId: 'user123' };
      
      Tenant.findById.mockResolvedValue({ _id: 'tenant123' });
      User.findOne.mockResolvedValue({ 
        _id: 'differentUser123',
        tenantId: 'tenant123'
      });
      User.findByIdAndDelete.mockResolvedValue(true);

      // Execute
      await deleteTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin deleted successfully'
      });
    });

    it('should prevent tenant admin from deleting themselves', async () => {
      // Setup
      req.user = { 
        _id: 'user123',
        role: 'tenant_admin'
      };
      req.params = { id: 'tenant123', userId: 'user123' };
      
      Tenant.findById.mockResolvedValue({ _id: 'tenant123' });
      User.findOne.mockResolvedValue({ 
        _id: 'user123',
        tenantId: 'tenant123'
      });

      // Execute
      await deleteTenantAdmin(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant admin cannot delete themselves'
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
      
      const mockUpdatedTenant = {
        _id: 'tenant123',
        name: 'Updated Tenant'
      };

      Tenant.findByIdAndUpdate.mockResolvedValue(mockUpdatedTenant);

      // Execute
      await updateTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedTenant);
    });

    it('should validate custom domain uniqueness on update', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      req.body = { customDomain: 'existing.example.com' };
      
      Tenant.findOne.mockResolvedValue({ 
        _id: 'different123',
        customDomain: 'existing.example.com'
      });

      // Execute
      await updateTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation Error',
        errors: [{ field: 'customDomain', message: 'Custom domain already exists' }]
      });
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      // Setup
      req.params = { id: 'tenant123' };
      Tenant.findByIdAndDelete.mockResolvedValue({
        _id: 'tenant123',
        name: 'Test Tenant'
      });

      // Execute
      await deleteTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant deleted successfully'
      });
    });

    it('should return error if tenant not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Tenant.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteTenant(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tenant not found'
      });
    });
  });
});