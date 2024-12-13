import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

const ContentDisplay = ({
  item,
  isAdmin,
  onNext,
  onSubmitAnswer,
  timeLeft,
  isLastItem,
  onEndSession,
  isSessionEnded,
  sessionType = "quiz",
  submittedAnswers = [],
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setOpenEndedAnswer("");
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);
  }, [item]);

  useEffect(() => {
    if (timeLeft === 0 && sessionType === "quiz") {
      setIsTimeUp(true);
    }
  }, [timeLeft, sessionType]);

  const bgColors = [
    "bg-red-300",
    "bg-green-200",
    "bg-yellow-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-pink-200",
    "bg-indigo-200",
    "bg-orange-200",
  ];

  const isSlide = sessionType === "quiz" && item?.type === "bullet_points";
  const isOpenEnded = item?.type === "open_ended";

  const handleOpenEndedSubmit = () => {
    if (!isAdmin && openEndedAnswer.trim() && !isTimeUp && !isAnswerSubmitted) {
      onSubmitAnswer?.({
        type: "open_ended",
        answer: openEndedAnswer.trim(),
        questionId: item._id,
      });
      setIsAnswerSubmitted(true);
    }
  };

  const renderOpenEndedQuestion = () => (
    <div className="space-y-4">
      <h3 className="text-xl">{item?.title}</h3>
      {item?.imageUrl && (
        <img
          src={item.imageUrl}
          alt="Question"
          className="w-full max-h-64 object-contain rounded-lg"
        />
      )}
      {isAdmin ? (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Submitted Answers:</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {submittedAnswers.map((answer, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded border border-gray-200"
              >
                {answer}
              </div>
            ))}
            {submittedAnswers.length === 0 && (
              <p className="text-gray-500 italic">No answers submitted yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={openEndedAnswer}
            onChange={(e) => setOpenEndedAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            disabled={isTimeUp || isAnswerSubmitted}
          />
          <button
            onClick={handleOpenEndedSubmit}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg 
              ${
                isTimeUp || isAnswerSubmitted
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }
            `}
            disabled={isTimeUp || isAnswerSubmitted || !openEndedAnswer.trim()}
          >
            Submit Answer
          </button>
          {isAnswerSubmitted && (
            <p className="text-green-600 font-medium text-center">
              Answer submitted successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );

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

  const renderOptions = () => (
    <div className="space-y-4">
      <h3 className="text-xl mb-4">{item?.title}</h3>
      {item?.imageUrl && (
        <img
          src={item.imageUrl}
          alt="Question"
          className="w-full max-h-64 object-contain rounded-lg mb-4"
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        {item?.options?.map((option, index) => {
          const isQuizOption = sessionType === "quiz";
          const isDisabled = isQuizOption
            ? timeLeft === 0 || selectedOption || isTimeUp
            : false;
  
          return (
            <button
              key={option._id || index}
              onClick={() => {
                if (!isAdmin && !isDisabled) {
                  setSelectedOption(option);
                  onSubmitAnswer?.(option);
                }
              }}
              className={`p-4 text-lg rounded-lg border transition-all
                ${bgColors[index % bgColors.length]} 
                ${
                  !isAdmin && selectedOption === option
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "hover:brightness-95"
                }
                ${
                  isAdmin && isQuizOption && option.isCorrect
                    ? "ring-2 ring-green-500 border-green-500"
                    : ""
                }
                ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}
              `}
              disabled={isDisabled}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );

  
  if (isSessionEnded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {sessionType === "survey" ? "Survey" : "Quiz"} Completed!
        </h2>
        {isAdmin && (
          <button
            onClick={onEndSession}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End {sessionType === "survey" ? "Survey" : "Quiz"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{isSlide ? "Slide" : "Question"}</h2>
        {!isSlide && sessionType === "quiz" && (
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

      {isSlide
        ? renderSlide()
        : isOpenEnded
        ? renderOpenEndedQuestion()
        : renderOptions()}

      {isAdmin && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastItem ? "End" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;
