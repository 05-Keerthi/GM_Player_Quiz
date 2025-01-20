import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SurveyResults = () => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const joinCode = new URLSearchParams(location.search).get('joinCode');

  useEffect(() => {
    const fetchSessionAnswers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/survey-answers/${sessionId}`,
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

  const getTotalResponses = (questionId) => {
    return userAnswers.reduce((total, userAnswer) => {
      const hasAnswered = userAnswer.answers.some(
        answer => answer.questionId === questionId
      );
      return hasAnswered ? total + 1 : total;
    }, 0);
  };

  const getInterestCounts = (questionId) => {
    return userAnswers.reduce((acc, userAnswer) => {
      const answer = userAnswer.answers.find(
        answer => answer.questionId === questionId
      );
      
      // Log the answer for debugging
      console.log(`Question ${questionId} answer:`, answer);
      
      if (answer) {
        // Check both lowercase and original cases
        const answerValue = answer.answer?.toLowerCase?.() || answer.value?.toLowerCase?.();
        if (answerValue === 'interested' || answerValue === 'yes' || answerValue === true || answerValue === 1) {
          acc.interested += 1;
        } else if (answerValue === 'not interested' || answerValue === 'no' || answerValue === false || answerValue === 0) {
          acc.notInterested += 1;
        }
      }
      return acc;
    }, { interested: 0, notInterested: 0 });
  };

  const handleRowClick = (questionId) => {
    navigate(`/question-details/${sessionId}/${questionId}?joinCode=${joinCode}`);
  };

  const handleEndQuiz = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/survey-sessions/${joinCode}/${sessionId}/end`,
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

      navigate("/");
    } catch (error) {
      console.error("Error ending quiz:", error);
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 role="status" className="w-8 h-8 animate-spin" />
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
          <button
            onClick={handleEndQuiz}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            End Survey
          </button>
        </div>

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
                    <th className="text-center p-3 border border-gray-200">
                      Total Responses
                    </th>
                    <th className="text-center p-3 border border-gray-200">
                      Interested
                    </th>
                    <th className="text-center p-3 border border-gray-200">
                      Not Interested
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => {
                    const interestCounts = getInterestCounts(question._id);
                    return (
                      <tr
                        key={question._id}
                        onClick={() => handleRowClick(question._id)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="p-3 border border-gray-200">
                          {question.title}
                        </td>
                        <td className="text-center p-3 border border-gray-200">
                          {getTotalResponses(question._id)}
                        </td>
                        <td className="text-center p-3 border border-gray-200">
                          {interestCounts.interested}
                        </td>
                        <td className="text-center p-3 border border-gray-200">
                          {interestCounts.notInterested}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyResults;