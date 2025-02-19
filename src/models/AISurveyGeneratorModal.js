import React, { useState, useEffect } from "react";
import { X, Star, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AISurveyGeneratorModal = ({
  isOpen,
  onClose,
  surveyId,
  selectedCategories,
  surveyType,
}) => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [questionsLength, setQuestionsLength] = useState("5");
  const [slidesLength, setSlidesLength] = useState("0");
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [previewMode, setPreviewMode] = useState("questions");

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "http://localhost:5000/api/agent/topics",
          {
            categoryIds: selectedCategories,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setTopics(response.data.topics);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        toast.error("Failed to fetch topics");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen, selectedCategories]);

  const handleTopicSelect = async (topic) => {
    try {
      setGeneratingQuestions(true);
      setSelectedTopic(topic);
      const token = localStorage.getItem("token");

      const requestBody = {
        topic: {
          title: topic.title,
        },
        numQuestions: parseInt(questionsLength),
        numSlides: parseInt(slidesLength),
      };

      const endpoint =
        surveyType === "ArtPulse"
          ? "http://localhost:5000/api/agent/Artpulse-questions"
          : "http://localhost:5000/api/agent/survey-questions";

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setGeneratedQuestions(response.data);
        setShowQuestions(true);
      } else {
        throw new Error("No questions received from the generator");
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error(error.message || "Failed to generate questions");
      setSelectedTopic(null);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleCustomTopicGenerate = async () => {
    if (!customTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    try {
      setGeneratingQuestions(true);
      const token = localStorage.getItem("token");

      const requestBody = {
        topic: {
          title: customTopic,
        },
        numQuestions: parseInt(questionsLength),
        numSlides: parseInt(slidesLength),
      };

      const endpoint =
        surveyType === "ArtPulse"
          ? "http://localhost:5000/api/agent/Artpulse-questions"
          : "http://localhost:5000/api/agent/survey-questions";

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setGeneratedQuestions(response.data);
        setShowQuestions(true);
      } else {
        throw new Error("No questions received from the generator");
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSaveQuestions = async () => {
    try {
      setSavingQuestions(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const transformedQuestions = generatedQuestions.questions.map(
        (question) => ({
          ...question,
          title: question.title,
          type: question.type || "multiple_choice",
          timer: question.timer || 30,
          dimension: question.dimension || 1,
          year: question.year || new Date().getFullYear(),
          answerOptions: question.answerOptions || question.options,
        })
      );

      const transformedSlides =
        generatedQuestions.slides?.map((slide) => ({
          ...slide,
          surveyTitle: slide.slideTitle,
          surveyContent: slide.slideContent,
        })) || [];

      const surveyResponse = await axios.get(
        `http://localhost:5000/api/survey-quiz/${surveyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const currentSurvey = surveyResponse.data;
      const currentOrder = currentSurvey.order || [];
      const currentQuestions = currentSurvey.questions || [];
      const currentSlides = currentSurvey.slides || [];

      const questionsResponse = await axios.post(
        `http://localhost:5000/api/${surveyId}/questions/bulk`,
        {
          questions: transformedQuestions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let slidesResponse = null;
      if (transformedSlides.length > 0) {
        slidesResponse = await axios.post(
         `http://localhost:5000/api/${surveyId}/slides/bulk`,
          {
            slides: transformedSlides,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      const newQuestions = questionsResponse.data.questions;
      const newSlides = slidesResponse?.data?.slides || [];

      const updatedQuestions = [...currentQuestions, ...newQuestions];
      const updatedSlides = [...currentSlides, ...newSlides];

      const updatedOrder = [
        ...currentOrder,
        ...newQuestions.map((question) => ({
          id: question._id,
          type: "question",
        })),
        ...newSlides.map((slide) => ({
          id: slide._id,
          type: "slide",
        })),
      ];

      await axios.put(
        `http://localhost:5000/api/survey-quiz/${surveyId}`,
        {
          ...currentSurvey,
          title: generatedQuestions.surveyTitle,
          description: generatedQuestions.surveyContent,
          questions: updatedQuestions,
          slides: updatedSlides,
          order: updatedOrder,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Content added to survey successfully");
      onClose();
    } catch (error) {
      console.error("Failed to add content to survey:", error);
      if (error.message === "No authentication token found") {
        navigate("/login");
        return;
      }
      toast.error(
        error.response?.data?.message || "Failed to add content to survey"
      );
    } finally {
      setSavingQuestions(false);
    }
  };

  const renderQuestionPreview = (question, index) => {
    return (
      <div key={index} className="p-4 border rounded-lg mb-4 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              Question {index + 1}
            </span>
            {question.timer && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                {question.timer}s
              </span>
            )}
            {question.dimension && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                Dimension {question.dimension}
              </span>
            )}
          </div>
        </div>

        <h3 className="font-medium mt-3 mb-1">{question.title}</h3>
        {question.description && (
          <p className="text-gray-600 text-sm mb-3">{question.description}</p>
        )}

        <div className="space-y-2 mt-4">
          {question.answerOptions?.map((option, optIndex) => (
            <div
              key={optIndex}
              className="p-3 rounded-lg flex items-center gap-2 border-l-4"
              style={{
                backgroundColor: `${option.color}15`,
                borderColor: option.color,
              }}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <span className="flex-grow">{option.optionText}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSlidePreview = (slide, index) => {
    return (
      <div key={index} className="p-4 border rounded-lg mb-4 bg-white">
        <div className="flex items-start gap-3">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            Slide {index + 1}
          </span>
        </div>
        <h3 className="font-medium mt-2 mb-2">{slide.slideTitle}</h3>
        <p className="text-gray-700">{slide.slideContent}</p>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showQuestions ? (
              <button
                onClick={() => setShowQuestions(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {showQuestions
                ? generatedQuestions?.surveyTitle
                : `Generate ${surveyType}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>AI assisted</span>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left side content area */}
          <div className="flex-1 p-6 overflow-y-auto border-r">
            {showQuestions ? (
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {generatedQuestions.surveyTitle}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {generatedQuestions.surveyContent}
                  </p>

                  <div className="flex gap-4 mb-4">
                    <button
                      className={`px-4 py-2 rounded-lg ${
                        previewMode === "questions"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100"
                      }`}
                      onClick={() => setPreviewMode("questions")}
                    >
                      Questions ({generatedQuestions?.questions?.length})
                    </button>
                    {generatedQuestions?.slides?.length > 0 && (
                      <button
                        className={`px-4 py-2 rounded-lg ${
                          previewMode === "slides"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100"
                        }`}
                        onClick={() => setPreviewMode("slides")}
                      >
                        Slides ({generatedQuestions?.slides?.length})
                      </button>
                    )}
                  </div>
                </div>

                {previewMode === "questions"
                  ? generatedQuestions?.questions.map((question, index) =>
                      renderQuestionPreview(question, index)
                    )
                  : generatedQuestions?.slides?.map((slide, index) =>
                      renderSlidePreview(slide, index)
                    )}
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter your custom topic..."
                      className="w-full p-3 border rounded-lg"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      disabled={generatingQuestions}
                    />
                  </div>
                  <button
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                      generatingQuestions
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    onClick={handleCustomTopicGenerate}
                    disabled={generatingQuestions || !customTopic.trim()}
                  >
                    {generatingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      Suggested Topics
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 text-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading topics...</p>
                      </div>
                    ) : (
                      topics?.map((topic, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg transition-all ${
                            selectedTopic?.title === topic.title
                              ? "border-blue-500 bg-blue-50"
                              : "hover:border-gray-400"
                          } ${
                            generatingQuestions
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={() =>
                            !generatingQuestions && handleTopicSelect(topic)
                          }
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-1 bg-gray-100 rounded">📝</span>
                            <span className="text-sm text-gray-600">
                              {surveyType}
                            </span>
                          </div>
                          <h3 className="font-medium mb-2">{topic.title}</h3>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right side settings panel */}
          <div className="w-80 p-6 bg-gray-50">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Questions length</h3>
                  <span className="text-gray-400 hover:text-gray-600 cursor-help">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <select
                  className="w-full p-3 border rounded-lg bg-white"
                  value={questionsLength}
                  onChange={(e) => setQuestionsLength(e.target.value)}
                  disabled={generatingQuestions}
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Slides length</h3>
                  <span className="text-gray-400 hover:text-gray-600 cursor-help">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <select
                  className="w-full p-3 border rounded-lg bg-white"
                  value={slidesLength}
                  onChange={(e) => setSlidesLength(e.target.value)}
                  disabled={generatingQuestions}
                >
                  <option value="0">0 slides</option>
                  <option value="3">3 slides</option>
                  <option value="5">5 slides</option>
                  <option value="10">10 slides</option>
                </select>
              </div>

              {generatingQuestions && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-blue-700">
                      Generating {surveyType}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Please wait while we generate your{" "}
                    {surveyType.toLowerCase()} content...
                  </p>
                </div>
              )}

              {showQuestions && (
                <>
                  <button
                    onClick={handleSaveQuestions}
                    disabled={savingQuestions}
                    className={`w-full px-4 py-3 rounded-lg ${
                      savingQuestions
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {savingQuestions ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      `Add content to ${surveyType.toLowerCase()}`
                    )}
                  </button>

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium mb-2">Summary</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between">
                        <span>Questions:</span>
                        <span className="font-medium">
                          {generatedQuestions?.questions?.length || 0}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Slides:</span>
                        <span className="font-medium">
                          {generatedQuestions?.slides?.length || 0}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Topic:</span>
                        <span className="font-medium">
                          {selectedTopic?.title || customTopic}
                        </span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISurveyGeneratorModal;
