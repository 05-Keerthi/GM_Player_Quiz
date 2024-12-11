import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSurveyContext } from "../context/surveyContext";
import { useSurveySessionContext } from "../context/surveySessionContext";
import { PlayCircle } from "lucide-react";
import Navbar from "../components/NavbarComp";

const SurveyDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentSurvey, getSurveyById } = useSurveyContext();
  const { createSurveySession, loading, error } = useSurveySessionContext();
  const surveyId = searchParams.get("surveyId");
  const hostId = searchParams.get("hostId");

  useEffect(() => {
    if (surveyId) {
      getSurveyById(surveyId);
    }
  }, [surveyId]);

  const handleStartSurvey = async () => {
    try {
      const sessionData = await createSurveySession(surveyId);
      navigate(`/survey-lobby?surveyId=${surveyId}`, {
        state: { sessionData }, // Pass session data through navigation state
      });
    } catch (error) {
      console.error("Failed to create survey session:", error);
    }
  };

  if (!currentSurvey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Loading survey details...</div>
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
            {currentSurvey.title}
          </h1>

          <div className="mb-8">
            <p className="text-gray-600 text-lg">{currentSurvey.description}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Survey Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-blue-700">
                  <span className="font-medium">Total Questions:</span>{" "}
                  {currentSurvey.questions?.length || 0}
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Status:</span>{" "}
                  <span className="capitalize">{currentSurvey.status}</span>
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Visibility:</span>{" "}
                  <span className="capitalize">
                    {currentSurvey.isPublic ? "Public" : "Private"}
                  </span>
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-blue-700">
                  <span className="font-medium">Categories:</span>{" "}
                  <span>
                    {currentSurvey.categories
                      ?.map((cat) => cat.name)
                      .join(", ") || "No categories"}
                  </span>
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(currentSurvey.createdAt).toLocaleDateString()}
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Last Modified:</span>{" "}
                  {new Date(currentSurvey.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleStartSurvey}
              disabled={loading || currentSurvey.status !== "active"}
              className={`flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold transform transition w-full md:w-auto justify-center
                ${
                  loading || currentSurvey.status !== "active"
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
                {error.message || "Failed to create session. Please try again."}
              </div>
            )}

            {currentSurvey.status !== "active" && (
              <div className="text-center text-amber-600 bg-amber-50 p-4 rounded-lg w-full">
                This survey is currently {currentSurvey.status}. It needs to be
                active before it can be hosted.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyDetails;
