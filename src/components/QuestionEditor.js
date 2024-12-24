import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  CheckSquare,
  ToggleLeft,
  MessageSquare,
  BarChart2,
  Upload,
  Trash2,
} from "lucide-react";

function parseQuestionData(question) {
  return {
    id: question?.id || question?._id || "",
    title: question?.title || "",
    type: question?.type || "multiple_choice",
    options: question?.options?.length
      ? question.options
      : [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
    points: question?.points ?? 1,
    timer: question?.timer ?? 30,
    imageUrl: question?.imageUrl || null,
    imageFile: null,
  };
}

const QuestionEditor = ({ question, onUpdate, onClose }) => {
  const [localImageFile, setLocalImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [parsedQuestion, setParsedQuestion] = useState(() =>
    parseQuestionData(question)
  );

  useEffect(() => {
    const loadImageUrl = async () => {
      if (question?.imageUrl) {
        const imageUrl = await fetchImageUrl(question.imageUrl);
        setImagePreview(imageUrl);
      } else {
        setImagePreview(null);
      }
    };
  
    setParsedQuestion(parseQuestionData(question));
    setLocalImageFile(null);
    loadImageUrl();
    setIsUploading(false);
    setUploadError(null);
  }, [question]);

  if (!question) return null;

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



  const fetchImageUrl = async (imageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/media/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
  
      const data = await response.json();
      return data.media.url; // This will return the full URL for the image
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  const handleInputChange = (field, value) => {
    setParsedQuestion((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, text: value } : opt
      ),
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setParsedQuestion((prev) => {
      const newOptions = prev.options.map((opt, i) => ({
        ...opt,
        isCorrect:
          prev.type === "multiple_choice"
            ? i === index
            : i === index
            ? !opt.isCorrect
            : opt.isCorrect,
      }));
      return { ...prev, options: newOptions };
    });
  };

  const handleAddOption = () => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: [...prev.options, { text: "", isCorrect: false }],
    }));
  };

  const handleRemoveOption = (index) => {
    setParsedQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLocalImageFile(file);
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
    setLocalImageFile(null);
    setImagePreview(null);
    setParsedQuestion((prev) => ({
      ...prev,
      imageFile: null,
      imageUrl: null,
    }));
    setUploadError(null);
  };

  const handleSave = () => {
    onUpdate(parsedQuestion);
    onClose();
  };

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
            Question Text
          </label>
          <input
            type="text"
            value={parsedQuestion.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
            placeholder="Enter your question here"
          />
        </div>

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
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                </div>
              )}
            </div>
          )}
          {uploadError && (
            <div className="text-red-500 bg-red-50 p-2 rounded">
              {uploadError}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Question Type
          </label>
          <select
            value={parsedQuestion.type}
            onChange={(e) => handleInputChange("type", e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="multiple_select">Multiple Select</option>
            <option value="true_false">True/False</option>
            <option value="open_ended">Open Ended</option>
            <option value="poll">Poll</option>
          </select>
        </div>

        {parsedQuestion.type !== "open_ended" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Answer Options
              </label>
              {parsedQuestion.type !== "true_false" && (
                <button
                  onClick={handleAddOption}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Add Option
                </button>
              )}
            </div>
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
                  checked={option.isCorrect}
                  onChange={() => handleCorrectAnswerChange(index)}
                  className="w-5 h-5 text-blue-600"
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 p-2 border-b-2 border-transparent focus:border-blue-500 transition-colors"
                  placeholder={`Option ${index + 1}`}
                />
                {parsedQuestion.type !== "true_false" &&
                  parsedQuestion.options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
              </div>
            ))}
          </div>
        )}

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
