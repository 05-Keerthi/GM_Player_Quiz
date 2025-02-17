// components/QuizCreationModal.jsx
import React from "react";
import { Sparkles, PenTool } from "lucide-react";

const QuizCreationModal = ({
  isOpen,
  onClose,
  onCreateWithAI,
  onCreateBlank,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          Choose Your Creation Method
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI-Powered Creation Card */}
          <button
            onClick={onCreateWithAI}
            className="group p-6 border-2 border-purple-200 rounded-xl hover:border-purple-500 transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Create with AI</h3>
              <p className="text-gray-600">
                Let AI help you generate questions and content based on your
                topic
              </p>
            </div>
          </button>

          {/* Blank Canvas Card */}
          <button
            onClick={onCreateBlank}
            className="group p-6 border-2 border-blue-200 rounded-xl hover:border-blue-500 transition-all"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200">
                <PenTool className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Blank Canvas</h3>
              <p className="text-gray-600">
                Start from scratch and create your quiz manually
              </p>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QuizCreationModal;
