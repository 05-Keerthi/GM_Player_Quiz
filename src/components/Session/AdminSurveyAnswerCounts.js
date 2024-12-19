import React, { useState, useEffect } from 'react';

const AdminSurveyAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});
  const [totalResponses, setTotalResponses] = useState(0);

  // Initialize counts when question changes
  useEffect(() => {
    if (currentItem?.options) {
      const initialCounts = {};
      currentItem.options.forEach(option => {
        initialCounts[option._id] = 0;
      });
      setOptionCounts(initialCounts);
      setTotalResponses(0);
    }
  }, [currentItem?.options]);

  // Socket event listener
  useEffect(() => {
    if (socket && currentItem?._id) {
      const handleAnswerSubmitted = (data) => {
        if (data.questionId === currentItem._id) {
          setOptionCounts(prev => {
            const newCounts = { ...prev };
            const option = currentItem.options.find(opt => opt.text === data.answer);
            if (option) {
              newCounts[option._id] = (newCounts[option._id] || 0) + 1;
            }
            return newCounts;
          });
          setTotalResponses(prev => prev + 1);
        }
      };

      socket.on('survey-answer-submitted', handleAnswerSubmitted);
      return () => socket.off('survey-answer-submitted', handleAnswerSubmitted);
    }
  }, [socket, currentItem]);

  if (!currentItem || !currentItem.options) {
    return null;
  }

  const bgColors = [
    'bg-red-300',
    'bg-green-200',
    'bg-yellow-200',
    'bg-blue-200',
    'bg-purple-200',
    'bg-pink-200',
    'bg-indigo-200',
    'bg-orange-200',
  ];

  return (
    <div className="mb-4"> 
      {/* Individual option counters */}
      <div className="flex flex-row justify-end gap-4 pr-2">
        {currentItem.options.map((option, index) => (
          <div
            key={option._id}
            className={`${bgColors[index % bgColors.length]} p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md`}
          >
            {optionCounts[option._id] || 0}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSurveyAnswerCounts;