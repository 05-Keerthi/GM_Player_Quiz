const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Template = require('../../models/template');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Template Model Unit Tests', () => {
  afterEach(async () => {
    await Template.deleteMany({});
  });

  test('should create a Template with valid data', async () => {
    const templateData = {
      name: 'Feedback Template',
      options: [
        { optionText: 'Excellent', color: '#00FF00' },
        { optionText: 'Good', color: '#FFFF00' },
        { optionText: 'Poor', color: '#FF0000' }
      ]
    };

    const template = await Template.create(templateData);

    expect(template._id).toBeDefined();
    expect(template.name).toBe(templateData.name);
    expect(template.options).toHaveLength(3);
    expect(template.options[0].optionText).toBe(templateData.options[0].optionText);
    expect(template.options[0].color).toBe(templateData.options[0].color);
    expect(template.createdAt).toBeDefined();
    expect(template.updatedAt).toBeDefined();
  });

  test('should fail without required name field', async () => {
    const templateData = {
      options: [
        { optionText: 'Option 1' }
      ]
    };

    await expect(Template.create(templateData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should enforce unique name constraint', async () => {
    const templateName = 'Unique Template';
    
    await Template.create({
      name: templateName,
      options: [{ optionText: 'Option 1' }]
    });

    const duplicateTemplate = {
      name: templateName,
      options: [{ optionText: 'Option 2' }]
    };

    await expect(Template.create(duplicateTemplate)).rejects.toThrow(mongoose.Error.MongoServerError);
  });

  test('should fail when option text is missing', async () => {
    const templateData = {
      name: 'Invalid Template',
      options: [
        { color: '#FF0000' }
      ]
    };

    await expect(Template.create(templateData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set default color when not provided', async () => {
    const templateData = {
      name: 'Default Color Template',
      options: [
        { optionText: 'Option without color' }
      ]
    };

    const template = await Template.create(templateData);
    expect(template.options[0].color).toBe('#FFFFFF');
  });

  test('should update template properties', async () => {
    const template = await Template.create({
      name: 'Original Template',
      options: [{ optionText: 'Original Option', color: '#000000' }]
    });
    
    const updatedName = 'Updated Template';
    const updatedOption = { optionText: 'Updated Option', color: '#111111' };
    
    template.name = updatedName;
    template.options[0] = updatedOption;
    await template.save();

    const updatedTemplate = await Template.findById(template._id);
    expect(updatedTemplate.name).toBe(updatedName);
    expect(updatedTemplate.options[0].optionText).toBe(updatedOption.optionText);
    expect(updatedTemplate.options[0].color).toBe(updatedOption.color);
  });

  test('should handle adding and removing options', async () => {
    const template = await Template.create({
      name: 'Dynamic Options Template',
      options: [{ optionText: 'Initial Option', color: '#000000' }]
    });

    template.options.push({ optionText: 'New Option', color: '#111111' });
    await template.save();
    expect(template.options).toHaveLength(2);

    template.options.pull(template.options[0]);
    await template.save();
    expect(template.options).toHaveLength(1);
  });

  test('should handle empty options array', async () => {
    const templateData = {
      name: 'Empty Options Template',
      options: []
    };

    const template = await Template.create(templateData);
    expect(template.options).toHaveLength(0);
  });

  test('should update timestamps on modification', async () => {
    const template = await Template.create({
      name: 'Timestamp Test Template',
      options: [{ optionText: 'Option 1' }]
    });

    const originalUpdatedAt = template.updatedAt;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    template.name = 'Modified Template';
    await template.save();

    expect(template.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});