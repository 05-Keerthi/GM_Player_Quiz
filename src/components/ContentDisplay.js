// ContentDisplay.js
import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

const ContentDisplay = ({
  item,
  isAdmin,
  onNext,
  onSubmitAnswer,
  timeLeft,
  isLastItem,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    // Reset states when new item is received
    setSelectedOption(null);
    setIsTimeUp(false);
  }, [item]);

  useEffect(() => {
    // Set time up when timer reaches 0
    if (timeLeft === 0) {
      setIsTimeUp(true);
    }
  }, [timeLeft]);

  const isSlide = item?.type === "bullet_points";

  const renderSlide = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">{item?.title}</h3>
      {item?.imageUrl && (
        <img
          src={item.imageUrl}
          alt="Slide"
          className="w-full max-h-64 object-contain rounded-lg"
        />
      )}
      <div className="prose max-w-none">
        <p className="text-lg whitespace-pre-wrap">{item?.content}</p>
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="space-y-6">
      <h3 className="text-xl">{item?.title}</h3>
      {item?.imageUrl && (
        <img
          src={item.imageUrl}
          alt="Question"
          className="w-full max-h-64 object-contain rounded-lg"
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        {item?.options?.map((option) => (
          <button
            key={option._id}
            onClick={() => {
              if (!isAdmin && timeLeft > 0 && !selectedOption && !isTimeUp) {
                setSelectedOption(option);
                onSubmitAnswer?.(option);
              }
            }}
            className={`p-4 text-lg rounded-lg border transition-all
              ${
                isAdmin && option.isCorrect
                  ? "bg-green-100 border-green-500"
                  : ""
              }
              ${
                !isAdmin && selectedOption === option
                  ? "bg-blue-100 border-blue-500"
                  : "hover:bg-gray-50"
              }
              ${
                timeLeft === 0 || selectedOption || isTimeUp
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }
            `}
            disabled={timeLeft === 0 || selectedOption || isTimeUp}
          >
            {option.text}
          </button>
        ))}
      </div>
      {/* Status Messages */}
      {!isAdmin && (
        <div className="mt-4 text-center">
          {isTimeUp && !selectedOption && (
            <p className="text-red-600 font-medium">
              Time's up! You can no longer submit an answer.
            </p>
          )}
          {selectedOption && (
            <p className="text-green-600 font-medium">Answer submitted!</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{isSlide ? "Slide" : "Question"}</h2>
        {!isSlide && (
          <div className="flex items-center gap-2 text-lg">
            <Timer className="w-6 h-6" />
            <span
              className={`font-medium ${timeLeft <= 5 ? "text-red-600" : ""}`}
            >
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {isSlide ? renderSlide() : renderQuestion()}

      {isAdmin && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastItem ? "End Quiz" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;
