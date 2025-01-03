import React, { useState, useEffect } from "react";
import { X, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

const processQuestionData = (data) => {
  return {
    title: data.title || "",
    description: data.description || "",
    dimension: data.dimension || "",
    year: data.year || "",
    imageUrl: data.imageUrl || null,
    timer: data.timer || 30,
    answerOptions: Array.isArray(data.answerOptions)
      ? data.answerOptions.map((option) => ({
          optionText: option.optionText || "",
          color: option.color || "#ffffff",
        }))
      : [{ optionText: "", color: "#ffffff" }],
  };
};

const SurveyQuestionEditor = ({ question, onUpdate, onClose }) => {
  const [parsedQuestion, setParsedQuestion] = useState(() =>
    processQuestionData({
      title: question?.title || "",
      description: question?.description || "",
      dimension: question?.dimension || "",
      year: question?.year || "",
      imageUrl: question?.imageUrl || null,
      timer: question?.timer || 30,
      answerOptions: question?.answerOptions?.length
        ? question.answerOptions
        : [{ optionText: "", color: "#ffffff" }],
    })
  );

  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (question) {
      setParsedQuestion(processQuestionData(question));
      setImagePreview(question.imageUrl);
    }
  }, [question]);

  const handleInputChange = (field, value) => {
    setParsedQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = parsedQuestion.answerOptions.map((opt, i) =>
      i === index ? { ...opt, [field]: value } : opt
    );

    setParsedQuestion((prev) => ({
      ...prev,
      answerOptions: updatedOptions,
    }));
  };

  const handleAddOption = () => {
    setParsedQuestion((prev) => ({
      ...prev,
      answerOptions: [
        ...prev.answerOptions,
        { optionText: "", color: "#ffffff" },
      ],
    }));
  };

  const handleRemoveOption = (index) => {
    if (parsedQuestion.answerOptions.length > 1) {
      setParsedQuestion((prev) => ({
        ...prev,
        answerOptions: prev.answerOptions.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

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

      // Store the media ID in imageUrl
      setParsedQuestion((prev) => ({
        ...prev,
        imageUrl: mediaData._id,
      }));

      // Set the preview URL using the full URL from the uploaded file
      const previewUrl = `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`;
      setImagePreview(previewUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setParsedQuestion((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const handleSave = () => {
    if (!parsedQuestion.title.trim()) {
      setUploadError("Please enter a question title");
      return;
    }

    if (!parsedQuestion.description.trim()) {
      setUploadError("Please enter a question description");
      return;
    }

    if (!parsedQuestion.answerOptions.some((opt) => opt.optionText.trim())) {
      setUploadError("Please add at least one answer option");
      return;
    }

    if (onUpdate) {
      onUpdate(parsedQuestion);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {question ? "Edit Question" : "Add Question"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {uploadError}
        </div>
      )}

      <div className="space-y-6">
        {/* Question Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question Title
          </label>
          <input
            type="text"
            value={parsedQuestion.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter question title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={parsedQuestion.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="Enter question description"
          />
        </div>

        {/* Dimension and Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dimension
            </label>
            <input
              type="text"
              value={parsedQuestion.dimension}
              onChange={(e) => handleInputChange("dimension", e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter dimension"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <input
              type="text"
              value={parsedQuestion.year}
              onChange={(e) => handleInputChange("year", e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter year"
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Question Image (Optional)
          </label>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {isUploading ? "Uploading..." : "Click to upload image"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "75%" }}
                >
                  <img
                    src={imagePreview}
                    alt="Question"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleImageRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Answer Options
            </label>
            <button
              onClick={handleAddOption}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Add Option
            </button>
          </div>
          {parsedQuestion.answerOptions.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="flex-1 p-3 rounded-lg focus-within:ring-2 focus-within:ring-blue-500"
                style={{ backgroundColor: option.color }}
              >
                <input
                  type="text"
                  value={option.optionText}
                  onChange={(e) =>
                    handleOptionChange(index, "optionText", e.target.value)
                  }
                  className="w-full bg-transparent focus:outline-none"
                  placeholder={`Option ${index + 1}`}
                />
              </div>
              <input
                type="color"
                value={option.color}
                onChange={(e) =>
                  handleOptionChange(index, "color", e.target.value)
                }
                className="w-10 h-10 border rounded-lg"
              />
              {parsedQuestion.answerOptions.length > 1 && (
                <button
                  onClick={() => handleRemoveOption(index)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Timer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timer (seconds)
          </label>
          <input
            type="number"
            value={parsedQuestion.timer}
            onChange={(e) =>
              handleInputChange("timer", parseInt(e.target.value))
            }
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {question ? "Update Question" : "Add Question"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SurveyQuestionEditor;
