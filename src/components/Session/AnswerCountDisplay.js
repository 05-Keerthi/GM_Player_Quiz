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
        initialCounts["false"] = 0; // False
        initialCounts["true"] = 0; // True
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
        } else if (currentItem.type === "true_false") {
          setOptionCounts((prev) => {
            const newCounts = { ...prev };
            // Directly use the answer value as the key
            const answer = answerDetails.answer.toLowerCase();
            newCounts[answer] = (newCounts[answer] || 0) + 1;
            return newCounts;
          });
          setTotalVotes((prev) => prev + 1);
        } else if (currentItem.type === "poll" || currentItem.type === "multiple_choice") {
          setOptionCounts((prev) => {
            const newCounts = { ...prev };
            const optionIndex = currentItem.options.findIndex(
              (opt) => opt.text === answerDetails.answer
            );
            if (optionIndex !== -1) {
              newCounts[optionIndex] = (newCounts[optionIndex] || 0) + 1;
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

  // Function to get contrast color for text
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return "text-gray-800";
    
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "text-gray-800" : "text-white";
  };

  // Early return if no currentItem or if it's a slide
  if (!currentItem || currentItem.type === "slide") {
    return null;
  }

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

  // For true/false questions, show two count circles with option colors
  if (currentItem.type === "true_false") {
    return (
      <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
        {currentItem.options.map((option, index) => (
          <div
            key={`count-${index}`}
            className={`p-4 rounded-full w-12 h-12 flex items-center justify-center font-medium shadow-md ${getContrastColor(
              option.color
            )}`}
            style={{ backgroundColor: option.color || "#ffffff" }}
          >
            {optionCounts[option.text.toLowerCase()] || 0}
          </div>
        ))}
      </div>
    );
  }

  // For multiple choice, multiple select or poll questions, show count circles with option colors
  if (!currentItem.options) {
    return null;
  }

  return (
    <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
      {currentItem.options.map((option, index) => (
        <div
          key={`count-${index}`}
          className={`p-4 rounded-full w-12 h-12 flex items-center justify-center font-medium shadow-md ${getContrastColor(
            option.color
          )}`}
          style={{ backgroundColor: option.color || "#ffffff" }}
        >
          {optionCounts[index] || 0}
        </div>
      ))}
    </div>
  );
};

export default AdminAnswerCounts;