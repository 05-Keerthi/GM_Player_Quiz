// 
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
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    // Reset states when item changes
    setSelectedOption(null);
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);
    setTimerActive(true);
  }, [item]);

  useEffect(() => {
    if (timeLeft === 0 && timerActive) {
      setIsTimeUp(true);
      setTimerActive(false);
      if (!isAnswerSubmitted && !isAdmin && selectedOption) {
        onSubmitAnswer?.(selectedOption);
      }
    }
  }, [timeLeft, isAnswerSubmitted, isAdmin, onSubmitAnswer, selectedOption, timerActive]);

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

  const renderSubmissionStats = () => {
    if (!isAdmin || !item?.options) return null;

    const totalSubmissions = submittedAnswers.length;
    const optionCounts = item.options.reduce((acc, option) => {
      const count = submittedAnswers.filter(
        answer => answer.answer._id === option._id
      ).length;
      acc[option._id] = {
        count,
        percentage: totalSubmissions ? ((count / totalSubmissions) * 100).toFixed(1) : 0
      };
      return acc;
    }, {});

    return (
      <div className="mt-6 space-y-4">
        <h4 className="font-medium text-lg">Response Statistics</h4>
        <div className="grid gap-3">
          {item.options.map((option, index) => (
            <div key={option._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${bgColors[index % bgColors.length]}`}></span>
                <span>{option.text}</span>
                {option.isCorrect && (
                  <span className="text-green-600 text-sm font-medium">(Correct)</span>
                )}
              </div>
              <div className="text-right">
                <span className="font-medium">{optionCounts[option._id]?.count || 0}</span>
                <span className="text-gray-500 ml-2">
                  ({optionCounts[option._id]?.percentage || 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSlide = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-medium">{item?.title}</h3>
      {item?.imageUrl && (
        <div className="w-full flex justify-center">
          <img
            src={item.imageUrl}
            alt="Slide content"
            className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
          />
        </div>
      )}
      <div className="prose max-w-none">
        <p className="text-lg">{item?.description}</p>
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-medium mb-4">{item?.title}</h3>
      
      {item?.imageUrl && (
        <div className="mb-6">
          <img
            src={item.imageUrl}
            alt="Question"
            className="w-full max-h-64 object-contain rounded-lg shadow-md"
          />
        </div>
      )}

      {isAdmin && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-2">
          <p className="text-gray-600"><span className="font-bold">Description:</span> {item?.description}</p>
          <p className="text-gray-600"><span className="font-bold">Dimension:</span> {item?.dimension}</p>
          {item?.timer && (
            <p className="text-gray-600"><span className="font-bold">Timer:</span> {item?.timer}s</p>
          )}
        </div>
      )}

      {!isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                ${selectedOption?._id === option._id ? "ring-2 ring-blue-500 border-blue-500" : "hover:brightness-95 hover:shadow-md"}
                ${(timeLeft === 0 || selectedOption || isTimeUp) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                flex items-center justify-center text-center min-h-[60px]
              `}
              disabled={timeLeft === 0 || selectedOption || isTimeUp}
            >
              {option.text}
            </button>
          ))}
        </div>
      ) : (
        renderSubmissionStats()
      )}

      {!isAdmin && isAnswerSubmitted && (
        <div className="text-center mt-6">
          <p className="text-green-600 font-medium">Response submitted successfully!</p>
        </div>
      )}
    </div>
  );

  if (isSurveyEnded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
        <p className="text-gray-600 mb-6">Thank you for participating in the survey.</p>
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {item?.type === "slide" ? "Slide" : "Question"}
        </h2>
        {item?.timer && (
          <div className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-gray-600" />
            <span className={`font-medium text-lg ${timeLeft <= 5 ? "text-red-600" : "text-gray-600"}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {item?.type === "slide" ? renderSlide() : renderQuestion()}

      {isAdmin && (
        <div className="flex justify-end mt-6">
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLastItem ? "End Survey" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyContentDisplay;