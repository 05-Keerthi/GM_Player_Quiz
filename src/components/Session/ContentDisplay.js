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
  onEndQuiz,
  isQuizEnded,
  submittedAnswers = [],
  socket,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [optionCounts, setOptionCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    setSelectedOption(null);
    setOpenEndedAnswer("");
    setIsTimeUp(false);
    setIsAnswerSubmitted(false);

    // Initialize counts for poll questions
    if (item?.type === "poll") {
      const initialCounts = {};
      item.options?.forEach((_, index) => {
        initialCounts[index] = 0;
      });
      setOptionCounts(initialCounts);
      setTotalVotes(0);
    }
  }, [item]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsTimeUp(true);
    }
  }, [timeLeft]);

  // Socket event listener for poll updates
  useEffect(() => {
    if (socket && item?._id && item?.type === "poll") {
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
  }, [socket, item]);

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

  const isSlide =
    item?.type === "bullet_points" ||
    item?.type === "slide" ||
    item?.type === "classic";
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

  const renderQuestion = () => {
    const isPoll = item?.type === "poll";

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
        <div className="grid grid-cols-2 gap-4">
          {item?.options?.map((option, index) => (
            <button
              key={option._id}
              onClick={() => {
                if (!isAdmin && timeLeft > 0 && !selectedOption && !isTimeUp) {
                  setSelectedOption(option);
                  onSubmitAnswer?.(option);
                  setIsAnswerSubmitted(true);
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
                  isAdmin && option.isCorrect
                    ? "ring-2 ring-green-500 border-green-500"
                    : ""
                }
                ${
                  timeLeft === 0 || selectedOption || isTimeUp
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }
              `}
              disabled={timeLeft === 0 || selectedOption || isTimeUp}
            >
              {option.text}
            </button>
          ))}
        </div>
        {!isAdmin && isAnswerSubmitted && (
          <p className="text-green-600 font-medium text-center mt-4">
            Answer submitted successfully!
          </p>
        )}

        {/* Progress bars for poll questions */}
        {isPoll && (isAdmin || isAnswerSubmitted) && (
          <div className="mt-8">
            <div className="w-full bg-white rounded-lg p-6 shadow-md space-y-3">
              {item.options.map((option, index) => {
                const count = optionCounts[index] || 0;
                const percentage = getPercentage(count);

                return (
                  <div key={`progress-${index}`} className="relative">
                    <div className="h-12 w-full bg-gray-100 rounded-full relative">
                      <div
                        className={`h-full ${
                          bgColors[index % bgColors.length]
                        } transition-all duration-500 rounded-full absolute top-0 left-0`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 px-4 flex items-center justify-between">
                        <span className="text-gray-800 font-medium z-10">
                          {option.text}
                        </span>
                        <span className="text-gray-800 font-medium z-10">
                          {percentage}%
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
