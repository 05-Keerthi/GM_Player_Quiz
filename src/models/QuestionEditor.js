import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import ColorPicker from "../components/ColorPicker";
import { QuestionTypeModal } from "./QuestionTypeModal";

const getContrastColor = (hexColor) => {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const QuestionEditor = ({ initialQuestion = null, onSubmit, onClose }) => {
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(!initialQuestion);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    options: [],
    correctAnswer: "",
    points: 10,
    timer: 10,
    imageUrl: null,
  });

  useEffect(() => {
    if (initialQuestion) {
      setFormData(initialQuestion);
      if (initialQuestion.imageUrl) {
        // Since we have the full URL in the response, use it directly
        setImagePreview(initialQuestion.imageUrl);
      }
    }
  }, [initialQuestion]);

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      options:
        type === "open_ended"
          ? []
          : type === "true_false"
          ? [
              { text: "True", isCorrect: false, color: "#ffffff" },
              { text: "False", isCorrect: false, color: "#ffffff" },
            ]
          : [
              { text: "", isCorrect: false, color: "#ffffff" },
              { text: "", isCorrect: false, color: "#ffffff" },
            ],
      correctAnswer: "",
    }));
    setIsTypeModalOpen(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

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

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      const mediaData = data.media[0];

      setImagePreview(
        `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
      );
      setFormData((prev) => ({
        ...prev,
        imageUrl: mediaData._id,
      }));
    } catch (error) {
      setError("Failed to upload image");
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
  };

  const handleOptionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setFormData((prev) => {
      if (
        prev.type === "multiple_choice" ||
        prev.type === "true_false" ||
        prev.type === "poll"
      ) {
        return {
          ...prev,
          options: prev.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index,
          })),
        };
      } else if (prev.type === "multiple_select") {
        return {
          ...prev,
          options: prev.options.map((opt, i) =>
            i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
          ),
        };
      }
      return prev;
    });
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: "", isCorrect: false, color: "#ffffff" },
      ],
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Question title is required");
      return false;
    }

    if (formData.type === "open_ended" && !formData.correctAnswer.trim()) {
      setError("Correct answer is required for open-ended questions");
      return false;
    }

    if (formData.type !== "open_ended") {
      const validOptions = formData.options.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        setError("At least two valid options are required");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <QuestionTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onTypeSelect={handleTypeSelect}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-lg p-6 shadow-lg max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            {initialQuestion ? "Edit Question" : "Add New Question"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your question"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Question Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                className="hidden"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200"
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </label>
              {imagePreview && (
                <button
                  onClick={handleImageRemove}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-5 h-5" />
                  Remove
                </button>
              )}
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Question"
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Question Options */}
          {formData.type === "open_ended" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.correctAnswer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    correctAnswer: e.target.value,
                  }))
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the correct answer"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Options <span className="text-red-500">*</span>
                </label>
                {!["true_false"].includes(formData.type) && (
                  <button
                    onClick={addOption}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Option
                  </button>
                )}
              </div>

              {formData.options.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border"
                >
                  <input
                    type={
                      formData.type === "multiple_select" ? "checkbox" : "radio"
                    }
                    checked={option.isCorrect}
                    onChange={() => handleCorrectAnswerChange(index)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      handleOptionChange(index, "text", e.target.value)
                    }
                    className="flex-1 p-2 rounded-lg"
                    placeholder={`Option ${index + 1}`}
                    style={{
                      backgroundColor: option.color,
                      color: getContrastColor(option.color),
                    }}
                  />
                  <ColorPicker
                    color={option.color}
                    onChange={(color) =>
                      handleOptionChange(index, "color", color)
                    }
                  />
                  {!["true_false"].includes(formData.type) &&
                    formData.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* Points and Timer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    points: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timer (seconds)
              </label>
              <input
                type="number"
                value={formData.timer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timer: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {initialQuestion ? "Update Question" : "Add Question"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestionEditor;
