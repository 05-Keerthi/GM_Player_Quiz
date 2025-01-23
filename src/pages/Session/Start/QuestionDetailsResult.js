import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { paginateData, PaginationControls } from "../../../utils/pagination";

const QuestionDetailsResult = () => {
  const { questionId, sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [groupedAnswers, setGroupedAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      <div className="min-h-screen bg-gray-100 p-4 md:p-6">
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

  // Paginate the users data
  const paginatedUsers = (users) => {
    const { currentItems } = paginateData(users, currentPage, itemsPerPage);
    return currentItems;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 p-4 md:p-8">
            {/* Image Section - Modified for better aspect ratio handling */}
            {questionData?.imageUrl && (
              <div className="order-1 lg:order-2 rounded-lg overflow-hidden shadow-lg border border-gray-100 ring-1 ring-black ring-opacity-5">
                <div className="relative w-full pt-[75%]">
                  {" "}
                  {/* 4:3 aspect ratio */}
                  <img
                    src={questionData.imageUrl}
                    alt={questionData.title}
                    className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}

            {/* Details Section */}
            <div className="order-2 lg:order-1">
              <h1 className="text-xl md:text-2xl font-bold mb-6">
                {questionData?.title}
              </h1>

              <div className="space-y-4 md:space-y-6">
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

              {/* Responses Table */}
              <div className="mt-6">
                <div className="border rounded-lg overflow-auto">
                  <div className="min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            {questionData?.answerOptions?.flatMap((option) => [
                              <th
                                key={`${option.optionText}-name`}
                                style={{ backgroundColor: option.color }}
                                className="py-2 px-2 md:px-4 text-left text-white sticky top-0"
                              >
                                <div className="font-semibold truncate max-w-xs">
                                  {option.optionText}
                                </div>
                              </th>,
                              <th
                                key={`${option.optionText}-time`}
                                className="py-2 px-2 md:px-4 text-left text-white bg-blue-400 sticky top-0"
                              >
                                Time
                              </th>,
                            ])}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {Array.from(
                            {
                              length: Math.max(
                                ...Object.values(groupedAnswers).map(
                                  (g) => paginatedUsers(g.users).length
                                )
                              ),
                            },
                            (_, rowIndex) => (
                              <tr key={rowIndex}>
                                {questionData?.answerOptions?.flatMap(
                                  (option) => {
                                    const answerData = groupedAnswers[
                                      option.optionText
                                    ] || { users: [] };
                                    const user = paginatedUsers(
                                      answerData.users
                                    )[rowIndex];
                                    return [
                                      <td
                                        key={`${option.optionText}-${rowIndex}-name`}
                                        className="py-2 px-2 md:px-4 text-sm font-medium text-gray-900 whitespace-nowrap border-r"
                                      >
                                        {user?.username || ""}
                                      </td>,
                                      <td
                                        key={`${option.optionText}-${rowIndex}-time`}
                                        className="py-2 px-2 md:px-4 text-sm text-gray-500 whitespace-nowrap"
                                      >
                                        {user?.timeTaken
                                          ? `${user.timeTaken}s`
                                          : ""}
                                      </td>,
                                    ];
                                  }
                                )}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {Math.max(
                  ...Object.values(groupedAnswers).map((a) => a.users.length)
                ) > itemsPerPage && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(
                      Math.max(
                        ...Object.values(groupedAnswers).map(
                          (a) => a.users.length
                        )
                      ) / itemsPerPage
                    )}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>

              {/* Back Button */}
              <div className="flex justify-end mb-4 mt-6">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Results
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailsResult;
