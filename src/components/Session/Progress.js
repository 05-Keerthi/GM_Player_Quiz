import React from 'react';

const SurveyProgress = ({ progress, className = "" }) => {
  // Parse progress string (e.g., "2/10") into current and total
  const [current, total] = (progress || "0/0").split('/').map(Number);
  
  // Calculate percentage for progress bar
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1 text-sm text-gray-600">
        <span>Progress</span>
        <span>{progress || "0/0"}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SurveyProgress;