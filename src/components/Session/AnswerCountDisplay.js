import React, { useState, useEffect } from "react";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});
  const [openEndedCount, setOpenEndedCount] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  // Initialize counts when question changes
  useEffect(() => {
    if (!currentItem) return;

    if (
      currentItem.type === "poll" ||
      currentItem.type === "multiple_choice" ||
      currentItem.type === "multiple_select" ||
      currentItem.type === "true_false"
    ) {
      const initialCounts = {};
      if (currentItem.type === "true_false") {
        initialCounts[0] = 0; // False
        initialCounts[1] = 0; // True
      } else if (currentItem.options) {
        currentItem.options.forEach((_, index) => {
          initialCounts[index] = 0;
        });
      }
      setOptionCounts(initialCounts);
      setTotalVotes(0);
    } else if (currentItem.type === "open_ended") {
      setOpenEndedCount(0);
    }
  }, [currentItem]);

  // Socket event listener
  useEffect(() => {
    if (!socket || !currentItem?._id || currentItem.type === "slide") return;

    const handleAnswerSubmitted = ({ answerDetails }) => {
      if (answerDetails.questionId === currentItem._id) {
        if (currentItem.type === "open_ended") {
          setOpenEndedCount((prev) => prev + 1);
        } else if (currentItem.type === "multiple_select") {
          // Handle multiple select answers
          setOptionCounts((prev) => {
            const newCounts = { ...prev };
            let selectedAnswers = [];

            // Parse the answer based on its type
            if (Array.isArray(answerDetails.answer)) {
              selectedAnswers = answerDetails.answer;
            } else if (typeof answerDetails.answer === "string") {
              try {
                selectedAnswers = JSON.parse(answerDetails.answer);
              } catch {
                selectedAnswers = [answerDetails.answer];
              }
            }

            // Update counts for each selected option
            selectedAnswers.forEach((answer) => {
              const optionIndex = currentItem.options.findIndex(
                (opt) => opt.text === answer
              );
              if (optionIndex !== -1) {
                newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
              }
            });
            return newCounts;
          });
          setTotalVotes((prev) => prev + 1);
        } else if (
          currentItem.type === "poll" ||
          currentItem.type === "multiple_choice" ||
          currentItem.type === "true_false"
        ) {
          setOptionCounts((prev) => {
            const newCounts = { ...prev };
            if (currentItem.type === "true_false") {
              const optionIndex = answerDetails.answer === "true" ? 1 : 0;
              newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
            } else if (currentItem.options) {
              const optionIndex = currentItem.options.findIndex(
                (opt) => opt.text === answerDetails.answer
              );
              if (optionIndex !== -1) {
                newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
              }
            }
            return newCounts;
          });
          setTotalVotes((prev) => prev + 1);
        }
      }
    };

    socket.on("answer-submitted", handleAnswerSubmitted);
    return () => socket.off("answer-submitted", handleAnswerSubmitted);
  }, [socket, currentItem]);

  // Early return if no currentItem or if it's a slide
  if (!currentItem || currentItem.type === "slide") {
    return null;
  }

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

  // For open-ended questions, show a single response count
  if (currentItem.type === "open_ended") {
    return (
      <div className="flex flex-row justify-end mb-2 pr-2">
        <div className="bg-blue-200 p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md">
          {openEndedCount}
        </div>
      </div>
    );
  }

  // For true/false questions, show two count circles
  if (currentItem.type === "true_false") {
    return (
      <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
        <div
          className={`${bgColors[0]} p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md`}
        >
          {optionCounts[0] || 0}
        </div>
        <div
          className={`${bgColors[1]} p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md`}
        >
          {optionCounts[1] || 0}
        </div>
      </div>
    );
  }

  // For multiple choice, multiple select or poll questions, show count circles
  if (!currentItem.options) {
    return null;
  }

  return (
    <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
      {currentItem.options.map((_, index) => (
        <div
          key={`count-${index}`}
          className={`${
            bgColors[index % bgColors.length]
          } p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md`}
        >
          {optionCounts[index] || 0}
        </div>
      ))}
    </div>
  );
};

export default AdminAnswerCounts;
