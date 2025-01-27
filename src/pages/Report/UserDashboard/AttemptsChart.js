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

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, attempts, type } = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm">
          <p className="font-medium">{name}</p>
          <p className="text-gray-600">Type: {type}</p>
          <p className="text-gray-600">Attempts: {attempts}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="type"
            textAnchor="end"
            height={60}
            interval={0}
            angle={-45}
          />
          <YAxis />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <Legend />
          <Bar
            dataKey="attempts"
            fill="#8884d8"
            name="Total Attempts"
            barSize={60}
            style={{ cursor: "pointer" }}
          >
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
