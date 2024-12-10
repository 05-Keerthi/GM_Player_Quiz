import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react";

const SurveyPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);

  const questions = [
    {
      id: 1,
      question: "Are you satisfied with our service?",
      description: "Please share your overall experience with our service",
      image: "/api/placeholder/500/400",
      imageUrl:
        "https://images.unsplash.com/photo-1552581234-26160f608093?w=500&h=400",
    },
    {
      id: 2,
      question: "Would you recommend us to others?",
      description:
        "Based on your experience, would you recommend our service to friends or colleagues",
      image: "/api/placeholder/500/400",
      imageUrl:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&h=400",
    },
    {
      id: 3,
      question: "Do you plan to continue using our service?",
      description: "Let us know if you plan to stay with us in the future",
      image: "/api/placeholder/500/400",
      imageUrl:
        "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=500&h=400",
    },
  ];

  useEffect(() => {
    let timer;
    if (currentQuestion < questions.length) {
      setTimeLeft(30);
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleAnswer(false);
            return 30;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentQuestion]);

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestion].id]: answer,
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    console.log("Survey answers:", answers);
    alert("Thank you for completing the survey!");
  };

  const TimerHexagon = ({ seconds }) => (
    <div className="relative w-14 h-14 md:w-16 md:h-16 mx-auto mb-4">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d="M50 3.5L90.9 28.25L90.9 77.75L50 102.5L9.1 77.75L9.1 28.25Z"
          fill="#f3f4f6"
          stroke="#6b7280"
          strokeWidth="2"
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="text-xl md:text-2xl font-bold"
          fill="#374151"
        >
          {seconds}
        </text>
      </svg>
    </div>
  );

  const SurveyContent = () => {
    if (currentQuestion >= questions.length) {
      return (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              Survey Complete
            </h2>
            <p className="text-gray-600">
              Thank you for taking the time to complete our survey!
            </p>
          </div>
          <div className="space-y-4">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-sm sm:text-base">{q.question}</span>
                <span className="font-semibold ml-2">
                  {answers[q.id] ? "Yes" : "No"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setCurrentQuestion(0)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4 md:p-6">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">
          Quick Survey
        </h2>
        <p className="text-gray-600 text-center mb-4 md:mb-6">
          Question {currentQuestion + 1} of {questions.length}
        </p>

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          {/* Left side - Question content */}
          <div className="w-full md:w-1/2 space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-semibold">
                {questions[currentQuestion].question}
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {questions[currentQuestion].description}
              </p>
            </div>

            <TimerHexagon seconds={timeLeft} />

            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => handleAnswer(true)}
                className="bg-green-500 hover:bg-green-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 px-6 md:px-8 py-2 md:py-3 rounded-xl w-full sm:w-auto"
              >
                <div className="flex items-center justify-center">
                  <Check className="mr-2 h-5 w-5" />
                  Yes
                </div>
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="bg-red-500 hover:bg-red-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-6 md:px-8 py-2 md:py-3 rounded-xl w-full sm:w-auto"
              >
                <div className="flex items-center justify-center">
                  <X className="mr-2 h-5 w-5" />
                  No
                </div>
              </button>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentQuestion === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Back
              </button>
              <div className="flex space-x-1">
                {questions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentQuestion
                        ? "bg-blue-500"
                        : index < currentQuestion
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="w-full md:w-1/2 order-first md:order-last">
            <div className="relative h-48 sm:h-64 md:h-[400px]">
              <img
                src={questions[currentQuestion].imageUrl}
                alt="Survey illustration"
                className="absolute inset-0 w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <SurveyContent />
    </div>
  );
};

export default SurveyPage;
