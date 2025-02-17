import React, { useState, useEffect } from "react";
import { X, Star, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AIQuizGeneratorModal = ({ isOpen, onClose, quizId }) => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [quizLength, setQuizLength] = useState("5");
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await axios.post(
          "http://localhost:5000/api/agent/topics"
        );
        setTopics(response.data.topics);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        toast.error("Failed to fetch topics");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen]);

  const handleTopicSelect = async (topic) => {
    try {
      setGeneratingQuestions(true);
      setSelectedTopic(topic);

      const requestBody = {
        topic: {
          title: topic.title,
          description: topic.description,
        },
        numQuestions: parseInt(quizLength),
      };

      const response = await axios.post(
        "http://localhost:5000/api/agent/questions",
        requestBody
      );

      if (response.data.questions) {
        setGeneratedQuestions(response.data);
        setShowQuestions(true);
      } else {
        throw new Error("No questions received from the generator");
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error(error.message || "Failed to generate questions");
      setSelectedTopic(null);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleCustomTopicGenerate = async () => {
    if (!customTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    try {
      setGeneratingQuestions(true);

      const requestBody = {
        topic: {
          title: customTopic,
          description: `Custom generated quiz about ${customTopic}`,
        },
        numQuestions: parseInt(quizLength),
      };

      const response = await axios.post(
        "http://localhost:5000/api/agent/questions",
        requestBody
      );

      if (response.data.questions) {
        setGeneratedQuestions(response.data);
        setShowQuestions(true);
      } else {
        throw new Error("No questions received from the generator");
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
      toast.error(error.message || "Failed to generate questions");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSaveQuestions = async () => {
    try {
      setSavingQuestions(true);

      // Transform the questions to have the question field as title
      const transformedQuestions = generatedQuestions.questions.map(
        (question) => ({
          ...question,
          title: question.question, // Add title field with question content
        })
      );

      const response = await axios.post(
        `http://localhost:5000/api/quiz/${quizId}/questions/bulk`,
        {
          questions: transformedQuestions,
        }
      );

      if (response.status === 200) {
        onClose();
      }
      toast.success("Questions added to quiz successfully");
      navigate(`/createQuiz/${quizId}`);
    } catch (error) {
      console.error("Failed to add questions to quiz:", error);
      toast.error(error.message || "Failed to add questions to quiz");
    } finally {
      setSavingQuestions(false);
    }
  };

  const renderQuestionPreview = (question, index) => {
    return (
      <div key={index} className="p-4 border rounded-lg mb-4 bg-white">
        <div className="flex items-start gap-3">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {question.type === "multiple_choice"
              ? "Multiple Choice"
              : "True/False"}
          </span>
        </div>
        <h3 className="font-medium mt-2 mb-3">{question.question}</h3>
        <div className="space-y-2">
          {question.options.map((option, optIndex) => (
            <div
              key={optIndex}
              className={`p-3 rounded-lg flex items-center gap-2 transition-all ${
                option.isCorrect
                  ? "border-l-4 border-green-500"
                  : "border-l-4 border-transparent"
              }`}
              style={{
                backgroundColor: `${option.color}15`,
                borderColor: option.color,
              }}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: option.color }}
              />
              <span className="flex-grow">{option.text}</span>
              {option.isCorrect && (
                <span className="text-green-600 text-sm flex items-center gap-1 flex-shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Correct
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showQuestions ? (
              <button
                onClick={() => setShowQuestions(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {showQuestions ? generatedQuestions?.topic : "Generate Quiz"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>AI assisted</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto border-r">
            {showQuestions ? (
              // Show Generated Questions
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">
                    Generated Questions
                  </h3>
                  <p className="text-gray-600">
                    {generatedQuestions?.questions?.length} questions generated
                    for this quiz
                  </p>
                </div>
                {generatedQuestions?.questions.map((question, index) =>
                  renderQuestionPreview(question, index)
                )}
              </div>
            ) : (
              // Show Topic Selection
              <>
                <div className="flex gap-2 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter your custom topic..."
                      className="w-full p-3 border rounded-lg"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      disabled={generatingQuestions}
                    />
                  </div>
                  <button
                    className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                      generatingQuestions
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700 text-white"
                    }`}
                    onClick={handleCustomTopicGenerate}
                    disabled={generatingQuestions || !customTopic.trim()}
                  >
                    {generatingQuestions ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      Suggested Topics
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                      <div className="col-span-2 text-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading topics...</p>
                      </div>
                    ) : (
                      topics?.map((topic, index) => (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg transition-all ${
                            selectedTopic?.title === topic.title
                              ? "border-blue-500 bg-blue-50"
                              : "hover:border-gray-400"
                          } ${
                            generatingQuestions
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={() =>
                            !generatingQuestions && handleTopicSelect(topic)
                          }
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="p-1 bg-gray-100 rounded">📝</span>
                            <span className="text-sm text-gray-600">Quiz</span>
                          </div>
                          <h3 className="font-medium mb-2">{topic.title}</h3>
                          <p className="text-sm text-gray-600">
                            {topic.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="w-80 p-6 bg-gray-50">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Quiz length</h3>
                  <span className="text-gray-400 hover:text-gray-600 cursor-help">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                </div>
                <select
                  className="w-full p-3 border rounded-lg bg-white"
                  value={quizLength}
                  onChange={(e) => setQuizLength(e.target.value)}
                  disabled={generatingQuestions}
                >
                  <option value="5">5 questions</option>
                  <option value="10">10 questions</option>
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                  <option value="25">25 questions</option>
                  <option value="30">30 questions</option>
                </select>
              </div>

              {generatingQuestions && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium text-blue-700">
                      Generating Quiz
                    </span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Please wait while we generate your quiz questions...
                  </p>
                </div>
              )}

              {showQuestions && (
                <button
                  onClick={handleSaveQuestions}
                  disabled={savingQuestions}
                  className={`w-full px-4 py-3 rounded-lg ${
                    savingQuestions
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {savingQuestions ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Add all questions to quiz"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIQuizGeneratorModal;
