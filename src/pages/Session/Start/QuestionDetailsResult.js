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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Details and Image Card */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-2 gap-8 p-8">
            {/* Left Column - Details */}
            <div>
              <h1 className="text-2xl font-bold mb-8">{questionData?.title}</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-gray-700 font-semibold mb-2">
                    Description
                  </h2>
                  <p className="text-gray-600">{questionData?.description}</p>
                </div>

                <div>
                  <h2 className="text-gray-700 font-semibold mb-2">
                    Dimension
                  </h2>
                  <p className="text-gray-600">{questionData?.dimension}</p>
                </div>

                <div>
                  <h2 className="text-gray-700 font-semibold mb-2">Year</h2>
                  <p className="text-gray-600">{questionData?.year}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            {questionData?.imageUrl && (
              <div className="rounded-lg overflow-hidden shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5">
                <img
                  src={questionData.imageUrl}
                  alt={questionData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Responses Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Back Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Results
            </button>
          </div>

          {/* Responses Table */}
          <div className="max-w-6xl mx-auto">
            <div className="border rounded-lg overflow-hidden">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${
                    questionData?.answerOptions?.length || 1
                  }, minmax(200px, 1fr))`,
                }}
              >
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
                        <div className="group relative">
                          <h3
                            className="font-semibold text-lg text-center truncate"
                            title={option.optionText}
                          >
                            {option.optionText}
                          </h3>
                          {/* Tooltip on hover */}
                          <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-800 text-white text-sm rounded shadow-lg -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full whitespace-normal max-w-xs">
                            {option.optionText}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 text-center mt-1">
                          {answerData.users.length}{" "}
                          {answerData.users.length === 1
                            ? "response"
                            : "responses"}
                        </div>
                      </div>
                      <div className="divide-y">
                        {answerData.users.length > 0 ? (
                          answerData.users.map((user, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50">
                              <div className="flex justify-between items-center gap-2">
                                <div className="font-medium truncate">
                                  {user.username}
                                </div>
                                <div className="text-gray-500 text-sm whitespace-nowrap">
                                  {user.timeTaken}s
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-gray-500 text-center">
                            No responses yet
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
      </div>
    </div>
  );
};

export default QuestionDetailsResult;
