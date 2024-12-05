import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Presentation, ChevronRight, ChevronLeft, Maximize2, Minimize2, ListChecks } from 'lucide-react';

const PreviewModal = ({ isOpen, onClose, slides = [], questions = [] }) => {
  const [activeTab, setActiveTab] = useState('slides');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const presentationContent = [...slides, ...questions];

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
    const currentItem = presentationContent[currentSlideIndex] || {};

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black bg-opacity-90' : ''}`}
      >
        <div className={`${isFullscreen ? 'w-full h-full flex flex-col justify-center items-center' : 'max-w-4xl mx-auto p-4'}`}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={onClose} className="text-gray-300 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <button onClick={toggleFullscreen} className="text-gray-300 hover:text-white">
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          <motion.div key={currentSlideIndex} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-bold text-xl mb-4">{currentItem.title || 'Untitled'}</h2>
            {currentItem.content && <p>{currentItem.content}</p>}
          </motion.div>

          <div className="mt-6 flex justify-between">
            <button onClick={() => navigateSlide('prev')} disabled={currentSlideIndex === 0} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">
              <ChevronLeft />
            </button>
            <button onClick={() => navigateSlide('next')} disabled={currentSlideIndex === presentationContent.length - 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">
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
      <motion.div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {isPresentationMode ? (
          renderPresentationMode()
        ) : (
          <>
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('slides')}
                  className={`pb-1 ${activeTab === 'slides' ? 'text-blue-600 border-b-2' : 'text-gray-500'}`}
                >
                  <Presentation />
                  Slides
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`pb-1 ${activeTab === 'questions' ? 'text-blue-600 border-b-2' : 'text-gray-500'}`}
                >
                  <ListChecks />
                  Questions
                </button>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                <X />
              </button>
            </div>
            <div className="flex-grow overflow-auto p-4">
              {activeTab === 'slides' ? (
                slides.length > 0 ? (
                  slides.map((slide, index) => (
                    <div key={index} className="border p-4 mb-4 rounded-lg">
                      <h3>{slide.title}</h3>
                    </div>
                  ))
                ) : (
                  <p>No slides available</p>
                )
              ) : questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={index} className="border p-4 mb-4 rounded-lg">
                    <h3>{question.question}</h3>
                  </div>
                ))
              ) : (
                <p>No questions available</p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PreviewModal;
