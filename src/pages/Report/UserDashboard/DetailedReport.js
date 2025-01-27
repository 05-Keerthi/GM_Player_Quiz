import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const DetailedReportDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { type, id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetailedReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/reports/${type}/${id}/attempts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        setData(responseData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err.message || "Failed to fetch detailed report");
        setLoading(false);
      }
    };

    if (type && id) {
      fetchDetailedReport();
    }
  }, [type, id]);

  const getMetrics = () => {
    if (!data.length) return [];

    if (type === "quiz") {
      const totalAttempts = data.length;
      const avgScore =
        data.reduce((acc, curr) => {
          const total =
            (curr.correctAnswers || 0) + (curr.incorrectAnswers || 0);
          return acc + (total > 0 ? (curr.correctAnswers / total) * 100 : 0);
        }, 0) / totalAttempts;

      const avgDuration =
        data.reduce((acc, curr) => {
          if (!curr.sessionDetails?.startTime || !curr.sessionDetails?.endTime)
            return acc;
          const duration =
            (new Date(curr.sessionDetails.endTime) -
              new Date(curr.sessionDetails.startTime)) /
            1000;
          return acc + duration;
        }, 0) / totalAttempts;

      return [
        { label: "Total Attempts", value: totalAttempts },
        {
          label: "Average Score",
          value: `${Math.min(avgScore, 100).toFixed(1)}%`,
        },
        { label: "Average Duration", value: `${Math.round(avgDuration)}s` },
      ];
    }

    const totalResponses = data.length;
    const completedResponses = data.filter(
      (r) => r.surveySessionDetails?.status === "completed"
    ).length;
    const completionRate = Math.min(
      totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0,
      100
    );
    const avgQuestionsAnswered =
      totalResponses > 0
        ? data.reduce((acc, curr) => acc + (curr.questionsAttempted || 0), 0) /
          totalResponses
        : 0;

    return [
      { label: "Total Responses", value: totalResponses },
      { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` },
      {
        label: "Avg Questions Answered",
        value: Math.round(avgQuestionsAnswered),
      },
    ];
  };

  const renderDetails = () => {
    if (!data.length)
      return <div className="text-gray-500">No data available</div>;

    if (type === "quiz") {
      return data.map((attempt) => (
        <div
          key={attempt._id}
          className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50"
          onClick={() => {
            const sessionId = attempt.sessionDetails?.sessionId;
            if (sessionId) {
              navigate(`/session/quiz/${sessionId}`);
            } else {
              console.error("Session ID not found in attempt details");
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">
                {attempt.sessionDetails?.quiz?.quizTitle || "Untitled Quiz"}
              </p>
              <p>Host: {attempt.sessionDetails?.host || "Unknown"}</p>
              <p
                className={`${
                  attempt.sessionDetails?.status === "completed"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {attempt.sessionDetails?.status || "Unknown"}
              </p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Score</span>
                <span className="font-bold">
                  {Math.min(
                    Math.round(
                      ((attempt.correctAnswers || 0) /
                        Math.max(
                          (attempt.correctAnswers || 0) +
                            (attempt.incorrectAnswers || 0),
                          1
                        )) *
                        100
                    ),
                    100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      ((attempt.correctAnswers || 0) /
                        Math.max(
                          (attempt.correctAnswers || 0) +
                            (attempt.incorrectAnswers || 0),
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {attempt.completedAt
                  ? new Date(attempt.completedAt).toLocaleString()
                  : "Completion time not available"}
              </p>
            </div>
          </div>
        </div>
      ));
    }

    return data.map((response) => (
      <div
        key={response._id}
        className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50"
        onClick={() => {
          const sessionId = response.surveySessionDetails?.sessionId;
          if (sessionId) {
            navigate(`/session/survey/${sessionId}`);
          } else {
            console.error("Session ID not found in survey details");
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">
              {response.surveyQuiz?.quizTitle || "Untitled Survey"}
            </p>
            <p
              className={`${
                response.surveySessionDetails?.status === "completed"
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {response.surveySessionDetails?.status || "Unknown"}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>Completion</span>
              <span className="font-bold">
                {Math.min(
                  Math.round(
                    ((response.questionsAttempted || 0) /
                      Math.max(
                        (response.questionsAttempted || 0) +
                          (response.questionsSkipped || 0),
                        1
                      )) *
                      100
                  ),
                  100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(
                    ((response.questionsAttempted || 0) /
                      Math.max(
                        (response.questionsAttempted || 0) +
                          (response.questionsSkipped || 0),
                        1
                      )) *
                      100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {response.completedAt
                ? new Date(response.completedAt).toLocaleString()
                : "Completion time not available"}
            </p>
          </div>
        </div>
      </div>
    ));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold">
          {type === "quiz"
            ? "Quiz Performance Dashboard"
            : "Survey Response Dashboard"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {getMetrics().map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <h3 className="text-2xl font-bold">{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="space-y-6">{renderDetails()}</div>
    </div>
  );
};

export default DetailedReportDashboard;
