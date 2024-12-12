import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuizContext } from "../context/quizContext";
import { useSurveyContext } from "../context/surveyContext";
import { useSessionContext } from "../context/sessionContext";
import { useSurveySessionContext } from "../context/surveySessionContext";
import { PlayCircle } from "lucide-react";
import Navbar from "../components/NavbarComp";

const UnifiedDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get content type from URL params
  const contentType = searchParams.get("type"); // 'quiz' or 'survey'
  const contentId = searchParams.get(
    contentType === "survey" ? "surveyId" : "quizId"
  );
  const hostId = searchParams.get("hostId");

  // Initialize appropriate contexts based on content type
  const { currentQuiz, getQuizById } = useQuizContext();

  const { currentSurvey, getSurveyById } = useSurveyContext();

  const {
    createSession,
    loading: quizLoading,
    error: quizError,
  } = useSessionContext();

  const {
    createSurveySession,
    loading: surveyLoading,
    error: surveyError,
  } = useSurveySessionContext();

  // Determine which content and loading state to use
  const content = contentType === "survey" ? currentSurvey : currentQuiz;
  const loading = contentType === "survey" ? surveyLoading : quizLoading;
  const error = contentType === "survey" ? surveyError : quizError;

  useEffect(() => {
    if (contentId) {
      if (contentType === "survey") {
        getSurveyById(contentId);
      } else {
        getQuizById(contentId);
      }
    }
  }, [contentId, contentType]);

  const handleStart = async () => {
    try {
      let sessionData;
      if (contentType === "survey") {
        sessionData = await createSurveySession(contentId);
        navigate(`/admin-lobby`, {
          state: { sessionData },
          search: `?type=survey&surveyId=${contentId}&sessionId=${sessionData._id}`,
        });
      } else {
        sessionData = await createSession(contentId);
        navigate(`/admin-lobby`, {
          state: { sessionData },
          search: `?type=quiz&quizId=${contentId}&sessionId=${sessionData._id}`,
        });
      }
    } catch (error) {
      console.error(`Failed to create ${contentType} session:`, error);
    }
  };

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-600">
          Loading {contentType} details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {content.title}
          </h1>

          <div className="mb-8">
            <p className="text-gray-600 text-lg">{content.description}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {contentType === "survey" ? "Survey" : "Quiz"} Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-blue-700">
                  <span className="font-medium">Total Questions:</span>{" "}
                  {content.questions?.length || 0}
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{content.status}</span>
                </p>
                {contentType === "survey" && (
                  <p className="text-blue-700">
                    <span className="font-medium">Visibility:</span>{" "}
                    <span className="capitalize">
                      {content.isPublic ? "Public" : "Private"}
                    </span>
                  </p>
                )}
              </div>
              {contentType === "survey" && (
                <div className="space-y-3">
                  <p className="text-blue-700">
                    <span className="font-medium">Categories:</span>{" "}
                    <span>
                      {content.categories?.map((cat) => cat.name).join(", ") ||
                        "No categories"}
                    </span>
                  </p>
                  <p className="text-blue-700">
                    <span className="font-medium">Created On:</span>{" "}
                    {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleStart}
              disabled={
                loading ||
                (contentType === "survey" && content.status !== "active")
              }
              className={`flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold transform transition w-full md:w-auto justify-center
                ${
                  loading ||
                  (contentType === "survey" && content.status !== "active")
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-blue-700 active:scale-95"
                }`}
            >
              {loading ? (
                <>
                  <PlayCircle className="w-6 h-6 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6" />
                  Host Live
                </>
              )}
            </button>

            {error && (
              <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg w-full">
                {error.message || `Failed to create session. Please try again.`}
              </div>
            )}

            {contentType === "survey" && content.status !== "active" && (
              <div className="text-center text-amber-600 bg-amber-50 p-4 rounded-lg w-full">
                This survey is currently {content.status}. It needs to be active
                before it can be hosted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDetails;
