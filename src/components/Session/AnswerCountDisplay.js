import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminAnswerCounts = ({ sessionId, currentItem, socket }) => {
  const [optionCounts, setOptionCounts] = useState({});
  const [openEndedCount, setOpenEndedCount] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);

  // Initialize counts when question changes
  useEffect(() => {
    if (currentItem?.options) {
      const initialCounts = {};
      currentItem.options.forEach((_, index) => {
        initialCounts[index] = 0;
      });
      setOptionCounts(initialCounts);
      setTotalVotes(0);
    } else if (currentItem?.type === "open_ended") {
      setOpenEndedCount(0);
    }
  }, [currentItem]);

  // Socket event listener
  useEffect(() => {
    if (socket && currentItem?._id && currentItem.type !== "bullet_points") {
      const handleAnswerSubmitted = ({ answerDetails }) => {
        if (answerDetails.questionId === currentItem._id) {
          if (currentItem.type === "open_ended") {
            setOpenEndedCount((prev) => prev + 1);
          } else if (currentItem.type === "multiple_select") {
            // For multiple select, answer will be an array of selected options
            setOptionCounts((prev) => {
              const newCounts = { ...prev };
              // Parse the answer string back into an array if it's not already
              const selectedAnswers = Array.isArray(answerDetails.answer)
                ? answerDetails.answer
                : JSON.parse(answerDetails.answer);

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
          } else {
            // For single select questions (multiple choice, true/false, poll)
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
    }
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

  const barColors = [
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#6366F1",
    "#F97316",
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

  // For poll questions, show both counts and bar chart
  if (currentItem.type === "poll") {
    const chartData = currentItem.options.map((option, index) => ({
      name: option.text,
      votes: optionCounts[index] || 0,
      percentage: totalVotes
        ? (((optionCounts[index] || 0) / totalVotes) * 100).toFixed(1)
        : 0,
    }));

    return (
      <div className="space-y-4">
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

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${props.payload.votes} votes (${value}%)`,
                    "Responses",
                  ]}
                />
                <Bar
                  dataKey="percentage"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                ></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2 text-gray-600">
            Total Votes: {totalVotes}
          </div>
        </div>
      </div>
    );
  }

  // For other multiple choice questions, show count for each option
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
