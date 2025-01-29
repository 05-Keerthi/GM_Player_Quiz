import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuizContext } from "../context/quizContext";
import { useSurveyContext } from "../context/surveyContext";
import { useSessionContext } from "../context/sessionContext";
import { useSurveySessionContext } from "../context/surveySessionContext";
import { PlayCircle, RotateCcw } from "lucide-react";
import Navbar from "../components/NavbarComp";
import { cacheService } from "../utils/cacheService";

const UnifiedDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeSession, setActiveSession] = useState(null);
  const [isCheckingCache, setIsCheckingCache] = useState(true);

  const contentType = searchParams.get("type");
  const contentId = searchParams.get(
    contentType === "survey" ? "surveyId" : "quizId"
  );

  const { currentQuiz, getQuizById, loading: quizLoading } = useQuizContext();
  const {
    currentSurvey,
    getSurveyById,
    loading: surveyLoading,
  } = useSurveyContext();
  const {
    createSession,
    loading: sessionLoading,
    error: quizError,
  } = useSessionContext();
  const {
    createSurveySession,
    loading: surveySessionLoading,
    error: surveyError,
  } = useSurveySessionContext();

  const content = contentType === "survey" ? currentSurvey : currentQuiz;
  const loading =
    contentType === "survey"
      ? surveyLoading || surveySessionLoading
      : quizLoading || sessionLoading;
  const error = contentType === "survey" ? surveyError : quizError;

  // Check for active session on component mount
  useEffect(() => {
    const checkCachedSession = async () => {
      try {
        const storedSession = await cacheService.getSession(contentType);
        if (storedSession) {
          setActiveSession(storedSession);
        }
      } catch (error) {
        console.error("Error checking cached session:", error);
      } finally {
        setIsCheckingCache(false);
      }
    };

    checkCachedSession();
  }, [contentType]);

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
    if (!content || content.status !== "active") {
      return;
    }

    try {
      // Clear existing session for this content type
      await cacheService.clearSession(contentType);

      let sessionData;
      if (contentType === "survey") {
        sessionData = await createSurveySession(contentId);
        await cacheService.saveSession(sessionData, "survey");
        navigate(`/survey-lobby`, {
          state: { sessionData },
          search: `?type=survey&surveyId=${contentId}&sessionId=${sessionData._id}`,
        });
      } else {
        sessionData = await createSession(contentId);
        await cacheService.saveSession(sessionData, "quiz");
        navigate(`/lobby`, {
          state: { sessionData },
          search: `?type=quiz&quizId=${contentId}&sessionId=${sessionData._id}`,
        });
      }
    } catch (error) {
      console.error(`Failed to create ${contentType} session:`, error);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;

    // Validate session is still in cache before resuming
    const currentSession = await cacheService.getSession(contentType);
    if (!currentSession) {
      setActiveSession(null);
      return;
    }

    const { _id: sessionId } = activeSession;
    if (contentType === "survey") {
      navigate(`/survey-lobby`, {
        state: { sessionData: activeSession },
        search: `?type=survey&surveyId=${contentId}&sessionId=${sessionId}`,
      });
    } else {
      navigate(`/lobby`, {
        state: { sessionData: activeSession },
        search: `?type=quiz&quizId=${contentId}&sessionId=${sessionId}`,
      });
    }
  };

  // Add cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Optional: Clear expired sessions on component unmount
      const cleanupExpiredSessions = async () => {
        // This will automatically clear expired sessions
        await cacheService.getSession("quiz");
        await cacheService.getSession("survey");
      };
      cleanupExpiredSessions();
    };
  }, []);

  if (!content || loading || isCheckingCache) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="loading-state"
      >
        <div className="text-xl text-gray-600">
          Loading {contentType} details...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" data-testid="unified-details">
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1
            className="text-3xl font-bold text-gray-800 mb-6"
            data-testid="content-title"
          >
            {content.title}
          </h1>

          <div className="mb-8">
            <p
              className="text-gray-600 text-lg"
              data-testid="content-description"
            >
              {content.description}
            </p>
          </div>

          <div
            className="bg-blue-50 rounded-lg p-6 mb-8"
            data-testid="content-details"
          >
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              {contentType === "survey" ? "Survey" : "Quiz"} Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-blue-700" data-testid="questions-count">
                  <span className="font-medium">Total Questions:</span>{" "}
                  {content.questions?.length || 0}
                </p>
                <p className="text-blue-700" data-testid="content-status">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{content.status}</span>
                </p>
                {contentType === "survey" && (
                  <p className="text-blue-700" data-testid="content-visibility">
                    <span className="font-medium">Visibility:</span>{" "}
                    <span className="capitalize">
                      {content.isPublic ? "Public" : "Private"}
                    </span>
                  </p>
                )}
              </div>
              {contentType === "survey" && (
                <div className="space-y-3">
                  <p className="text-blue-700" data-testid="content-categories">
                    <span className="font-medium">Categories:</span>{" "}
                    <span>
                      {content.categories?.map((cat) => cat.name).join(", ") ||
                        "No categories"}
                    </span>
                  </p>
                  <p
                    className="text-blue-700"
                    data-testid="content-created-date"
                  >
                    <span className="font-medium">Created On:</span>{" "}
                    {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {activeSession ? (
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <button
                  data-testid="resume-button"
                  onClick={handleResume}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 text-white rounded-lg text-lg font-semibold hover:bg-green-700 active:scale-95 transform transition w-full md:w-auto justify-center"
                >
                  <RotateCcw className="w-6 h-6" />
                  Resume {contentType === "survey" ? "Survey" : "Quiz"} Session
                </button>
                <button
                  data-testid="new-session-button"
                  onClick={handleStart}
                  disabled={loading || !content || content.status !== "active"}
                  className={`flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold transform transition w-full md:w-auto justify-center
                    ${
                      loading || !content || content.status !== "active"
                        ? "opacity-70 cursor-not-allowed"
                        : "hover:bg-blue-700 active:scale-95"
                    }`}
                >
                  <PlayCircle className="w-6 h-6" />
                  Start New {contentType === "survey" ? "Survey" : "Quiz"}
                </button>
              </div>
            ) : (
              <button
                data-testid="host-button"
                onClick={handleStart}
                disabled={loading || !content || content.status !== "active"}
                className={`flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold transform transition w-full md:w-auto justify-center
                  ${
                    loading || !content || content.status !== "active"
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
                    Host Live {contentType === "survey" ? "Survey" : "Quiz"}
                  </>
                )}
              </button>
            )}

            {error && (
              <div
                className="text-center text-red-600 bg-red-50 p-4 rounded-lg w-full"
                data-testid="error-message"
              >
                {error.message || `Failed to create session. Please try again.`}
              </div>
            )}

            {content.status !== "active" && (
              <div
                className="text-center text-amber-600 bg-amber-50 p-4 rounded-lg w-full"
                data-testid={`inactive-${contentType}-message`}
              >
                This {contentType} is currently {content.status}. It needs to be
                active before it can be hosted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDetails;
