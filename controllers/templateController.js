const mongoose = require("mongoose");
const Template = require('../models/Template');

// CREATE: Create a new template
const createTemplate = async (req, res) => {
  const { name, options } = req.body;

  if (!name || !options || options.length === 0) {
    return res.status(400).json({ message: "Name and options are required." });
  }

  try {
    // Check if template already exists
    const existingTemplate = await Template.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({ message: "Template with this name already exists." });
    }

    // Create new template
    const newTemplate = new Template({
      name,
      options,
    });

    const savedTemplate = await newTemplate.save();
    res.status(201).json({
      success: true,
      message: "Template created successfully",
      data: savedTemplate,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating template", error });
  }
};

// READ: Get all templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving templates", error });
  }
};

// READ: Get a specific template by name
const getTemplateById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const template = await Template.findById(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
  
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      res.status(500).json({ message: "Error retrieving template", error });
    }
  };
  
  // UPDATE: Update a template by id
  const updateTemplate = async (req, res) => {
    const { id } = req.params;
    const { name, options } = req.body;
  
    // Validate the presence of options and name
    if (!options || options.length === 0) {
      return res.status(400).json({ message: "Options are required to update the template." });
    }
  
    // If name is provided, check if the new name already exists in the database
    if (name) {
      const existingTemplate = await Template.findOne({ name });
      if (existingTemplate && existingTemplate._id.toString() !== id) {
        return res.status(400).json({ message: "Template with this name already exists." });
      }
    }
  
    try {
      // Update the template with new name and/or options
      const updatedTemplate = await Template.findByIdAndUpdate(
        id,
        { name, options, updatedAt: Date.now() },
        { new: true }
      );
  
      // If the template is not found, return an error
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
  
      // Successfully updated the template
      res.status(200).json({
        success: true,
        message: "Template updated successfully",
        data: updatedTemplate,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating template", error });
    }
  };  
  
  // DELETE: Delete a template by id
  const deleteTemplate = async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedTemplate = await Template.findByIdAndDelete(id);
  
      if (!deletedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting template", error });
    }
};

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
