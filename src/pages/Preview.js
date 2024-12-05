import React, { useState, useEffect } from 'react';
import { X, Presentation, Play } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const PreviewPage = () => {
  const [slides, setSlides] = useState([]);
  const [activeTab, setActiveTab] = useState('slides');
  const [loading, setLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [showBoxAnimation, setShowBoxAnimation] = useState(false);
  const { quizId } = useParams();
  const token = localStorage.getItem('token');

  const fetchSlides = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}/slides`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSlides(response.data);
    } catch (error) {
      console.error('Error fetching slides:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchSlides();
      setLoading(false);
    };
    fetchData();
  }, [quizId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!presentationMode) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Right':
          navigatePresentation('next');
          break;
        case 'ArrowLeft':
        case 'Left':
          navigatePresentation('prev');
          break;
        case 'Escape':
          exitPresentation();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [presentationMode, currentPresentationIndex, slides]);

  const startPresentation = () => {
    setPresentationMode(true);
    setCurrentPresentationIndex(0);
    setShowBoxAnimation(true);

    setTimeout(() => {
      setShowBoxAnimation(false);
    }, 1000);
  };

  const exitPresentation = () => {
    setPresentationMode(false);
    setCurrentPresentationIndex(0);
  };

  const navigatePresentation = (direction) => {
    if (direction === 'next' && currentPresentationIndex < slides.length - 1) {
      setCurrentPresentationIndex((prev) => prev + 1);
    } else if (direction === 'prev' && currentPresentationIndex > 0) {
      setCurrentPresentationIndex((prev) => prev - 1);
    }
  };

  const renderBoxAnimation = () => {
    if (!showBoxAnimation) return null;

    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
        <div
          className="w-0 h-0 border-[24px] mt-1 border-blue-500 opacity-75 animate-[box-expand_1s_ease-out]"
          style={{
            transformOrigin: 'center',
          }}
        />
      </div>
    );
  };

  const renderPresentationContent = () => {
    const item = slides[currentPresentationIndex];
    if (!item) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <button onClick={exitPresentation} className="text-gray-600 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center text-lg font-semibold">Presentation Mode</div>
          <div className="text-gray-500">
            {currentPresentationIndex + 1} / {slides.length}
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center p-8 overflow-auto relative">
          <div className="max-w-3xl w-full text-center border-4 border-black-500 p-8 rounded-lg shadow-2xl">
            {item.title && <h2 className="text-2xl font-bold mb-4">{item.title}</h2>}
            {item.content && <p className="text-xl mb-4">{item.content}</p>}
            {item.imageUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={item.imageUrl}
                  alt={item.title || 'Slide Image'}
                  className="max-w-full max-h-[50vh] object-contain rounded-md"
                />
              </div>
            )}
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={() => navigatePresentation('prev')}
              disabled={currentPresentationIndex === 0}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => navigatePresentation('next')}
              disabled={currentPresentationIndex === slides.length - 1}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center p-4 border-b">
        <button
          onClick={startPresentation}
          className="flex items-center bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          disabled={loading || slides.length === 0}
        >
          <Play className="w-5 h-5 mr-1" />
          Start Presentation
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Slides</h2>
            {slides.length === 0 ? (
              <p className="text-gray-500">No slides available.</p>
            ) : (
              slides.map((slide, index) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{slide.title}</h3>
                  <p className="mb-2">{slide.content}</p>
                  {slide.imageUrl && (
                    <img src={slide.imageUrl} alt={slide.title} className="max-w-full rounded-md" />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {presentationMode && renderPresentationContent()}
      {renderBoxAnimation()}
    </div>
  );
};

export default PreviewPage;
