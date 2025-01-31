import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SurveyResults = () => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [surveyType, setSurveyType] = useState("");
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isTableView, setIsTableView] = useState(true);
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const location = useLocation();
  const joinCode = new URLSearchParams(location.search).get("joinCode");

  useEffect(() => {
    const handleResize = () => {
      setIsTableView(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          const data = await response.json();
          throw new Error(data.message || "Failed to fetch session answers");
        }

        const data = await response.json();

        if (data.questions && data.userAnswers && data.surveyDetails) {
          setQuestions(data.questions);
          setUserAnswers(data.userAnswers);
          setSurveyType(data.surveyDetails.Type);
          setTotalParticipants(data.userAnswers.length);
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
        (answer) => answer.questionId === questionId && answer.answer !== "null"
      );
      return hasAnswered ? total + 1 : total;
    }, 0);
  };

  const getOptionCount = (questionId, optionText) => {
    return userAnswers.reduce((count, userAnswer) => {
      const answer = userAnswer.answers.find(
        (a) => a.questionId === questionId
      );
      return answer && answer.answer === optionText ? count + 1 : count;
    }, 0);
  };

  const handleRowClick = (questionId) => {
    navigate(
      `/question-details/${sessionId}/${questionId}?joinCode=${joinCode}`
    );
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

      navigate(`/surveys/session/${sessionId}`);
    } catch (error) {
      console.error("Error ending quiz:", error);
      setError(error.message);
    }
  };

  // Get all unique options across all questions
  const getAllUniqueOptions = () => {
    const uniqueOptions = new Set();
    questions.forEach((question) => {
      question.answerOptions.forEach((option) => {
        uniqueOptions.add(option.optionText);
      });
    });
    return Array.from(uniqueOptions);
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
            <p className="text-red-600">{error}</p>
            {error === "No answers found for this session" && (
              <button
                onClick={handleEndQuiz}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                End Survey
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const uniqueOptions = surveyType === "ArtPulse" ? getAllUniqueOptions() : [];

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
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold">Session Summary</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total Participants:</span>
              <span className="text-lg font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                {totalParticipants}
              </span>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-gray-500">No questions available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-64" />
                  <col className="w-48" />
                  {surveyType === "ArtPulse" &&
                    uniqueOptions.map((option) => (
                      <col key={option} className="w-32" />
                    ))}
                </colgroup>
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                      {surveyType === "ArtPulse" ? "Art Piece" : "Question"}
                    </th>
                    <th className="text-center p-3 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                      Total Responses
                    </th>
                    {surveyType === "ArtPulse" &&
                      uniqueOptions.map((option) => (
                        <th
                          key={option}
                          className="text-center p-3 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                          {option}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question) => (
                    <tr
                      key={question._id}
                      onClick={() => handleRowClick(question._id)}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 border border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                        {question.title}
                      </td>
                      <td className="text-center p-3 border border-gray-200 whitespace-nowrap">
                        <span className="bg-gray-100 px-3 py-1 rounded-full">
                          {getTotalResponses(question._id)} /{" "}
                          {totalParticipants}
                        </span>
                      </td>
                      {surveyType === "ArtPulse" &&
                        uniqueOptions.map((option) => (
                          <td
                            key={option}
                            className="text-center p-3 border border-gray-200 whitespace-nowrap"
                          >
                            {getOptionCount(question._id, option)}
                          </td>
                        ))}
                    </tr>
                  ))}
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
