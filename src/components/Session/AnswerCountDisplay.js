import React, { useState, useEffect } from "react";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});

  // Initialize counts when question changes
  useEffect(() => {
    if (currentItem?.options) {
      const initialCounts = {};
      currentItem.options.forEach((_, index) => {
        initialCounts[index] = 0;
      });
      setOptionCounts(initialCounts);
    }
  }, [currentItem?.options]);

  // Socket event listener
  useEffect(() => {
    if (socket && currentItem?._id && currentItem.type !== "bullet_points") {
      const handleAnswerSubmitted = ({ answerDetails }) => {
        if (answerDetails.questionId === currentItem._id) {
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
        }
      };

      socket.on("answer-submitted", handleAnswerSubmitted);
      return () => socket.off("answer-submitted", handleAnswerSubmitted);
    }
  }, [socket, currentItem]);

  if (
    !currentItem ||
    currentItem.type === "bullet_points" ||
    !currentItem.options
  ) {
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

  return (
    <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
      {currentItem.options.map((_, index) => (
        <div
          key={index}
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
