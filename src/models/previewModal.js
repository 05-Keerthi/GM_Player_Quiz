import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Presentation,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  ListChecks,
} from 'lucide-react';

const PreviewModal = ({
  isOpen,
  onClose,
  slides = [],
  questions = [],
}) => {
  const [activeTab, setActiveTab] = useState('slides');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const safeSlides = Array.isArray(slides) ? slides : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const presentationContent = [...safeSlides, ...safeQuestions];

  useEffect(() => {
    if (!isOpen) {
      setCurrentSlideIndex(0);
      setIsPresentationMode(false);
      setIsFullscreen(false);
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (isPresentationMode) {
          setIsPresentationMode(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, isPresentationMode, onClose]);

  if (!isOpen) return null;

  const navigateSlide = (direction) => {
    if (direction === 'next' && currentSlideIndex < presentationContent.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (direction === 'prev' && currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderPresentationMode = () => {
    if (presentationContent.length === 0) return null;

    const currentItem = presentationContent[currentSlideIndex] || {};

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`relative ${
          isFullscreen ? 'fixed inset-0 z-[100] bg-black bg-opacity-90' : ''
        }`}
      >
        <div
          className={`${
            isFullscreen
              ? 'w-full h-full flex flex-col justify-center items-center p-8'
              : 'max-w-4xl mx-auto p-4'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                setIsPresentationMode(false);
                setIsFullscreen(false);
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>

          <motion.div
            key={currentSlideIndex}
            className={`bg-white rounded-xl shadow-2xl overflow-hidden ${
              isFullscreen ? 'w-full max-w-4xl' : 'w-full'
            }`}
          >
            <div className="p-6 border-b bg-gray-50">
              <h2
                className={`font-bold text-gray-800 ${
                  isFullscreen ? 'text-2xl' : 'text-xl'
                }`}
              >
                {currentItem.title ||
                  (currentItem.type === 'mcq' ? 'Multiple Choice Question' : 'Untitled Slide')}
              </h2>
            </div>

            <div
              className={`p-6 ${
                isFullscreen ? 'text-xl leading-relaxed' : 'text-base'
              }`}
            >
              {currentItem.imageUrl && (
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.title || 'Slide/Question Image'}
                  className={`mb-4 mx-auto object-contain rounded-lg shadow-md ${
                    isFullscreen ? 'max-h-[60vh]' : 'max-h-[40vh]'
                  }`}
                />
              )}

              {currentItem.content && (
                <div className="text-gray-700 mb-4">
                  <p>{currentItem.content}</p>
                </div>
              )}

              {currentItem.bulletPoints && (
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  {currentItem.bulletPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              )}

              {currentItem.type === 'MultipleChoice' && (
                <div>
                  <p className="text-gray-700 mb-4">{currentItem.question}</p>
                  <div className="space-y-2">
                    {currentItem.options.map((option, idx) => (
                      <div
                        key={idx}
                        className={`p-2 border rounded ${
                          option.isCorrect
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <label className="flex items-center">
                          <input type="radio" name="question" />
                          <span className="ml-2">{option.text}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="mt-6 flex justify-between w-full">
            <button
              onClick={() => navigateSlide('prev')}
              disabled={currentSlideIndex === 0}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => navigateSlide('next')}
              disabled={currentSlideIndex === presentationContent.length - 1}
              className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {isPresentationMode ? (
          renderPresentationMode()
        ) : (
          <>
            {/* Header with Tabs */}
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('slides')}
                  className={`flex items-center gap-2 pb-1 ${
                    activeTab === 'slides'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Presentation className="w-5 h-5" />
                  Slides
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex items-center gap-2 pb-1 ${
                    activeTab === 'questions'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ListChecks className="w-5 h-5" />
                  Questions
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPresentationMode(true);
                    setCurrentSlideIndex(0);
                  }}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Presentation className="w-5 h-5" />
                  Start Presentation
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow overflow-auto">
              {activeTab === 'slides' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Slides Preview</h3>
                  {safeSlides.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No slides created yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {safeSlides.map((slide, index) => (
                        <div 
                          key={index} 
                          className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          {slide.imageUrl && (
                            <img 
                              src={slide.imageUrl} 
                              alt={slide.title || `Slide ${index + 1}`}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          <div className="p-3">
                            <h4 className="font-medium text-gray-800 mb-2">
                              {slide.title || `Slide ${index + 1}`}
                            </h4>
                            {slide.content && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {slide.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Questions Preview</h3>
                  {safeQuestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No questions created yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeQuestions.map((question, index) => (
                        <div 
                          key={index} 
                          className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          {question.imageUrl && (
                            <img 
                              src={question.imageUrl} 
                              alt={question.title || `Question ${index + 1} Image`}
                              className="w-full h-48 object-cover mb-4 rounded-t-lg"
                            />
                          )}
                          {question.content && (
                            <div className="px-4 mb-3 text-gray-700">
                              <p>{question.content}</p>
                            </div>
                          )}
                          <div className="px-4">
                            <h4 className="font-medium text-gray-800 mb-2">
                              Question {index + 1}
                            </h4>
                            <p className="text-gray-700 mb-3">{question.question}</p>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div 
                                  key={optIndex} 
                                  className={`p-2 rounded ${
                                    option.isCorrect 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  } border`}
                                >
                                  <label className="flex items-center">
                                    <input 
                                      type="radio" 
                                      name={`question-${index}-option`} 
                                      className="mr-2" 
                                      disabled 
                                    />
                                    {option.text}
                                    {option.isCorrect && (
                                      <span className="ml-2 text-green-600 text-sm">
                                        (Correct Answer)
                                      </span>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
export default PreviewModal;