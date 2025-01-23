import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  X,
  CheckSquare,
  ToggleLeft,
  MessageSquare,
  BarChart2,
  Upload,
  Trash2,
} from "lucide-react";
import ColorPicker from "../components/ColorPicker";

const getContrastColor = (hexColor) => {
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const QuestionTypeModal = ({ isOpen, onClose, onAddQuestion }) => {
  const { quizId } = useParams();
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState({
    title: "",
    type: "",
    options: [],
    correctAnswer: "",
    points: 10,
    timer: 10,
    imageUrl: null,
    quizId: quizId,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setStep(1);
      setImagePreview(null);
      setQuestion({
        title: "",
        type: "",
        options: [],
        correctAnswer: "",
        points: 10,
        timer: 10,
        imageUrl: null,
        quizId: quizId,
      });
      setError(null);
    }
  }, [isOpen, quizId]);

  const questionTypes = [
    {
      id: "multiple_choice",
      icon: CheckSquare,
      title: "Multiple Choice",
      description: "One correct answer from multiple options",
    },
    {
      id: "multiple_select",
      icon: CheckSquare,
      title: "Multiple Select",
      description: "Multiple correct answers can be selected",
    },
    {
      id: "true_false",
      icon: ToggleLeft,
      title: "True/False",
      description: "Simple true or false question",
    },
    {
      id: "open_ended",
      icon: MessageSquare,
      title: "Open Ended",
      description: "Free text response question",
    },
    {
      id: "poll",
      icon: BarChart2,
      title: "Poll",
      description: "Poll response question",
    },
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setQuestion((prev) => ({
      ...prev,
      type: type,
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
    setStep(2);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("media", file);

        const token = localStorage.getItem("token");
        const uploadResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/media/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadResponse.json();
        const mediaData = uploadData.media[0];

        setQuestion((prev) => ({
          ...prev,
          imageUrl: mediaData._id,
        }));

        setImagePreview(
          `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
        );
      } catch (error) {
        console.error("Image upload error:", error);
        setError("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setQuestion((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const handleOptionChange = (index, value) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, text: value } : opt
      ),
    }));
  };

  const handleOptionColorChange = (index, color) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, color } : opt
      ),
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setQuestion((prev) => {
      if (
        prev.type === "multiple_choice" ||
        prev.type === "true_false" ||
        prev.type === "poll"
      ) {
        const newOptions = prev.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === index,
        }));
        return { ...prev, options: newOptions };
      } else if (prev.type === "multiple_select") {
        const newOptions = prev.options.map((opt, i) =>
          i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt
        );
        return { ...prev, options: newOptions };
      }
      return prev;
    });
  };

  const addOption = () => {
    setQuestion((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { text: "", isCorrect: false, color: "#ffffff" },
      ],
    }));
  };

  const removeOption = (index) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!question.title) {
        throw new Error("Question title is required");
      }

      if (question.type === "open_ended" && !question.correctAnswer) {
        throw new Error("Correct answer is required for open-ended questions");
      }

      if (
        question.type !== "open_ended" &&
        question.options.some((opt) => !opt.text)
      ) {
        throw new Error("All options must have text");
      }

      const payload = {
        title: question.title,
        type: question.type,
        options:
          question.type === "open_ended"
            ? []
            : question.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                color: opt.color,
              })),
        correctAnswer:
          question.type === "open_ended" ? question.correctAnswer : "",
        points: question.points,
        timer: question.timer,
        imageUrl: question.imageUrl,
        quizId: question.quizId,
      };

      await onAddQuestion(payload);
      onClose();
    } catch (error) {
      setError(error.message);
      console.error("Question submission error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 1 ? "Select Question Type" : "Create Question"}
          </h2>
          <button
            onClick={() => {
              if (step === 2) {
                setStep(1);
                setSelectedType(null);
              } else {
                onClose();
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="p-4 border rounded-lg text-left transition-all hover:border-blue-300"
              >
                <div className="flex items-center gap-3">
                  <type.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">{type.title}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={question.title}
                onChange={(e) =>
                  setQuestion({ ...question, title: e.target.value })
                }
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your question here..."
              />
            </div>

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

            {selectedType === "open_ended" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={question.correctAnswer}
                  onChange={(e) =>
                    setQuestion({ ...question, correctAnswer: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter the correct answer..."
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Options <span className="text-red-500">*</span>
                  </label>
                  {!["true_false"].includes(selectedType) && (
                    <button
                      onClick={addOption}
                      className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    >
                      Add Option
                    </button>
                  )}
                </div>
                {question.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border"
                  >
                    <input
                      type={
                        selectedType === "multiple_select"
                          ? "checkbox"
                          : "radio"
                      }
                      checked={option.isCorrect}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      className="flex-1 p-2 border-b-2 border-transparent focus:border-blue-500 transition-colors rounded-lg"
                      placeholder={`Option ${index + 1}`}
                      style={{
                        backgroundColor: option.color,
                        color: getContrastColor(option.color),
                      }}
                    />
                    <ColorPicker
                      color={option.color}
                      onChange={(color) =>
                        handleOptionColorChange(index, color)
                      }
                    />
                    {!["true_false"].includes(selectedType) &&
                      question.options.length > 2 && (
                        <button
                          aria-label="removeOption"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points
                </label>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) =>
                    setQuestion({
                      ...question,
                      points: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timer (seconds)
                </label>
                <input
                  type="number"
                  value={question.timer}
                  onChange={(e) =>
                    setQuestion({
                      ...question,
                      timer: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleSubmit}
                disabled={
                  !question.title ||
                  (selectedType === "open_ended" && !question.correctAnswer) ||
                  (selectedType !== "open_ended" &&
                    question.options.some((opt) => !opt.text))
                }
                className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Create Question
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionTypeModal;
