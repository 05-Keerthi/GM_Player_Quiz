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

  const getGroupedAnswers = (questionId) => {
    const answerGroups = {};
    const question = questions.find(q => q._id === questionId);
    
    if (question && question.answerOptions) {
      question.answerOptions.forEach(option => {
        answerGroups[option.optionText] = {
          count: 0,
          users: []
        };
      });
    }

    userAnswers.forEach((userAnswer) => {
      const answer = userAnswer.answers.find(
        (a) => a.questionId === questionId
      );
      if (answer && answer.answer) {
        if (!answerGroups[answer.answer]) {
          answerGroups[answer.answer] = {
            count: 0,
            users: []
          };
        }
        answerGroups[answer.answer].count += 1;
        answerGroups[answer.answer].users.push({
          username: userAnswer.user.username,
          timeTaken: answer.timeTaken
        });
      }
    });

    return answerGroups;
  };

  const handleRowClick = (questionId) => {
    navigate(`/question-details/${sessionId}/${questionId}?joinCode=${joinCode}`);
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
                    <th className="text-left p-3 border border-gray-200">
                      Dimension
                    </th>
                    <th className="text-left p-3 border border-gray-200">
                      Description
                    </th>
                    {questions[0]?.answerOptions?.map((option) => (
                      <th key={option.optionText} className="text-center p-3 border border-gray-200">
                        {option.optionText}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => {
                    const groupedAnswers = getGroupedAnswers(question._id);
                    return (
                      <tr
                        key={question._id}
                        onClick={() => handleRowClick(question._id)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
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
                        {question.answerOptions?.map((option) => (
                          <td key={option.optionText} className="text-center p-3 border border-gray-200">
                            {groupedAnswers[option.optionText]?.count || 0}
                          </td>
                        ))}
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