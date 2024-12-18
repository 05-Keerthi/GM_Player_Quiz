import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SurveyResults = ({ sessionId, joinCode, onBackToSurvey }) => {
  const [sessionAnswers, setSessionAnswers] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessionAnswers = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/survey-answers/${sessionId}`
        );
        const data = await response.json();
        setSessionAnswers(data);
      } catch (error) {
        console.error("Error fetching session answers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionAnswers();
  }, [sessionId]);

  const handleQuestionClick = async (questionId) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/survey-answers/${sessionId}/${questionId}`
      );
      const data = await response.json();
      setQuestionAnswers(data);
      setSelectedQuestion(questionId);
    } catch (error) {
      console.error("Error fetching question answers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndQuiz = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/survey-sessions/${sessionId}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ joinCode }),
        }
      );

      if (response.ok) {
        navigate("/survey-list");
      }
    } catch (error) {
      console.error("Error ending quiz:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
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
              End Quiz
            </button>
          </div>
        </div>

        {/* Session Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Session Summary</h2>
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
                    Total Responses
                  </th>
                  <th className="text-left p-3 border border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessionAnswers.map((question) => (
                  <tr
                    key={question._id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleQuestionClick(question._id)}
                  >
                    <td className="p-3 border border-gray-200">
                      {question.title}
                    </td>
                    <td className="p-3 border border-gray-200">
                      {question.dimension}
                    </td>
                    <td className="p-3 border border-gray-200">
                      {question.totalResponses}
                    </td>
                    <td className="p-3 border border-gray-200">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionClick(question._id);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Details */}
        {selectedQuestion && questionAnswers.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Question Details</h2>
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
                      Time Taken
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questionAnswers.map((answer) => (
                    <tr key={answer._id} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-200">
                        {answer.userName}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {answer.answerText}
                      </td>
                      <td className="p-3 border border-gray-200">
                        {answer.timeTaken}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyResults;
