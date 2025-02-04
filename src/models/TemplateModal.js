import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTemplateContext } from "../context/TemplateContext";
import ColorPicker from "../components/ColorPicker";

const TemplateModal = ({ isOpen, onClose, onTemplateSelect }) => {
  const { templates, createTemplate, updateTemplate, deleteTemplate, error } =
    useTemplateContext();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    options: [{ optionText: "", color: "#FFFFFF" }],
  });
  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      name: "",
      options: [{ optionText: "", color: "#FFFFFF" }],
    });
    setEditingTemplate(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }

    const validOptions = formData.options.filter((opt) =>
      opt.optionText.trim()
    );
    if (validOptions.length < 2) {
      newErrors.options = "At least two valid options are required";
    }

    formData.options.forEach((option, index) => {
      if (!option.optionText.trim()) {
        newErrors[`option${index}`] = "Option text is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate._id, formData);
      } else {
        await createTemplate(formData);
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save template:", err);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      options: template.options,
    });
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(id);
      } catch (err) {
        console.error("Failed to delete template:", err);
      }
    }
  };

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { optionText: "", color: "#FFFFFF" }],
    }));
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length > 1) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = formData.options.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    );
    setFormData((prev) => ({
      ...prev,
      options: updatedOptions,
    }));
    setErrors((prev) => ({ ...prev, [`option${index}`]: "", options: "" }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
      >
        {/* Header - More compact on mobile */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h2 className="text-lg sm:text-xl font-semibold">
            {editingTemplate ? "Edit Template" : "Create New Template"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-6">
          {/* Form */}
          <div className="space-y-3 sm:space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter template name"
              />
              {errors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Options */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options<span className="text-red-500">*</span>
                </label>
                <button
                  onClick={handleAddOption}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Add Option
                </button>
              </div>
              {errors.options && (
                <p className="mb-2 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  {errors.options}
                </p>
              )}
              <AnimatePresence>
                {formData.options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 sm:gap-3 mb-3"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.optionText}
                        onChange={(e) =>
                          handleOptionChange(
                            index,
                            "optionText",
                            e.target.value
                          )
                        }
                        className={`w-full p-2 sm:p-3 border rounded-lg text-sm sm:text-base ${
                          errors[`option${index}`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        placeholder={`Option ${index + 1}`}
                        style={{ backgroundColor: option.color }}
                      />
                      {errors[`option${index}`] && (
                        <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          {errors[`option${index}`]}
                        </p>
                      )}
                    </div>
                    <ColorPicker
                      color={option.color}
                      onChange={(color) =>
                        handleOptionChange(index, "color", color)
                      }
                    />
                    {formData.options.length > 1 && (
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className="p-1 sm:p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="border-t mt-4 p-3 sm:p-4 flex justify-end gap-2 sm:gap-3">
            <button
              onClick={handleClose}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 sm:gap-2"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              {editingTemplate ? "Update Template" : "Create Template"}
            </button>
          </div>
        </div>

        {/* Template List */}
        <div>
          <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-16rem)] sm:max-h-[calc(90vh-8rem)]">
            {!editingTemplate && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
                  Existing Templates
                </h3>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template._id}
                      className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <button
                        onClick={() => {
                          onTemplateSelect(template);
                          onClose();
                        }}
                        className="flex-1 text-left text-sm sm:text-base font-medium hover:text-blue-600"
                      >
                        {template.name}
                      </button>
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template._id)}
                          className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TemplateModal;
