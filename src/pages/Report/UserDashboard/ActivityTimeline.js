// ActivityTimeline.js
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Calendar } from "lucide-react";

const ActivityTimeline = ({ quizzes, surveys }) => {
  const prepareTimelineData = () => {
    const allAttempts = [...quizzes, ...surveys].reduce((acc, item) => {
      const date = new Date(item.lastAttempt);
      const monthYear = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!acc[monthYear]) {
        acc[monthYear] = { quizAttempts: 0, surveyAttempts: 0 };
      }

      if ("QuizDetails" in item) {
        acc[monthYear].quizAttempts += item.attempts;
      } else {
        acc[monthYear].surveyAttempts += item.attempts;
      }

      return acc;
    }, {});

    return Object.entries(allAttempts).map(([date, data]) => ({
      date,
      ...data,
    }));
  };

  const data = prepareTimelineData();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-500" />
        <h2 className="text-xl font-bold">Activity Timeline</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} style={{ cursor: "pointer" }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="quizAttempts"
              stackId="1"
              stroke="#8884d8"
              fill="#8884d8"
              name="Quiz Attempts"
            />
            <Area
              type="monotone"
              dataKey="surveyAttempts"
              stackId="1"
              stroke="#82ca9d"
              fill="#82ca9d"
              name="Survey Attempts"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityTimeline;
