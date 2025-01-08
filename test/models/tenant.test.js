const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Tenant = require('../../models/Tenant'); 

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Tenant.deleteMany({});
});

describe('Tenant Model Test Suite', () => {
  describe('Validation Tests', () => {
    test('should validate a valid tenant', async () => {
      const validTenant = {
        name: 'Test Company',
        logo: 'https://example.com/logo.png',
        customDomain: 'test-company.com',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        fontFamily: 'Roboto',
        favicon: 'https://example.com/favicon.ico'
      };

      const tenant = new Tenant(validTenant);
      const savedTenant = await tenant.save();
      
      expect(savedTenant._id).toBeDefined();
      expect(savedTenant.name).toBe(validTenant.name);
      expect(savedTenant.theme).toBe('light'); 
      expect(savedTenant.createdAt).toBeDefined();
    });

    test('should fail validation when name is missing', async () => {
      const tenantWithoutName = new Tenant({
        customDomain: 'test-domain.com'
      });

      let err;
      try {
        await tenantWithoutName.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.name).toBeDefined();
    });

    test('should enforce unique custom domain', async () => {
      const domain = 'same-domain.com';
      
      const firstTenant = new Tenant({
        name: 'First Company',
        customDomain: domain
      });
      await firstTenant.save();

      const secondTenant = new Tenant({
        name: 'Second Company',
        customDomain: domain
      });

      let err;
      try {
        await secondTenant.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });
  });

  describe('Default Value Tests', () => {
    test('should set default values when not provided', async () => {
      const tenant = new Tenant({
        name: 'Default Test Company'
      });

      const savedTenant = await tenant.save();
      
      expect(savedTenant.theme).toBe('light');
      expect(savedTenant.primaryColor).toBe('#000000');
      expect(savedTenant.secondaryColor).toBe('#FFFFFF');
      expect(savedTenant.fontFamily).toBe('Arial');
      expect(savedTenant.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Update Tests', () => {
    test('should correctly update tenant properties', async () => {
      const tenant = await Tenant.create({
        name: 'Update Test Company',
        customDomain: 'update-test.com'
      });

      const updatedData = {
        name: 'Updated Company Name',
        theme: 'dark',
        primaryColor: '#111111'
      };

      await Tenant.findByIdAndUpdate(tenant._id, updatedData);
      const updatedTenant = await Tenant.findById(tenant._id);
      
      expect(updatedTenant.name).toBe(updatedData.name);
      expect(updatedTenant.theme).toBe(updatedData.theme);
      expect(updatedTenant.primaryColor).toBe(updatedData.primaryColor);
      expect(updatedTenant.customDomain).toBe('update-test.com');
    });
  });
});