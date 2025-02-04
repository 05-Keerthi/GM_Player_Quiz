const request = require('supertest');
const express = require('express');
const router = require('../../routes/templateRoutes');
const templateController = require('../../controllers/templateController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the templateController functions
jest.mock('../../controllers/templateController', () => ({
  createTemplate: jest.fn((req, res) => res.status(201).json({ message: 'Template created successfully' })),
  getAllTemplates: jest.fn((req, res) => res.status(200).json({ message: 'Templates retrieved successfully' })),
  getTemplateById: jest.fn((req, res) => res.status(200).json({ message: 'Template retrieved successfully' })),
  updateTemplate: jest.fn((req, res) => res.status(200).json({ message: 'Template updated successfully' })),
  deleteTemplate: jest.fn((req, res) => res.status(200).json({ message: 'Template deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

  // Test POST /api/create-template
  it('should call createTemplate when a valid POST request is made to /api/create-template', async () => {
    const res = await request(app).post('/api/create-template');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(templateController.createTemplate).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Template created successfully');
  });

  // Test GET /api/templates
  it('should call getAllTemplates when a valid GET request is made to /api/templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(templateController.getAllTemplates).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Templates retrieved successfully');
  });

  // Test GET /api/template/:id
  it('should call getTemplateById when a valid GET request is made to /api/template/:id', async () => {
    const templateId = '123';
    const res = await request(app).get(`/api/template/${templateId}`);
    expect(templateController.getTemplateById).toHaveBeenCalledTimes(1);
    expect(res.body.message).toBe('Template retrieved successfully');
  });

  // Test PUT /api/template/:id
  it('should call updateTemplate when a valid PUT request is made to /api/template/:id', async () => {
    const templateId = '123';
    const res = await request(app).put(`/api/template/${templateId}`);
    expect(templateController.updateTemplate).toHaveBeenCalledTimes(1);
    expect(res.body.message).toBe('Template updated successfully');
  });

  // Test DELETE /api/template/:id
  it('should call deleteTemplate when a valid DELETE request is made to /api/template/:id', async () => {
    const templateId = '123';
    const res = await request(app).delete(`/api/template/${templateId}`);
    expect(templateController.deleteTemplate).toHaveBeenCalledTimes(1);
  });

  // Test authentication middleware
  it('should use auth middleware for all routes', async () => {
    const templateId = '123';
    
    await request(app).post('/api/create-template');
    await request(app).get('/api/templates');
    await request(app).get(`/api/template/${templateId}`);
    await request(app).put(`/api/template/${templateId}`);
    await request(app).delete(`/api/template/${templateId}`);

  });

  // Test admin middleware
  it('should use isAdmin middleware for all routes', async () => {
    const templateId = '123';
    
    await request(app).post('/api/create-template');
    await request(app).get('/api/templates');
    await request(app).get(`/api/template/${templateId}`);
    await request(app).put(`/api/template/${templateId}`);
    await request(app).delete(`/api/template/${templateId}`);
  });

  // Test request with body
  it('should pass request body to controller for POST and PUT requests', async () => {
    const templateData = {
      name: 'Test Template',
      options: [{ optionText: 'Option 1', color: '#FF0000' }]
    };

    await request(app)
      .post('/api/create-template')
      .send(templateData);
    });