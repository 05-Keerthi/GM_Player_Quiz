import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SurveyResults = ({ sessionId, joinCode, onBackToSurvey }) => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionAnswers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:5000/api/survey-answers/${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch session answers");
        }

        const data = await response.json();

        if (data.questions && data.userAnswers) {
          setQuestions(data.questions);
          setUserAnswers(data.userAnswers);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching session answers:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAnswers();
  }, [sessionId]);

  const getAnswersForQuestion = (questionId) => {
    const answers = [];
    userAnswers.forEach((userAnswer) => {
      const answer = userAnswer.answers.find(
        (a) => a.questionId === questionId
      );
      if (answer) {
        answers.push({
          username: userAnswer.user.username,
          answer: answer.answer,
          timeTaken: answer.timeTaken,
        });
      }
    });
    return answers;
  };

  const handleQuestionClick = (questionId) => {
    const answers = getAnswersForQuestion(questionId);
    setSelectedQuestion({
      question: questions.find((q) => q._id === questionId),
      answers: answers,
    });
  };

  const handleEndQuiz = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/survey-sessions/${joinCode}/${sessionId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ joinCode }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to end quiz");
      }

      navigate("/survey-list");
    } catch (error) {
      console.error("Error ending quiz:", error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Survey Results</h1>
          <div className="flex gap-4">
            <button
              onClick={onBackToSurvey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Survey
            </button>
            <button
              onClick={handleEndQuiz}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              End Survey
            </button>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Session Summary</h2>
          {questions.length === 0 ? (
            <p className="text-gray-500">No questions available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200">
                      Question
                    </th>
                    <th className="text-left p-3 border border-gray-200">
                      Dimension
                    </th>
                    <th className="text-left p-3 border border-gray-200">
                      Description
                    </th>
                    <th className="text-left p-3 border border-gray-200">
                      Total Responses
                    </th>
                    <th className="text-left p-3 border border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => {
                    const answersCount = getAnswersForQuestion(
                      question._id
                    ).length;
                    return (
                      <tr
                        key={question._id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3 border border-gray-200">
                          {question.title}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {question.dimension}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {question.description}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {answersCount}
                        </td>
                        <td className="p-3 border border-gray-200">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleQuestionClick(question._id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Question Details */}
        {selectedQuestion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedQuestion.question.title}
            </h2>
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Dimension:</strong>{" "}
                {selectedQuestion.question.dimension}
              </p>
              <p className="text-gray-600">
                <strong>Description:</strong>{" "}
                {selectedQuestion.question.description}
              </p>
            </div>
            {selectedQuestion.answers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border border-gray-200">
                        User
                      </th>
                      <th className="text-left p-3 border border-gray-200">
                        Answer
                      </th>
                      <th className="text-left p-3 border border-gray-200">
                        Time Taken (s)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuestion.answers.map((answer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border border-gray-200">
                          {answer.username}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {answer.answer}
                        </td>
                        <td className="p-3 border border-gray-200">
                          {answer.timeTaken}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                No answers submitted for this question yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResults;
