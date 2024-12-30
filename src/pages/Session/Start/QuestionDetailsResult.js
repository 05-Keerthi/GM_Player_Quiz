import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const QuestionDetailsResult = () => {
  const { questionId, sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [groupedAnswers, setGroupedAnswers] = useState({});

  useEffect(() => {
    const fetchQuestionDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/survey-answers/${sessionId}/${questionId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch question details");
        }

        const data = await response.json();
        setQuestionData(data.question);
        setGroupedAnswers(data.groupedAnswers);
      } catch (error) {
        console.error("Error fetching question details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionDetails();
  }, [questionId, sessionId]);

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
              onClick={() => navigate(-1)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
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
          <div>
            <h1 className="text-2xl font-bold">{questionData?.title}</h1>
            <p className="text-gray-600 mt-2">
              <span className="font-medium">Dimension:</span>{" "}
              {questionData?.dimension}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Description:</span>{" "}
              {questionData?.description}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="grid grid-cols-3 gap-0">
            {questionData?.answerOptions?.map((option) => {
              const answerData = groupedAnswers[option.optionText] || {
                count: 0,
                users: [],
              };
              return (
                <div
                  key={option.optionText}
                  className="border-r last:border-r-0"
                >
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-lg">
                        {option.optionText}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {answerData.count} responses
                      </span>
                    </div>
                  </div>
                  <div className="divide-y">
                    {answerData.users.length > 0 ? (
                      answerData.users.map((user, index) => (
                        <div key={index} className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{user.username}</div>
                            <div className="text-gray-500 text-sm">
                              {user.timeTaken}s
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-gray-500 text-center">
                        No responses
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailsResult;
