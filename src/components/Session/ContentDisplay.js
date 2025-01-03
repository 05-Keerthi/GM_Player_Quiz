import React, { useState, useEffect } from "react";
import { Timer } from "lucide-react";

const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor === '#') return '#000000';
  
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const ContentDisplay = ({
  item,
  isAdmin,
  onNext,
  onSubmitAnswer,
  timeLeft,
  isLastItem,
  onEndQuiz,
  isQuizEnded,
  submittedAnswers = [],
  socket,
  optionCounts: passedOptionCounts,
  totalVotes: passedTotalVotes,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [optionCounts, setOptionCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    setSelectedOption(null);
    setSelectedOptions([]);
    setOpenEndedAnswer("");
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);

    if (item?.type === "poll") {
      if (isAdmin && passedOptionCounts && passedTotalVotes) {
        setOptionCounts(passedOptionCounts);
        setTotalVotes(passedTotalVotes);
      } else {
        const initialCounts = {};
        item.options?.forEach((_, index) => {
          initialCounts[index] = 0;
        });
        setOptionCounts(initialCounts);
        setTotalVotes(0);
      }
    }
  }, [item, isAdmin, passedOptionCounts, passedTotalVotes]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsTimeUp(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (isAdmin && item?.type === "poll") {
      setOptionCounts(passedOptionCounts || {});
      setTotalVotes(passedTotalVotes || 0);
    }
  }, [isAdmin, passedOptionCounts, passedTotalVotes, item]);

  useEffect(() => {
    if (socket && item?._id && item?.type === "poll" && !isAdmin) {
      const handleAnswerSubmitted = ({ answerDetails }) => {
        if (answerDetails.questionId === item._id) {
          setOptionCounts((prev) => {
            const newCounts = { ...prev };
            const optionIndex = item.options.findIndex(
              (opt) => opt.text === answerDetails.answer
            );
            if (optionIndex !== -1) {
              newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
            }
            return newCounts;
          });
          setTotalVotes((prev) => prev + 1);
        }
      };

      socket.on("answer-submitted", handleAnswerSubmitted);
      return () => socket.off("answer-submitted", handleAnswerSubmitted);
    }
  }, [socket, item, isAdmin]);

  const isSlide = item?.type === "bullet_points" || item?.type === "slide" || item?.type === "classic";
  const isOpenEnded = item?.type === "open_ended";
  const isMultipleSelect = item?.type === "multiple_select";

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

  const handleOptionSelect = (option) => {
    if (isAdmin || timeLeft === 0 || isTimeUp || isAnswerSubmitted) return;

    if (isMultipleSelect) {
      setSelectedOptions((prev) => {
        const isSelected = prev.some((opt) => opt._id === option._id);
        if (isSelected) {
          return prev.filter((opt) => opt._id !== option._id);
        } else {
          return [...prev, option];
        }
      });
    } else {
      setSelectedOption(option);
      onSubmitAnswer?.(option);
      setIsAnswerSubmitted(true);
    }
  };

  const handleMultipleSelectSubmit = () => {
    if (selectedOptions.length === 0 || isTimeUp || isAnswerSubmitted) return;

    const answers = selectedOptions.map((opt) => opt.text);
    onSubmitAnswer?.({
      type: "multiple_select",
      answer: answers,
      text: JSON.stringify(answers),
    });
    setIsAnswerSubmitted(true);
  };

  const getPercentage = (count) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleOpenEndedSubmit();
              }
            }}
          />
          <button
            onClick={handleOpenEndedSubmit}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg 
              ${isTimeUp || isAnswerSubmitted ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}
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
    const isPoll = item?.type === "poll";

    return (
      <div className="space-y-4">
        <h3 className="text-xl mb-4">{item?.title}</h3>
        {isMultipleSelect && !isAdmin && !isAnswerSubmitted && (
          <p className="text-gray-600 mb-4">
            Select multiple options and click Submit when done
          </p>
        )}
        {item?.imageUrl && (
          <img
            src={item.imageUrl}
            alt="Question"
            className="w-full max-h-64 object-contain rounded-lg mb-4"
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          {item?.options?.map((option, index) => {
            const backgroundColor = option.color || '#ffffff';
            const textColor = getContrastColor(backgroundColor);
            
            return (
              <button
                key={option._id}
                onClick={() => handleOptionSelect(option)}
                style={{
                  backgroundColor,
                  color: textColor,
                }}
                className={`p-4 text-lg rounded-lg border transition-all
                  ${
                    !isAdmin &&
                    (isMultipleSelect
                      ? selectedOptions.some((opt) => opt._id === option._id)
                      : selectedOption === option)
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "hover:opacity-90"
                  }
                  ${
                    isAdmin && option.isCorrect
                      ? "ring-2 ring-green-500 border-green-500"
                      : ""
                  }
                  ${
                    (timeLeft === 0 ||
                      (!isMultipleSelect && selectedOption) ||
                      isTimeUp ||
                      isAnswerSubmitted) &&
                    !isMultipleSelect
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }
                `}
                disabled={
                  isAdmin ||
                  timeLeft === 0 ||
                  (!isMultipleSelect && selectedOption) ||
                  isTimeUp ||
                  isAnswerSubmitted
                }
              >
                {option.text}
              </button>
            );
          })}
        </div>

        {isMultipleSelect && !isAdmin && !isAnswerSubmitted && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleMultipleSelectSubmit}
              disabled={selectedOptions.length === 0 || isTimeUp}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg
                ${
                  selectedOptions.length === 0 || isTimeUp
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }
              `}
            >
              Submit Selections
            </button>
          </div>
        )}

        {!isAdmin && isAnswerSubmitted && (
          <p className="text-green-600 font-medium text-center mt-4">
            Answer submitted successfully!
          </p>
        )}

        {isPoll && (isAdmin || isAnswerSubmitted) && (
          <div className="mt-8">
            <div className="w-full bg-white rounded-lg p-6 shadow-md space-y-3">
              {item.options.map((option, index) => {
                const count = optionCounts[index] || 0;
                const percentage = getPercentage(count);
                const backgroundColor = option.color || '#ffffff';
                const textColor = getContrastColor(backgroundColor);

                return (
                  <div key={`progress-${index}`} className="relative">
                    <div className="h-12 w-full bg-gray-100 rounded-full relative">
                      <div
                        className="h-full transition-all duration-500 rounded-full absolute top-0 left-0"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor,
                        }}
                      />
                      <div className="absolute inset-0 px-4 flex items-center justify-between">
                        <span style={{ color: percentage > 50 ? textColor : '#1f2937' }} className="font-medium z-10">
                          {option.text}
                        </span>
                        <span style={{ color: percentage > 50 ? textColor : '#1f2937' }} className="font-medium z-10">
                          {percentage}% ({count})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isQuizEnded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed!</h2>
        {isAdmin && (
          <button
            onClick={onEndQuiz}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            End quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${isSlide ? "" : "p-6"} mb-6`}>
      {!isSlide && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Question</h2>
          <div className="flex items-center gap-2 text-lg">
            <Timer className="w-6 h-6" />
            <span className={`font-medium ${timeLeft <= 5 ? "text-red-600" : ""}`}>
              {timeLeft}s
            </span>
          </div>
        </div>
      )}

      {isSlide
        ? renderSlide()
        : isOpenEnded
        ? renderOpenEndedQuestion()
        : renderQuestion()}

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