import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SessionDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { type, sessionId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const token = localStorage.getItem("token");
        const endpoint =
          type === "quiz"
            ? `http://localhost:5000/api/reports/session/${sessionId}/responses`
            : `http://localhost:5000/api/reports/surveySession/${sessionId}/responses`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        setData(responseData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError(err.message || `Failed to fetch ${type} session`);
        setLoading(false);
      }
    };

    if (sessionId && type) {
      fetchSessionData();
    }
  }, [sessionId, type]);

  const calculateMetrics = () => {
    if (!data?.summary || !data?.answers) return null;

    const totalQuestions = data.answers.length;
    const totalTime = data.answers.reduce(
      (acc, curr) => acc + (curr.timeTaken || 0),
      0
    );

    if (type === "quiz") {
      const accuracy =
        totalQuestions > 0
          ? (data.summary.correctAnswers / totalQuestions) * 100
          : 0;

      return [
        { label: "Total Questions", value: totalQuestions },
        { label: "Correct Answers", value: data.summary.correctAnswers },
        { label: "Accuracy", value: `${accuracy.toFixed(1)}%` },
        { label: "Total Time", value: `${totalTime}s` },
      ];
    }

    // Survey metrics
    const completedAnswers = data.answers.filter(
      (a) => a.submittedAnswer
    ).length;
    const completionRate =
      totalQuestions > 0 ? (completedAnswers / totalQuestions) * 100 : 0;

    return [
      { label: "Total Questions", value: totalQuestions },
      { label: "Answered Questions", value: completedAnswers },
      { label: "Completion Rate", value: `${completionRate.toFixed(1)}%` },
      { label: "Total Time", value: `${totalTime}s` },
    ];
  };

  const renderAnswerHeader = (answer) => (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold">{answer.question}</h3>
        <p className="text-gray-600 mt-1">{answer.question_description}</p>
      </div>
      <div className="flex items-center">
        {answer.isCorrect !== undefined && answer.questionType !== "poll" && (
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              answer.isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {answer.isCorrect ? "Correct" : "Incorrect"}
          </span>
        )}
        <span className="ml-4 text-sm text-gray-500">{answer.timeTaken}s</span>
      </div>
    </div>
  );

  const renderQuizAnswer = (answer) => {
    if (!answer?.questionType) return null;

    const baseCardStyle = "bg-white p-6 rounded-lg shadow h-full";

    switch (answer.questionType) {
      case "multiple_choice":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border ${
                    option.text === answer.submittedAnswer
                      ? answer.isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      case "multiple_select":
        const selectedIndices = new Set(answer.submittedAnswer || []);
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option, index) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border ${
                    selectedIndices.has(index)
                      ? answer.isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      case "true_false":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border ${
                    option.text === answer.submittedAnswer
                      ? option.isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : option.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      case "open_ended":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            <div className="mt-4">
              <div
                className={`p-4 rounded-lg border ${
                  answer.isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <p
                  className={`${
                    answer.isCorrect ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {answer.submittedAnswer}
                </p>
              </div>
            </div>
          </div>
        );

      case "poll":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border ${
                    option.text === answer.submittedAnswer
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  {option.text}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSurveyAnswer = (answer) => {
    if (!answer) return null;

    const baseCardStyle = "bg-white p-6 rounded-lg shadow h-full";

    return (
      <div className={baseCardStyle}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{answer.question_title}</h3>
            <p className="text-gray-600 mt-1">{answer.question_description}</p>
          </div>
          <div className="flex items-center">
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Submitted
            </span>
            <span className="ml-4 text-sm text-gray-500">
              {answer.timeTaken}s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {answer.options &&
            answer.options.map((option) => (
              <div
                key={option._id}
                className={`p-3 rounded-lg border ${
                  option.optionText === answer.submittedAnswer
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200"
                }`}
              >
                {option.optionText}
              </div>
            ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!data?.summary || !data?.answers) return null;

  const metrics = calculateMetrics();
  if (!metrics) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">
          {type === "quiz"
            ? "Quiz Session Analysis"
            : "Survey Response Analysis"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-500">{metric.label}</p>
            <h3 className="text-2xl font-bold">{metric.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.answers.map((answer, index) => (
          <div key={index}>
            {type === "quiz"
              ? renderQuizAnswer(answer)
              : renderSurveyAnswer(answer)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionDashboard;
