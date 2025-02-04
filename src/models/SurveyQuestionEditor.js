import React, { useState, useEffect } from "react";
import { X, Trash2, Upload, AlertCircle, Loader, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ColorPicker from "../components/ColorPicker";
import { useTemplateContext } from "../context/TemplateContext";
import TemplateModal from "./TemplateModal";

const processQuestionData = (data = {}) => ({
  title: data.title || "",
  description: data.description || "",
  dimension: data.dimension || "",
  year: data.year || "",
  imageUrl: data.imageUrl || null,
  timer: data.timer || 30,
  templateId: data.templateId || "",
  answerOptions:
    Array.isArray(data.answerOptions) && data.answerOptions.length > 0
      ? data.answerOptions
      : [{ optionText: "", color: "#FFFFFF" }],
});

const SurveyQuestionEditor = ({ question, onUpdate, onClose, surveyType }) => {
  const {
    templates,
    getAllTemplates,
    loading: templatesLoading,
  } = useTemplateContext();

  // Initial state setup
  const [formData, setFormData] = useState(() => processQuestionData(question));
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(question?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    question?.templateId || ""
  );

  // Generate years array for the year picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 51 }, (_, i) => currentYear - i).sort(
    (a, b) => b - a
  );

  // Fetch templates on component mount
  useEffect(() => {
    getAllTemplates();
  }, []);

  // Reset form when question changes
  useEffect(() => {
    if (question) {
      const processedData = processQuestionData(question);
      setFormData(processedData);
      setImagePreview(question.imageUrl);
      setSelectedTemplateId(question.templateId || "");
    } else {
      setFormData({
        title: "",
        description: "",
        dimension: "",
        year: "",
        imageUrl: null,
        timer: 30,
        templateId: "",
        answerOptions: [{ optionText: "", color: "#FFFFFF" }],
      });
      setImagePreview(null);
      setSelectedTemplateId("");
      setErrors({});
    }
  }, [question]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Question title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Question description is required";
    }

    const validOptions = formData.answerOptions.filter((opt) =>
      opt.optionText.trim()
    );
    if (validOptions.length < 2) {
      newErrors.options = "At least two valid answer options are required";
    }

    formData.answerOptions.forEach((option, index) => {
      if (!option.optionText.trim()) {
        newErrors[`option${index}`] = "Option text is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setIsDirty(true);
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = formData.answerOptions.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    );

    setFormData((prev) => ({
      ...prev,
      answerOptions: updatedOptions,
    }));
    setErrors((prev) => ({ ...prev, [`option${index}`]: "", options: "" }));
    setIsDirty(true);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplateId(template._id);

    setFormData((prev) => ({
      ...prev,
      templateId: template._id,
      answerOptions: template.options?.length
        ? template.options.map((opt) => ({
            optionText: opt.optionText,
            color: opt.color,
          }))
        : [{ optionText: "", color: "#FFFFFF" }],
    }));
    setIsDirty(true);
  };

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      answerOptions: [
        ...prev.answerOptions,
        { optionText: "", color: "#FFFFFF" },
      ],
    }));
    setIsDirty(true);
  };

  const handleRemoveOption = (index) => {
    if (formData.answerOptions.length > 1) {
      setFormData((prev) => ({
        ...prev,
        answerOptions: prev.answerOptions.filter((_, i) => i !== index),
      }));
      setIsDirty(true);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, image: "" }));

    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      const mediaData = data.media[0];

      setFormData((prev) => ({
        ...prev,
        imageUrl: mediaData._id,
      }));

      setImagePreview(
        `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
      );
      setIsDirty(true);
    } catch (error) {
      setErrors((prev) => ({ ...prev, image: "Failed to upload image" }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      imageUrl: null,
    }));
    setIsDirty(true);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onUpdate(formData);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderTemplateSection = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Template
      </label>
      <div className="flex gap-2">
        <select
          value={selectedTemplateId}
          onChange={(e) => {
            const template = templates.find((t) => t._id === e.target.value);
            if (template) {
              handleTemplateSelect(template);
            }
          }}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={templatesLoading}
        >
          <option value="">Select a template</option>
          {templates.map((template) => (
            <option key={template._id} value={template._id}>
              {template.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          title="Manage Templates"
        >
          <Settings className="w-5 h-5" />
          Manage Templates
        </button>
      </div>
      {templatesLoading && (
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading templates...</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            {question ? "Edit Question" : "Add New Question"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your question title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px] ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter question description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimension
              </label>
              <input
                type="text"
                value={formData.dimension}
                onChange={(e) => handleInputChange("dimension", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter dimension"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                className="w-full h-[50px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Image
            </label>
            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-6 ${
                  errors.image ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {isUploading ? "Uploading..." : "Click to upload image"}
                  </span>
                </label>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Question"
                  className="w-full max-h-96 object-contain"
                />
                <button
                  onClick={handleImageRemove}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            {errors.image && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.image}
              </p>
            )}
          </div>

          {/* Template Selector */}
          {surveyType === "ArtPulse" && renderTemplateSection()}

          {/* Answer Options */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Answer Options <span className="text-red-500">*</span>
              </label>
              <button
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Add Option
              </button>
            </div>
            {errors.options && (
              <p className="mb-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.options}
              </p>
            )}
            <AnimatePresence>
              {formData.answerOptions.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.optionText}
                      onChange={(e) =>
                        handleOptionChange(index, "optionText", e.target.value)
                      }
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors[`option${index}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder={`Option ${index + 1}`}
                      style={{ backgroundColor: option.color }}
                    />
                    {errors[`option${index}`] && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
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
                  {formData.answerOptions.length > 1 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Timer Field */}
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="timer-input"
            >
              Timer (seconds)
            </label>
            <input
              id="timer-input"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              type="text"
              pattern="[0-9]*"
              maxLength="4"
              value={formData.timer}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                handleInputChange("timer", value === "" ? 0 : parseInt(value));
              }}
              placeholder="Enter time in seconds"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={isUploading || templatesLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {question ? "Update Question" : "Add Question"}
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isTemplateModalOpen && (
          <TemplateModal
            isOpen={isTemplateModalOpen}
            onClose={() => setIsTemplateModalOpen(false)}
            onTemplateSelect={handleTemplateSelect}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SurveyQuestionEditor;
