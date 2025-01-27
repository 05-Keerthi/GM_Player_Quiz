// DashboardCharts.js
import React from "react";
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F"];

const AttemptsChart = ({ quizzes, surveys }) => {
  const prepareData = () => {
    const combinedData = [...quizzes, ...surveys].map((item) => ({
      name: item.QuizDetails?.quizTitle || item.SurveyDetails?.surveyTitle,
      attempts: item.attempts,
      type: item.QuizDetails ? "Quiz" : "Survey",
    }));

    return combinedData.sort((a, b) => b.attempts - a.attempts).slice(0, 5);
  };

  const data = prepareData();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="attempts" fill="#8884d8" name="Total Attempts">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === "Quiz" ? COLORS[0] : COLORS[1]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttemptsChart;
