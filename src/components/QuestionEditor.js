import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ColorPicker from "../components/ColorPicker";
import {
  X,
  CheckSquare,
  ToggleLeft,
  MessageSquare,
  BarChart2,
  Upload,
  Trash2,
} from "lucide-react";

const getContrastColor = (hexColor) => {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

function parseQuestionData(question) {
  return {
    id: question?.id || question?._id || "",
    title: question?.title || "",
    type: question?.type || "multiple_choice",
    options: question?.options?.length
      ? question.options.map((opt) => ({
          ...opt,
          color: opt.color || "#ffffff",
        }))
      : question?.type === "true_false"
      ? [
          { text: "True", isCorrect: false, color: "#ffffff" },
          { text: "False", isCorrect: false, color: "#ffffff" },
        ]
      : [{ text: "", isCorrect: false, color: "#ffffff" }],
    correctAnswer: question?.correctAnswer || "",
    points: question?.points ?? 1,
    timer: question?.timer ?? 30,
    imageUrl: question?.imageUrl || null,
  };
}

const QuestionEditor = ({ question, onUpdate, onClose }) => {
  const [parsedQuestion, setParsedQuestion] = useState(() =>
    parseQuestionData(question)
  );
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

  useEffect(() => {
    setParsedQuestion(parseQuestionData(question));

    if (question?.imageUrl) {
      if (question.imageUrl.startsWith("/uploads/")) {
        setImagePreview(`${API_BASE_URL}${question.imageUrl}`);
      } else {
        setImagePreview(question.imageUrl);
      }
    } else {
      setImagePreview(null);
    }
  }, [question]);

  const getQuestionTypeIcon = (type) => {
    const typeIcons = {
      multiple_choice: <CheckSquare className="w-6 h-6 text-blue-600" />,
      multiple_select: <CheckSquare className="w-6 h-6 text-green-600" />,
      true_false: <ToggleLeft className="w-6 h-6 text-purple-600" />,
      open_ended: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      poll: <BarChart2 className="w-6 h-6 text-teal-600" />,
    };
    return typeIcons[type] || null;
  };

  const handleInputChange = (field, value) => {
    setParsedQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = parsedQuestion.options.map((opt, i) =>
      i === index ? { ...opt, text: value } : opt
    );

    setParsedQuestion((prev) => ({
      ...prev,
      options: updatedOptions,
    }));
  };

  const handleOptionColorChange = (index, color) => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, color } : opt
      ),
    }));
  };

  const handleAddOption = () => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: "", isCorrect: false, color: "#ffffff" },
      ],
    }));
  };

  const handleRemoveOption = (index) => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    const updatedOptions = parsedQuestion.options.map((opt, i) => ({
      ...opt,
      isCorrect:
        parsedQuestion.type === "multiple_choice"
          ? i === index
          : i === index
          ? !opt.isCorrect
          : opt.isCorrect,
    }));

    setParsedQuestion((prev) => ({
      ...prev,
      options: updatedOptions,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("media", file);

        const token = localStorage.getItem("token");
        const uploadResponse = await fetch(`${API_BASE_URL}/media/upload`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadResponse.json();
        const mediaData = uploadData.media[0];

        setImagePreview(
          `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
        );

        setParsedQuestion((prev) => ({
          ...prev,
          imageUrl: mediaData._id,
        }));
      } catch (error) {
        console.error("Image upload error:", error);
        setUploadError("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
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
    const updatedQuestion = {
      ...parsedQuestion,
      imageUrl: parsedQuestion.imageUrl,
    };

    if (onUpdate) {
      onUpdate(updatedQuestion);
    }
    onClose();
  };

  if (!question) return null;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-gray-50 rounded-xl shadow-2xl p-8 w-full max-w-2xl mx-auto relative"
    >
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          {getQuestionTypeIcon(parsedQuestion.type)}
          <h2 className="text-2xl font-bold text-gray-800">Edit Question</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors group"
        >
          <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Text <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={parsedQuestion.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
            placeholder="Enter your question here"
          />
        </div>

        {parsedQuestion.type === "open_ended" ? (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correct Answer
            </label>
            <input
              type="text"
              value={parsedQuestion.correctAnswer}
              onChange={(e) =>
                handleInputChange("correctAnswer", e.target.value)
              }
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
              placeholder="Enter the correct answer"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Answer Options <span className="text-red-500">*</span>
            </label>
            {parsedQuestion.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white p-3 rounded-lg border"
              >
                <input
                  type={
                    parsedQuestion.type === "multiple_select"
                      ? "checkbox"
                      : "radio"
                  }
                  checked={option.isCorrect || false}
                  onChange={() => handleCorrectAnswerChange(index)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={option.text || ""}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border-b-2 border-transparent focus:border-blue-500 transition-colors rounded-lg"
                  placeholder={`Option ${index + 1}`}
                  style={{
                    backgroundColor: option.color,
                    color: getContrastColor(option.color),
                  }}
                />
                <ColorPicker
                  color={option.color}
                  onChange={(color) => handleOptionColorChange(index, color)}
                />
                {parsedQuestion.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" data-testid="trash-2-icon" />
                  </button>
                )}
              </div>
            ))}
            {parsedQuestion.type !== "true_false" && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                Add Option
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            Question Image
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </label>
            {imagePreview && (
              <button
                onClick={handleImageRemove}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <Trash2 className="w-5 h-5" />
                Remove
              </button>
            )}
          </div>

          {uploadError && (
            <div className="text-red-500 bg-red-50 p-2 rounded-lg">
              {uploadError}
            </div>
          )}

          {imagePreview && (
            <div className="relative mt-4">
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
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              value={parsedQuestion.points}
              onChange={(e) =>
                handleInputChange("points", parseInt(e.target.value))
              }
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Timer (seconds)
            </label>
            <input
              type="number"
              value={parsedQuestion.timer}
              onChange={(e) =>
                handleInputChange("timer", parseInt(e.target.value))
              }
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default QuestionEditor;
