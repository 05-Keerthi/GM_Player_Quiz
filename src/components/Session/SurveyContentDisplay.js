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
  isSubmitted = false,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(isSubmitted);

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

  useEffect(() => {
    setIsAnswerSubmitted(isSubmitted);
  }, [isSubmitted]);

  const isSlide = item?.type === "slide";

  const handleOptionSelect = (option) => {
    if (isAdmin || isTimeUp) return;

    if (selectedOption?._id === option._id && isAnswerSubmitted) {
      // If same option is clicked again, clear selection
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      onSubmitAnswer?.({
        type: "single_select",
        answer: "",
        questionId: item._id,
      });
    } else {
      // Select new option
      setSelectedOption(option);
      onSubmitAnswer?.({
        type: "single_select",
        answer: option.optionText,
        questionId: item._id,
      });
      setIsAnswerSubmitted(true);
    }
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
    <div className="flex flex-col h-full rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4">
        <h3 className="text-2xl font-bold text-white">{item?.title}</h3>
      </div>
      <div className="flex-1 bg-white p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {item?.imageUrl && (
            <div className="flex justify-center mb-8">
              <img
                src={item.imageUrl}
                alt="Slide"
                className="max-h-96 object-contain rounded-lg shadow-md"
              />
            </div>
          )}
          <div className="prose max-w-none">
            {item?.content?.split("\n").map(
              (paragraph, index) =>
                paragraph.trim() && (
                  <p key={index} className="text-lg mb-6 text-gray-700">
                    {paragraph}
                  </p>
                )
            )}
          </div>
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
                  <p className="text-gray-600 font-bold">Description</p>
                  <p className="text-gray-800">{item?.description}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-bold">Dimension</p>
                  <p className="text-gray-800">{item?.dimension}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-bold">Year</p>
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
        <div
          className={`grid ${
            item?.answerOptions?.length === 2
              ? "grid-cols-2"
              : "grid-cols-1 md:grid-cols-2"
          } gap-4`}
        >
          {item?.answerOptions?.map((option) => {
            const backgroundColor = option.color || "#ffffff";
            const textColor = getTextColor(backgroundColor);
            const isSelected =
              !isAdmin &&
              selectedOption?._id === option._id &&
              isAnswerSubmitted;

            return (
              <button
                key={option._id}
                onClick={() => handleOptionSelect(option)}
                style={{ backgroundColor }}
                className={`p-4 text-lg rounded-lg transition-all ${textColor}
                  ${isSelected ? "border-2 border-blue-500" : "border-0"}
                  ${!isAdmin && !isTimeUp ? "hover:opacity-90" : ""}
                  ${isTimeUp ? "opacity-60 cursor-not-allowed" : ""}
                `}
                disabled={isAdmin || isTimeUp}
              >
                {option.optionText}
              </button>
            );
          })}
        </div>

        {!isAdmin && isAnswerSubmitted && (
          <p className="text-green-600 font-medium text-center mt-4">
            {selectedOption
              ? "Answer updated successfully!"
              : "Answer submitted successfully!"}
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
    <div className="flex flex-col min-h-[calc(100vh-16rem)]">
      <div
        className={`bg-white rounded-lg shadow-lg mb-4 flex-1 ${
          !isSlide && "p-6"
        }`}
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
      </div>

      {isAdmin && (
        <div className="flex justify-end">
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
