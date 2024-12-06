// components/AnswerCountDisplay.js
import React, { useState, useEffect } from "react";
import { useAnswerContext } from "../context/answerContext";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  });

  const { getAnswerCounts } = useAnswerContext();

  // Fetch counts when question changes
  useEffect(() => {
    if (currentItem?._id && currentItem.type !== "bullet_points") {
      fetchAnswerCounts();
    }
  }, [currentItem?._id]);

  // Listen for socket events
  useEffect(() => {
    if (socket && currentItem?._id) {
      // Listen for count updates
      socket.on("answer-counts-updated", (data) => {
        if (data.questionId === currentItem._id) {
          setOptionCounts(data.counts);
        }
      });

      // Request initial counts
      socket.emit("get-answer-counts", {
        sessionId,
        questionId: currentItem._id,
      });

      return () => {
        socket.off("answer-counts-updated");
      };
    }
  }, [socket, currentItem]);

  const fetchAnswerCounts = async () => {
    try {
      const response = await getAnswerCounts(sessionId, currentItem._id);
      console.log("Answer counts response:", response);

      // Map the answers to option letters (A, B, C, D)
      const newCounts = { A: 0, B: 0, C: 0, D: 0 };
      if (currentItem?.options) {
        currentItem.options.forEach((option, index) => {
          const letter = String.fromCharCode(65 + index); // Convert 0,1,2,3 to A,B,C,D
          // Count how many answers match this option's text
          const count =
            response?.answers?.filter((answer) => answer.answer === option.text)
              .length || 0;
          newCounts[letter] = count;
        });
      }

      setOptionCounts(newCounts);
    } catch (error) {
      console.error("Error fetching answer counts:", error);
    }
  };

  if (!currentItem || currentItem.type === "bullet_points") {
    return null;
  }

  return (
    <div className="flex flex-row justify-end gap-4 mb-2 pr-2">
      <div className="bg-red-300 p-4 rounded-full w-12 h-12 flex items-center justify-center relative">
        {optionCounts.A}
      </div>
      <div className="bg-green-200 p-4 rounded-full w-12 h-12 flex items-center justify-center relative">
        {optionCounts.B}
      </div>
      <div className="bg-yellow-200 p-4 rounded-full w-12 h-12 flex items-center justify-center relative">
        {optionCounts.C}
      </div>
      <div className="bg-blue-200 p-4 rounded-full w-12 h-12 flex items-center justify-center relative">
        {optionCounts.D}
      </div>
    </div>
  );
};

export default AdminAnswerCounts;
