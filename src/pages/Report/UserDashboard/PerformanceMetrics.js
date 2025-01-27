// PerformanceMetrics.js
import React from "react";
import { Trophy, Clock, Target, TrendingUp } from "lucide-react";

const MetricCard = ({ icon: Icon, title, value, trend, trendValue }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 ${
            trendValue >= 0 ? "text-green-500" : "text-red-500"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{Math.abs(trendValue)}%</span>
        </div>
      )}
    </div>
  </div>
);

const PerformanceMetrics = ({ quizzes, surveys }) => {
  const calculateMetrics = () => {
    const totalQuizzes = quizzes.length;
    const totalAttempts = quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0);
    const avgAttemptsPerQuiz = totalQuizzes
      ? (totalAttempts / totalQuizzes).toFixed(1)
      : 0;

    // Calculate completion rate based on quizzes with at least one attempt
    const quizzesWithAttempts = quizzes.filter(
      (quiz) => quiz.attempts > 0
    ).length;
    const completionRate = Math.min(
      (quizzesWithAttempts / (totalQuizzes || 1)) * 100,
      100
    ).toFixed(1);

    return {
      totalQuizzes,
      avgAttemptsPerQuiz,
      completionRate,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        icon={Trophy}
        title="Completion Rate"
        value={`${metrics.completionRate}%`}
        trend
        trendValue={5.2}
      />
      <MetricCard
        icon={Target}
        title="Average Attempts"
        value={metrics.avgAttemptsPerQuiz}
        trend
        trendValue={-2.1}
      />
      <MetricCard
        icon={Clock}
        title="Active Time"
        value="2.5h"
        trend
        trendValue={3.7}
      />
    </div>
  );
};

export default PerformanceMetrics;
