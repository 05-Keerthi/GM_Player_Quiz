import React, { useState, useEffect } from "react";
import { useAnswerContext } from "../context/answerContext";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});
  const { getAnswerCounts } = useAnswerContext();

  // Initialize counts based on number of options
  useEffect(() => {
    if (currentItem?.options) {
      const initialCounts = {};
      currentItem.options.forEach((_, index) => {
        initialCounts[index] = 0;
      });
      setOptionCounts(initialCounts);
    }
  }, [currentItem?.options]);

  // Fetch counts when question changes
  useEffect(() => {
    if (currentItem?._id && currentItem.type !== "bullet_points") {
      fetchAnswerCounts();
    }
  }, [currentItem?._id]);

  // Listen for socket events
  useEffect(() => {
    if (socket && currentItem?._id && currentItem.type !== "bullet_points") {
      socket.on("answer-submitted", ({ answerDetails }) => {
        if (answerDetails.questionId === currentItem._id) {
          fetchAnswerCounts();
        }
      });

      return () => {
        socket.off("answer-submitted");
      };
    }
  }, [socket, currentItem]);

  const fetchAnswerCounts = async () => {
    try {
      const response = await getAnswerCounts(sessionId, currentItem._id);
      console.log("Answer counts response:", response);

      const newCounts = {};
      if (currentItem?.options) {
        currentItem.options.forEach((option, index) => {
          const count =
            response?.answers?.filter((answer) => answer.answer === option.text)
              .length || 0;
          newCounts[index] = count;
        });
      }
      setOptionCounts(newCounts);
    } catch (error) {
      console.error("Error fetching answer counts:", error);
    }
  };

  if (
    !currentItem ||
    currentItem.type === "bullet_points" ||
    !currentItem.options
  ) {
    return null;
  }

  // Background colors for different options
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
          } p-4 rounded-full w-12 h-12 flex items-center justify-center text-gray-800 font-medium`}
        >
          {optionCounts[index] || 0}
        </div>
      ))}
    </div>
  );
};

export default AdminAnswerCounts;
