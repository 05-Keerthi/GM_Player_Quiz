import React, { useState, useEffect } from "react";
import { X, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

const SurveyQuestionEditor = ({ question, onUpdate, onClose }) => {
  const [parsedQuestion, setParsedQuestion] = useState(() => ({
    title: question?.title || "",
    description: question?.description || "",
    dimension: question?.dimension || "",
    year: question?.year || "",
    imageUrl: question?.imageUrl || null,
    timer: question?.timer || 30,
    answerOptions: question?.answerOptions?.length
      ? question.answerOptions
      : [{ optionText: "" }],
    imageFile: null,
  }));

  const [imagePreview, setImagePreview] = useState(question?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (question) {
      setParsedQuestion({
        title: question.title || "",
        description: question.description || "",
        dimension: question.dimension || "",
        year: question.year || "",
        imageUrl: question.imageUrl || null,
        timer: question.timer || 30,
        answerOptions: question.answerOptions?.length
          ? question.answerOptions
          : [{ optionText: "" }],
        imageFile: null,
      });
      setImagePreview(question.imageUrl);
    }
  }, [question]);

  const handleInputChange = (field, value) => {
    setParsedQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = parsedQuestion.answerOptions.map((opt, i) =>
      i === index ? { ...opt, optionText: value } : opt
    );

    setParsedQuestion((prev) => ({
      ...prev,
      answerOptions: updatedOptions,
    }));
  };

  const handleAddOption = () => {
    setParsedQuestion((prev) => ({
      ...prev,
      answerOptions: [...prev.answerOptions, { optionText: "" }],
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

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setParsedQuestion((prev) => ({
          ...prev,
          imageFile: file,
          imageUrl: reader.result,
        }));
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError("Error reading file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setParsedQuestion((prev) => ({
      ...prev,
      imageFile: null,
      imageUrl: null,
    }));
  };

  const handleSave = () => {
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
                  Click to upload image
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Question"
                className="w-full h-48 object-cover rounded-lg"
              />
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
              <input
                type="text"
                value={option.optionText}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
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
