import React, { useState, useEffect } from "react";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState([]);

  useEffect(() => {
    // Reset states when question changes
    if (currentItem?.type === "open_ended") {
      setSubmittedAnswers([]);
    } else if (currentItem?.options) {
      const initialCounts = {};
      currentItem.options.forEach((option, index) => {
        initialCounts[option.text] = 0;
      });
      setOptionCounts(initialCounts);
    }
  }, [currentItem]);

  useEffect(() => {
    if (!socket || !currentItem?._id) return;

    const handleAnswerSubmitted = (data) => {
      const { answerDetails } = data;

      if (answerDetails.questionId === currentItem._id) {
        if (currentItem.type === "open_ended") {
          setSubmittedAnswers((prev) => [...prev, answerDetails.answer]);
        } else {
          setOptionCounts((prev) => ({
            ...prev,
            [answerDetails.answer]: (prev[answerDetails.answer] || 0) + 1,
          }));
        }
      }
    };

    socket.on("answer-submitted", handleAnswerSubmitted);

    return () => socket.off("answer-submitted", handleAnswerSubmitted);
  }, [socket, currentItem]);

  if (!currentItem || currentItem.type === "bullet_points") {
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

  if (currentItem.type === "open_ended") {
    return (
      <div className="flex flex-col gap-2 mb-4">
        <div className="text-right text-gray-600 font-medium">
          Total Responses: {submittedAnswers.length}
        </div>
        <div className="bg-white rounded-lg p-4 shadow max-h-96 overflow-y-auto">
          {submittedAnswers.map((answer, index) => (
            <div
              key={index}
              className="p-2 mb-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              {answer}
            </div>
          ))}
          {submittedAnswers.length === 0 && (
            <p className="text-gray-500 italic text-center">
              No answers submitted yet
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="text-center text-gray-600 font-medium">
        Total Responses:{" "}
        {Object.values(optionCounts).reduce((a, b) => a + b, 0)}
      </div>
      <div className="flex flex-row justify-end gap-4 pr-2">
        {currentItem.options.map((option, index) => (
          <div
            key={option._id || index}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={`${
                bgColors[index % bgColors.length]
              } p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium shadow-md`}
            >
              {optionCounts[option.text] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAnswerCounts;
