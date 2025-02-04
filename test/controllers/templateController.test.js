const mongoose = require('mongoose');
const Template = require('../../models/Template');

// Mock dependencies
jest.mock('../../models/Template');

const {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate
} = require('../../controllers/templateController');

describe('Template Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
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

  describe('createTemplate', () => {
    const mockTemplateData = {
      name: 'Test Template',
      options: [
        { optionText: 'Option 1', color: '#FF0000' },
        { optionText: 'Option 2', color: '#00FF00' }
      ]
    };

    it('should create a template successfully', async () => {
      // Setup
      req.body = mockTemplateData;
      Template.findOne.mockResolvedValue(null);
      
      const mockSavedTemplate = {
        ...mockTemplateData,
        _id: 'template123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      Template.mockImplementation(() => mockSavedTemplate);

      // Execute
      await createTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error if template name already exists', async () => {
      // Setup
      req.body = mockTemplateData;
      Template.findOne.mockResolvedValue({ _id: 'existing123', name: mockTemplateData.name });

      // Execute
      await createTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Template with this name already exists.'
      });
    });

    it('should return error if required fields are missing', async () => {
      // Setup
      req.body = { name: 'Test Template' }; // Missing options

      // Execute
      await createTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Name and options are required.'
      });
    });
  });

  describe('getAllTemplates', () => {
    it('should get all templates successfully', async () => {
      // Setup
      const mockTemplates = [
        {
          _id: 'template123',
          name: 'Template 1',
          options: [{ optionText: 'Option 1', color: '#FF0000' }]
        },
        {
          _id: 'template456',
          name: 'Template 2',
          options: [{ optionText: 'Option 2', color: '#00FF00' }]
        }
      ];

      Template.find.mockResolvedValue(mockTemplates);

      // Execute
      await getAllTemplates(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplates
      });
    });

    it('should handle errors when getting templates', async () => {
      // Setup
      Template.find.mockRejectedValue(new Error('Database error'));

      // Execute
      await getAllTemplates(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error retrieving templates',
        error: expect.any(Error)
      });
    });
  });

  describe('getTemplateById', () => {
    it('should get a single template successfully', async () => {
      // Setup
      req.params = { id: 'template123' };
      const mockTemplate = {
        _id: 'template123',
        name: 'Test Template',
        options: [{ optionText: 'Option 1', color: '#FF0000' }]
      };

      Template.findById.mockResolvedValue(mockTemplate);

      // Execute
      await getTemplateById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTemplate
      });
    });

    it('should return error if template not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Template.findById.mockResolvedValue(null);

      // Execute
      await getTemplateById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Template not found'
      });
    });
  });

  describe('updateTemplate', () => {
    const mockUpdateData = {
      name: 'Updated Template',
      options: [
        { optionText: 'Updated Option 1', color: '#0000FF' }
      ]
    };

    it('should update template successfully', async () => {
      // Setup
      req.params = { id: 'template123' };
      req.body = mockUpdateData;
      Template.findOne.mockResolvedValue(null);
      
      const mockUpdatedTemplate = {
        _id: 'template123',
        ...mockUpdateData
      };

      Template.findByIdAndUpdate.mockResolvedValue(mockUpdatedTemplate);

      // Execute
      await updateTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template updated successfully',
        data: mockUpdatedTemplate
      });
    });

    it('should return error if template name already exists', async () => {
      // Setup
      req.params = { id: 'template123' };
      req.body = mockUpdateData;
      Template.findOne.mockResolvedValue({ 
        _id: 'different123', 
        name: mockUpdateData.name 
      });

      // Execute
      await updateTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Template with this name already exists.'
      });
    });

    it('should return error if options are empty', async () => {
      // Setup
      req.params = { id: 'template123' };
      req.body = { name: 'Test', options: [] };

      // Execute
      await updateTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Options are required to update the template.'
      });
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template successfully', async () => {
      // Setup
      req.params = { id: 'template123' };
      Template.findByIdAndDelete.mockResolvedValue({ _id: 'template123' });

      // Execute
      await deleteTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Template deleted successfully'
      });
    });

    it('should return error if template not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Template.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteTemplate(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Template not found'
      });
    });
  });
});