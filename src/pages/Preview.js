import React, { useState, useEffect } from "react";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

// QuizContent Component
const QuizContent = ({ item, inPresentation = false }) => {
  const getContrastColor = (hexColor) => {
    if (!hexColor || hexColor === '#') return '#000000';
    
    const color = hexColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  const renderOptions = () => {
    const options = item.data.options || item.data.answerOptions;
    
    if (!options) return null;

    return (
      <div className="space-y-4">
        {options.map((option, idx) => {
          const OptionWrapper = inPresentation ? motion.div : 'div';
          const optionProps = inPresentation ? {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { delay: idx * 0.1 }
          } : {};

          return (
            <OptionWrapper
              key={idx}
              {...optionProps}
              style={{
                backgroundColor: option.color || option.backgroundColor || '#ffffff',
                color: getContrastColor(option.color || option.backgroundColor)
              }}
              className="p-4 rounded-lg border-2 transition-all hover:scale-[1.01]"
            >
              <label className="flex items-center gap-3">
                <div className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${option.isCorrect ? "border-green-500 text-green-500" : "border-gray-400 text-gray-400"}
                `}>
                  {option.isCorrect && "✓"}
                </div>
                <span className="text-lg">{option.text || option.optionText}</span>
                {option.isCorrect && (
                  <span 
                    className="text-sm font-medium ml-2" 
                    style={{ color: option.isCorrect ? '#22c55e' : 'inherit' }}
                  >
                    (Correct Answer)
                  </span>
                )}
              </label>
            </OptionWrapper>
          );
        })}
      </div>
    );
  };

  if (!item?.data) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-grow overflow-auto">
        {item.data.title && (
          <h2 className="text-2xl font-bold mb-4">{item.data.title}</h2>
        )}

        {item.data.imageUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={item.data.imageUrl}
              alt={item.data.title || "Content"}
              className="max-h-[50vh] w-auto object-contain rounded-lg shadow-md"
            />
          </div>
        )}

        {(item.data.content || item.data.description) && (
          <div className="text-lg text-gray-700 leading-relaxed mb-6">
            {item.data.content || item.data.description}
          </div>
        )}

        {item.type === "question" && renderOptions()}
      </div>
    </div>
  );
};

// Main Preview Page Component
const PreviewPage = () => {
  const [orderedItems, setOrderedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBoxAnimation, setShowBoxAnimation] = useState(false);
  const { quizId } = useParams();
  const token = localStorage.getItem("token");

  const fetchQuizData = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const quizData = response.data;
      if (quizData.order && Array.isArray(quizData.order)) {
        const orderedContent = quizData.order
          .map((item) => {
            if (item.type === "slide") {
              const slideData = quizData.slides.find((s) => s._id === item.id);
              return slideData ? { ...item, data: slideData } : null;
            } else {
              const questionData = quizData.questions.find(
                (q) => q._id === item.id
              );
              return questionData ? { ...item, data: questionData } : null;
            }
          })
          .filter(Boolean);
        setOrderedItems(orderedContent);
      } else {
        const defaultOrder = [
          ...(quizData.slides || []).map((slide) => ({
            id: slide._id,
            type: "slide",
            data: slide,
          })),
          ...(quizData.questions || []).map((question) => ({
            id: question._id,
            type: "question",
            data: question,
          })),
        ];
        setOrderedItems(defaultOrder);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

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

  const startPresentation = () => {
    setPresentationMode(true);
    setShowBoxAnimation(true);
    setTimeout(() => {
      setShowBoxAnimation(false);
    }, 1000);
  };

  const exitPresentation = () => {
    setPresentationMode(false);
  };

  const navigatePresentation = (direction) => {
    const newIndex = direction === 'next' 
      ? currentIndex + 1 
      : currentIndex - 1;
      
    if (newIndex >= 0 && newIndex < orderedItems.length) {
      setCurrentIndex(newIndex);
    }
  };

  const renderPresentationMode = () => (
    <div className="fixed inset-0 bg-[#262626] z-50">
      <div className="absolute top-0 left-0 right-0 bg-[#1a1a1a] px-6 py-3 flex justify-between items-center">
        <span className="text-gray-300 font-medium">
          {orderedItems[currentIndex]?.type === "question"
            ? "Question"
            : "Slide"}{" "}
          {currentIndex + 1}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            {currentIndex + 1} / {orderedItems.length}
          </span>
          <button
            onClick={exitPresentation}
            className="text-gray-400 hover:text-white transition-colors"
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
              {orderedItems[currentIndex]?.data?.title && (
                <div className={`px-8 py-4 ${
                  orderedItems[currentIndex].type === "question"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700"
                    : "bg-gradient-to-r from-purple-600 to-purple-700"
                }`}>
                  <h2 className="text-2xl font-semibold text-white">
                    {orderedItems[currentIndex].data.title}
                  </h2>
                </div>
              )}

              <div className="flex-1 overflow-auto">
                <QuizContent 
                  item={orderedItems[currentIndex]} 
                  inPresentation={true}
                />
              </div>
            </div>
          </motion.div>

          <div className="absolute left-4">
            <button
              onClick={() => navigatePresentation("prev")}
              disabled={currentIndex === 0}
              className={`
                p-3 rounded-full transition-all
                ${
                  currentIndex === 0
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }
              `}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="absolute right-4">
            <button
              onClick={() => navigatePresentation("next")}
              disabled={currentIndex === orderedItems.length - 1}
              className={`
                p-3 rounded-full transition-all
                ${
                  currentIndex === orderedItems.length - 1
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }
              `}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / orderedItems.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Preview</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={startPresentation}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            disabled={loading || orderedItems.length === 0}
          >
            <Play className="w-5 h-5" />
            Start Presentation
          </button>
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 bg-gray-50 border-r overflow-y-auto p-4">
            <div className="space-y-3">
              {orderedItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentIndex === index
                      ? "bg-blue-50 border-blue-300"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {item.type === "question"
                      ? `Question ${index + 1}`
                      : `Slide ${index + 1}`}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {item.data.title}
                  </div>
                  {item.data.imageUrl && (
                    <div className="mt-2 h-20 flex items-center justify-center">
                      <img
                        src={item.data.imageUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white">
            <div className="h-full border-l">
              {orderedItems[currentIndex] && (
                <QuizContent 
                  item={orderedItems[currentIndex]} 
                  inPresentation={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {presentationMode && renderPresentationMode()}

      <AnimatePresence>
        {showBoxAnimation && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PreviewPage;