import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuizContext } from "../context/quizContext";
import { PlayCircle } from "lucide-react";
import Navbar from "../components/NavbarComp";

const QuizDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentQuiz, getQuizById } = useQuizContext();
  const quizId = searchParams.get("quizId");
  const hostId = searchParams.get("hostId");

  useEffect(() => {
    if (quizId) {
      getQuizById(quizId);
    }
  }, [quizId]);


  if (!currentQuiz) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Loading quiz details...</div>
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
            {currentQuiz.title}
          </h1>

          <div className="mb-8">
            <p className="text-gray-600 text-lg">{currentQuiz.description}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              Quiz Details
            </h2>
            <div className="space-y-3">
              <p className="text-blue-700">
                <span className="font-medium">Total Questions:</span>{" "}
                {currentQuiz.questions?.length || 0}
              </p>
              <p className="text-blue-700">
                <span className="font-medium">Status:</span>{" "}
                {currentQuiz.status}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              className={`flex items-center gap-2 px-8 py-4  text-white rounded-lg text-lg font-semibold transform transition`}
            >
              <PlayCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizDetails;
