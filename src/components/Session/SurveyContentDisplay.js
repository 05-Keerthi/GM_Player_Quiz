// SurveyContentDisplay.js
import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

const SurveyContentDisplay = ({
  item,
  isAdmin,
  onNext,
  onSubmitAnswer,
  timeLeft,
  isLastItem,
  onEndSurvey,
  isSurveyEnded,
  submittedAnswers = [],
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    // Reset states when question changes
    setSelectedOption(null);
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);
  }, [item]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsTimeUp(true);
      if (!isAnswerSubmitted && !isAdmin && selectedOption) {
        onSubmitAnswer?.(selectedOption);
      }
    }
  }, [timeLeft, isAnswerSubmitted, isAdmin, onSubmitAnswer, selectedOption]);

  // Array of background colors for options
  const bgColors = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-orange-100",
    "bg-teal-100",
  ];

  const renderQuestion = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-medium mb-4">{item?.title}</h3>
      {/* Admin statistics */}

     {isAdmin &&(
        <div className="mt-8 space-y-4">
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-gray-600 font-bold">Description: <span className="font-normal">{item?.description}</span></p>
          <p className="text-gray-600 font-bold">Dimension: <span className="font-normal">{item?.dimension}</span></p>
        </div>
      </div>
     )}

      {/* Only show options for non-admin users */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item?.imageUrl && (
            <div className="mb-6">
              <img
                src={item.imageUrl}
                alt="Question"
                className="w-full max-h-64 object-contain rounded-lg shadow-md"
              />
            </div>
          )}
          {item?.options?.map((option, index) => (
            <button
              key={option._id}
              onClick={() => {
                if (timeLeft > 0 && !selectedOption && !isTimeUp) {
                  setSelectedOption(option);
                  onSubmitAnswer?.(option);
                  setIsAnswerSubmitted(true);
                }
              }}
              className={`
                p-4 text-lg rounded-lg border transition-all duration-200
                ${bgColors[index % bgColors.length]}
                ${
                  selectedOption?._id === option._id
                    ? "ring-2 ring-blue-500 border-blue-500"
                    : "hover:brightness-95 hover:shadow-md"
                }
                ${
                  timeLeft === 0 || selectedOption || isTimeUp
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }
                flex items-center justify-center text-center min-h-[60px]
              `}
              disabled={timeLeft === 0 || selectedOption || isTimeUp}
            >
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Response feedback for non-admin users */}
      {!isAdmin && isAnswerSubmitted && (
        <div className="text-center mt-6">
          <p className="text-green-600 font-medium">
            Response submitted successfully!
          </p>
        </div>
      )}
    </div>
  );

  // Survey ended state
  if (isSurveyEnded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for participating in the survey.
        </p>
        {isAdmin && (
          <button
            onClick={onEndSurvey}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            End Survey
          </button>
        )}
      </div>
    );
  }

  // Main question display
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Question</h2>
        <div className="flex items-center gap-2">
          <Timer className="w-6 h-6 text-gray-600" />
          <span
            className={`font-medium text-lg ${
              timeLeft <= 5 ? "text-red-600" : "text-gray-600"
            }`}
          >
            {timeLeft}s
          </span>
        </div>
      </div>

      {renderQuestion()}

      {/* Admin controls */}
      {isAdmin && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {isLastItem ? "End Survey" : "Next Question"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyContentDisplay;
