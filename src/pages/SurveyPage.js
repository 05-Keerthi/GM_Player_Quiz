import React, { useState } from "react";
import { Check, X } from "lucide-react";

const SurveyPage = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      id: 1,
      question: "Are you satisfied with our service?",
      description: "Please share your overall experience with our service",
    },
    {
      id: 2,
      question: "Would you recommend us to others?",
      description:
        "Based on your experience, would you recommend our service to friends or colleagues",
    },
    {
      id: 3,
      question: "Do you plan to continue using our service?",
      description: "Let us know if you plan to stay with us in the future",
    },
  ];

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

  const SurveyContent = () => {
    if (currentQuestion >= questions.length) {
      return (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Survey Complete</h2>
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
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Quick Survey</h2>
          <p className="text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {questions[currentQuestion].question}
          </h3>
          <p className="text-gray-600">
            {questions[currentQuestion].description}
          </p>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => handleAnswer(true)}
              className="bg-green-500 hover:bg-green-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 px-4 rounded-xl"
            >
              <div className="flex items-center py-2">
                <Check className="pr-1"/>
                Yes
              </div>
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className=" bg-red-500 hover:bg-red-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 px-4 rounded-xl"
            >
              <div className="flex items-center py-2">
                <X className="pr-1"/>
                No
              </div>
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
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
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <SurveyContent />
    </div>
  );
};

export default SurveyPage;
