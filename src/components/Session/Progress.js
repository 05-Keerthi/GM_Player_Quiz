import React from "react";

const SurveyProgress = ({ progress, className = "" }) => {
  // Parse progress string (e.g., "2/10") into current and total
  const [current, total] = (progress || "0/0").split("/").map(Number);

  // Calculate percentage for progress bar
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">Progress</span>
        <span className="text-sm text-gray-600">{progress || "0/0"}</span>
      </div>
      <div
        data-testid="progress-container"
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          data-testid="progress-indicator"
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SurveyProgress;
