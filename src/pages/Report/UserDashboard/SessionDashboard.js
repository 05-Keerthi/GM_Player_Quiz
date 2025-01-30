import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../components/NavbarComp";
import { ArrowBigLeft, Check, X } from "lucide-react";

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
              !answer.submittedAnswer
                ? "bg-gray-100 text-gray-800"
                : answer.isCorrect
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {!answer.submittedAnswer
              ? "Skipped"
              : answer.isCorrect
              ? "Correct"
              : "Incorrect"}
          </span>
        )}
        <span className="ml-4 text-sm text-gray-500">{answer.timeTaken}s</span>
      </div>
    </div>
  );

  const renderQuizAnswer = (answer) => {
    if (!answer?.questionType) return null;

    const baseCardStyle = "bg-white p-6 rounded-lg shadow h-full";

    const renderImageIfExists = () => {
      if (answer.imageUrl) {
        return (
          <div className="relative w-full h-64 mb-4 overflow-hidden rounded-lg">
            <img
              src={answer.imageUrl}
              alt={answer.question}
              className="w-full h-full object-contain bg-gray-100"
            />
            <div className="absolute inset-0 border border-gray-200 rounded-lg pointer-events-none"></div>
          </div>
        );
      }
      return null;
    };

    switch (answer.questionType) {
      case "multiple_choice":
      case "true_false":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            {renderImageIfExists()}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    !answer.submittedAnswer
                      ? "border-gray-200"
                      : option.text === answer.submittedAnswer
                      ? answer.isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : option.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-sm">{option.text}</span>
                  {option.isCorrect && (
                    <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                  )}
                  {option.text === answer.submittedAnswer &&
                    !answer.isCorrect && (
                      <X className="h-5 w-5 text-white rounded-full bg-red-800" />
                    )}
                </div>
              ))}
            </div>
          </div>
        );

      case "multiple_select":
        const selectedAnswers = new Set(answer.submittedAnswer || []);
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            {renderImageIfExists()}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    selectedAnswers.has(option.text)
                      ? answer.isCorrect
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : option.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-sm">{option.text}</span>
                  {option.isCorrect && (
                    <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                  )}
                  {selectedAnswers.has(option.text) && !answer.isCorrect && (
                    <X className="h-5 w-5 text-white rounded-full bg-red-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "open_ended":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            {renderImageIfExists()}
            <div className="mt-4">
              {answer.submittedAnswer ? (
                <div
                  className={`p-4 rounded-lg border ${
                    answer.isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">
                        Submitted Answer:
                      </p>
                      <p
                        className={`${
                          answer.isCorrect ? "text-green-700" : "text-red-700"
                        } text-sm`}
                      >
                        {answer.submittedAnswer}
                      </p>
                    </div>
                    {answer.isCorrect ? (
                      <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                    ) : (
                      <X className="h-5 w-5 text-white rounded-full bg-red-800" />
                    )}
                  </div>
                </div>
              ) : null}

              <div
                className={`${
                  answer.submittedAnswer ? "mt-2" : ""
                } p-4 rounded-lg border border-green-500 bg-green-50`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">
                      Correct Answer:
                    </p>
                    <p className="text-green-700 text-sm">
                      {answer.correctOption
                        ? answer.correctOption[0]
                        : answer.correctAnswer}
                    </p>
                  </div>
                  <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                </div>
              </div>
            </div>
          </div>
        );

      case "poll":
        return (
          <div className={baseCardStyle}>
            {renderAnswerHeader(answer)}
            {renderImageIfExists()}
            <div className="grid grid-cols-2 gap-4">
              {answer.options.map((option) => (
                <div
                  key={option._id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    option.text === answer.submittedAnswer
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="text-sm">{option.text}</span>
                  {option.text === answer.submittedAnswer && (
                    <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                  )}
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

    const getSubmittedAnswer = (submittedAnswer) => {
      if (!submittedAnswer) return null;
      if (typeof submittedAnswer === "string") return submittedAnswer;
      if (
        typeof submittedAnswer === "object" &&
        submittedAnswer.answer !== undefined
      ) {
        return submittedAnswer.answer;
      }
      return null;
    };

    const isAnswerSkipped = () => {
      const processedAnswer = getSubmittedAnswer(answer.submittedAnswer);
      return (
        !processedAnswer || processedAnswer === "" || processedAnswer === "null"
      );
    };

    const currentAnswer = getSubmittedAnswer(answer.submittedAnswer);
    const skipped = isAnswerSkipped();

    return (
      <div className={baseCardStyle}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-4">
            <h3 className="text-lg font-semibold">{answer.question_title}</h3>
            <p className="text-gray-600 mt-1">{answer.question_description}</p>
          </div>
          <div className="flex items-center flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                skipped
                  ? "bg-gray-100 text-gray-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {skipped ? "Skipped" : "Submitted"}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              {answer.timeTaken || 0}s
            </span>
          </div>
        </div>

        {answer.imageUrl && (
          <div className="relative w-full h-64 mb-4 overflow-hidden rounded-lg">
            <img
              src={answer.imageUrl}
              alt={answer.question_title}
              className="w-full h-full object-contain bg-gray-100"
            />
            <div className="absolute inset-0 border border-gray-200 rounded-lg pointer-events-none"></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {answer.options &&
            answer.options.map((option) => (
              <div
                key={option._id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  skipped
                    ? "border-gray-200"
                    : option.optionText === currentAnswer
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200"
                }`}
              >
                <span className="text-sm">{option.optionText}</span>
                {!skipped && option.optionText === currentAnswer && (
                  <Check className="h-5 w-5 text-white rounded-full bg-green-800" />
                )}
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

  const handleBackNavigation = () => {
    const sessionId =
      type === "quiz"
        ? data.sessionDetails.quiz._id
        : data.sessionDetails.surveyQuiz._id;
    navigate(`/${type}-reports/${type}/${sessionId}`);
  };

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
    <>
      <>
        <Navbar />
      </>
      <>
        <div className="p-6 bg-gray-50 min-h-screen">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleBackNavigation}
              className="text-blue-600 hover:text-blue-800 flex items-center text-xl font-semibold"
            >
              <ArrowBigLeft />
              <span className="hidden sm:inline">Back to Performance</span>
              <span className="sm:hidden">Back</span>
            </button>
            <h1 className="text-2xl font-bold truncate max-w-[200px] sm:max-w-none">
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
      </>
    </>
  );
};

export default SessionDashboard;
