import React from "react";
import { Trophy, Clock, Target } from "lucide-react";

const MetricCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-6 h-6 text-blue-500" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const formatTime = (totalSeconds) => {
  // Constants for time conversions
  const MONTH = 30 * 24 * 60 * 60; // Approximate month in seconds
  const WEEK = 7 * 24 * 60 * 60;
  const DAY = 24 * 60 * 60;
  const HOUR = 60 * 60;
  const MINUTE = 60;

  let seconds = totalSeconds;
  const parts = [];

  // Calculate months
  if (seconds >= MONTH) {
    const months = Math.floor(seconds / MONTH);
    parts.push(`${months}mo`);
    seconds %= MONTH;
  }

  // Calculate weeks
  if (seconds >= WEEK) {
    const weeks = Math.floor(seconds / WEEK);
    parts.push(`${weeks}w`);
    seconds %= WEEK;
  }

  // Calculate days
  if (seconds >= DAY) {
    const days = Math.floor(seconds / DAY);
    parts.push(`${days}d`);
    seconds %= DAY;
  }

  // Calculate hours
  if (seconds >= HOUR) {
    const hours = Math.floor(seconds / HOUR);
    parts.push(`${hours}h`);
    seconds %= HOUR;
  }

  // Calculate minutes
  if (seconds >= MINUTE) {
    const minutes = Math.floor(seconds / MINUTE);
    parts.push(`${minutes}m`);
    seconds %= MINUTE;
  }

  // Remaining seconds
  if (seconds > 0 || totalSeconds === 0) {
    parts.push(`${Math.floor(seconds)}s`);
  }

  return parts.join(" ");
};

const PerformanceMetrics = ({ quizzes, surveys, totalTime }) => {
  const calculateMetrics = () => {
    const totalQuizzes = quizzes.length;
    const totalAttempts = quizzes.reduce((sum, quiz) => sum + quiz.attempts, 0);
    const avgAttemptsPerQuiz = totalQuizzes
      ? (totalAttempts / totalQuizzes).toFixed(1)
      : 0;

    // Calculate completion rate based on quizzes with attempts
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
      />
      <MetricCard
        icon={Target}
        title="Average Attempts"
        value={metrics.avgAttemptsPerQuiz}
      />
      <MetricCard
        icon={Clock}
        title="Active Time"
        value={formatTime(totalTime)}
      />
    </div>
  );
};

export default PerformanceMetrics;
