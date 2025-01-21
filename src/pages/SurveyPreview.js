import React, { useState, useEffect } from "react";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useSurveyContext } from "../context/surveyContext";
import { toast } from "react-toastify";

const SurveyPreviewPage = () => {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { surveyId } = useParams();
  const token = localStorage.getItem("token");
  const { publishSurvey } = useSurveyContext();
  const [isPublishing, setIsPublishing] = useState(false);
  const userId = JSON.parse(localStorage.getItem("user"))?.id || "";
  const fetchSurveyData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/survey-quiz/${surveyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Combine slides and questions based on the order field
      let orderedContent = [];
      if (response.data.order && response.data.order.length > 0) {
        orderedContent = response.data.order.map((item) => {
          if (item.type === "slide") {
            return {
              ...response.data.slides.find((slide) => slide._id === item.id),
              type: "slide",
            };
          } else {
            return {
              ...response.data.questions.find(
                (question) => question._id === item.id
              ),
              type: "question",
              surveyTitle: response.data.questions.find(
                (q) => q._id === item.id
              )?.title,
              surveyContent: response.data.questions.find(
                (q) => q._id === item.id
              )?.description,
            };
          }
        });
      } else {
        // Fallback if no order is specified
        const slidesWithType = response.data.slides.map((slide) => ({
          ...slide,
          type: "slide",
        }));
        const questionsWithType = response.data.questions.map((question) => ({
          ...question,
          type: "question",
          surveyTitle: question.title,
          surveyContent: question.description,
        }));
        orderedContent = [...slidesWithType, ...questionsWithType];
      }

      setSlides(orderedContent);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching survey data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveyData();
  }, [surveyId]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishSurvey(surveyId);
      // Show success toast
      toast("Survey published successfully", "success");
      // Navigate to survey details
      navigate(
        `/survey-details?type=survey&surveyId=${surveyId}&hostId=${userId}`
      );
    } catch (error) {
      toast(error.message || "Failed to publish survey", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const startPresentation = () => {
    setPresentationMode(true);
  };

  const exitPresentation = () => {
    setPresentationMode(false);
  };

  const navigatePresentation = (direction) => {
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (presentationMode) {
        switch (e.key) {
          case "ArrowRight":
          case "Right":
            navigatePresentation("next");
            break;
          case "ArrowLeft":
          case "Left":
            navigatePresentation("prev");
            break;
          case "Escape":
            exitPresentation();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentationMode, currentIndex]);

  const getTextColor = (backgroundColor) => {
    if (!backgroundColor) return "text-gray-700";

    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "text-gray-700" : "text-white";
  };

  const renderQuestionContent = (question, index, mode = "preview") => (
    <div
      className="space-y-6"
      data-testid={`${mode}-question-content-${index}`}
    >
      <div
        className="text-lg text-gray-700 leading-relaxed"
        data-testid="question-description"
      >
        {question.description}
      </div>

      <div className="space-y-4" data-testid="answer-options">
        {question.answerOptions?.map((option, optionIndex) => (
          <div
            key={optionIndex}
            data-testid={`answer-option-${optionIndex}`}
            style={{ backgroundColor: option.color || "#ffffff" }}
            className={`p-4 rounded-lg transition-colors cursor-pointer border hover:opacity-90`}
          >
            <span
              className={`${getTextColor(option.color)}`}
              data-testid={`answer-text-${optionIndex}`}
            >
              {option.optionText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = (slide, index, mode = "preview") => {
    if (!slide) {
      return <p data-testid="error-message">Content not available</p>;
    }

    return (
      <div
        className="h-full flex flex-col"
        data-testid={`${mode}-${slide.type}-container-${index}`}
      >
        <div className="p-6 flex-grow overflow-auto">
          {slide.surveyTitle && (
            <h2 className="text-2xl font-bold mb-4" data-testid="content-title">
              {slide.surveyTitle}
            </h2>
          )}

          {slide.imageUrl && (
            <div className="mb-4 flex justify-center">
              <img
                src={slide.imageUrl}
                alt={slide.surveyTitle || "Content"}
                className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-md"
                data-testid="content-image"
              />
            </div>
          )}

          {slide.type === "question"
            ? renderQuestionContent(slide, index, mode)
            : slide.surveyContent && (
                <div className="mb-4" data-testid="slide-description">
                  <p className="text-lg text-gray-700">{slide.surveyContent}</p>
                </div>
              )}
        </div>
      </div>
    );
  };

  const renderPresentationMode = () => (
    <div
      className="fixed inset-0 bg-[#262626] z-50"
      data-testid="presentation-mode"
    >
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-3 flex justify-between items-center">
        <span className="text-gray-300 font-medium" data-testid="slide-type">
          {slides[currentIndex]?.type === "question" ? "Question" : "Slide"}{" "}
          {currentIndex + 1}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm" data-testid="slide-progress">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            onClick={exitPresentation}
            autoFocus
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="exit-presentation"
            aria-label="Exit presentation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="h-full flex flex-col pt-16">
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl aspect-[16/9] bg-white rounded-lg shadow-2xl overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div
                className={`px-8 py-4 ${
                  slides[currentIndex]?.type === "question"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700"
                    : "bg-gradient-to-r from-purple-600 to-purple-700"
                }`}
              >
                <h2 className="text-2xl font-semibold text-white">
                  {slides[currentIndex]?.surveyTitle}
                </h2>
              </div>

              <div className="flex-1 p-8 overflow-auto">
                {renderContent(
                  slides[currentIndex],
                  currentIndex,
                  "presentation"
                )}
              </div>
            </div>
          </motion.div>

          <div className="absolute left-4">
            <button
              onClick={() => navigatePresentation("prev")}
              disabled={currentIndex === 0}
              className={`p-3 rounded-full transition-all ${
                currentIndex === 0
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute right-4">
            <button
              onClick={() => navigatePresentation("next")}
              disabled={currentIndex === slides.length - 1}
              className={`p-3 rounded-full transition-all ${
                currentIndex === slides.length - 1
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-purple-500 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / slides.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="h-screen flex flex-col bg-gray-100"
      data-testid="survey-preview"
    >
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Survey Preview</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={startPresentation}
            className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600"
            disabled={loading || slides.length === 0}
            data-testid="start-presentation"
          >
            <Play className="w-5 h-5" />
            Start Presentation
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </button>
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-800"
            data-testid="close-preview"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {loading ? (
        <div
          className="flex-1 flex items-center justify-center"
          data-testid="loading-state"
        >
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div
            className="w-64 bg-gray-50 border-r overflow-y-auto p-4"
            data-testid="sidebar"
          >
            <div className="space-y-3">
              {slides.map((slide, index) => (
                <div
                  key={slide._id}
                  onClick={() => setCurrentIndex(index)}
                  data-testid={`sidebar-item-${index}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentIndex === index
                      ? "bg-purple-50 border-purple-300"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {slide.type === "question" ? "Question" : "Slide"}{" "}
                    {index + 1}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {slide.surveyTitle}
                  </div>
                  {slide.imageUrl && (
                    <div className="mt-2 h-20 flex items-center justify-center">
                      <img
                        src={slide.imageUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white" data-testid="main-content">
            <div className="h-full border-l">
              {slides[currentIndex] &&
                renderContent(slides[currentIndex], currentIndex, "preview")}
            </div>
          </div>
        </div>
      )}

      {presentationMode && renderPresentationMode()}
    </div>
  );
};

export default SurveyPreviewPage;
