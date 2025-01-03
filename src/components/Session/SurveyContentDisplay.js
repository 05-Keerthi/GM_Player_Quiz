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
    setSelectedOption(null);
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);
  }, [item]);

  useEffect(() => {
    if (timeLeft === 0 && !isSlide) {
      setIsTimeUp(true);
    }
  }, [timeLeft]);

  const isSlide = item?.type === "slide";

  const handleOptionSelect = (option) => {
    if (isAdmin || isTimeUp || isAnswerSubmitted) return;

    setSelectedOption(option);
    onSubmitAnswer?.({
      type: "single_select",
      answer: option.optionText,
      questionId: item._id,
    });
    setIsAnswerSubmitted(true);
  };

  const getTextColor = (backgroundColor) => {
    if (!backgroundColor) return "text-gray-700";

    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "text-gray-700" : "text-white";
  };

  const renderSlide = () => (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-lg">
        <h3 className="text-2xl font-bold text-white">{item?.title}</h3>
      </div>
      <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        {item?.imageUrl && (
          <div className="flex justify-center">
            <img
              src={item.imageUrl}
              alt="Slide"
              className="max-h-[40vh] object-contain rounded-lg shadow-md"
            />
          </div>
        )}
        <div className="prose max-w-none flex-1">
          {item?.content?.split("\n").map(
            (paragraph, index) =>
              paragraph.trim() && (
                <p key={index} className="text-lg mb-4">
                  {paragraph}
                </p>
              )
          )}
        </div>
      </div>
    </div>
  );

  const renderQuestion = () => {
    if (isAdmin) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">{item?.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Description</p>
                  <p className="text-gray-800">{item?.description}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dimension</p>
                  <p className="text-gray-800">{item?.dimension}</p>
                </div>
                <div>
                  <p className="text-gray-600">Year</p>
                  <p className="text-gray-800">{item?.year}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {item?.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt="Question"
                  className="max-h-96 w-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-xl mb-4">{item?.title}</h3>
        {item?.imageUrl && (
          <img
            src={item.imageUrl}
            alt="Question"
            className="w-full max-h-64 object-contain rounded-lg mb-4"
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {item?.answerOptions?.map((option) => {
            const backgroundColor = option.color || "#ffffff";
            const textColor = getTextColor(backgroundColor);

            return (
              <button
                key={option._id}
                onClick={() => handleOptionSelect(option)}
                style={{ backgroundColor }}
                className={`p-4 text-lg rounded-lg border border-gray-200 transition-all ${textColor}
                  ${
                    !isAdmin && selectedOption?._id === option._id
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "hover:opacity-90"
                  }
                  ${
                    isTimeUp || isAnswerSubmitted
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }
                `}
                disabled={isAdmin || isTimeUp || isAnswerSubmitted}
              >
                {option.optionText}
              </button>
            );
          })}
        </div>

        {!isAdmin && isAnswerSubmitted && (
          <p className="text-green-600 font-medium text-center mt-4">
            Answer submitted successfully!
          </p>
        )}
      </div>
    );
  };

  if (isSurveyEnded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Survey Completed!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for participating in the survey.
        </p>
        {isAdmin && (
          <button
            onClick={onEndSurvey}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End survey
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg ${isSlide ? "" : "p-6"} mb-6`}
    >
      {!isSlide && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Question</h2>
          <div className="flex items-center gap-2 text-lg">
            <Timer className="w-6 h-6" />
            <span
              className={`font-medium ${timeLeft <= 5 ? "text-red-600" : ""}`}
            >
              {timeLeft}s
            </span>
          </div>
        </div>
      )}

      {isSlide ? renderSlide() : renderQuestion()}

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

export default SurveyContentDisplay;