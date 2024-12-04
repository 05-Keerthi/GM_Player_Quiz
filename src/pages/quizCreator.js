import React, { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  X,
  CheckSquare,
  ToggleLeft,
  MessageSquare,
  BarChart3,
  ListChecks,
  Trash2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionTypeModal from "../models/QuestionTypeModal";
import SettingsModal from "../models/SettingsModal";
import QuestionEditor from "../components/QuestionEditor";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavbarComp";
import SlideTypeModal from "../models/SlideTypeModal";
import ConfirmationModal from "../models/ConfirmationModal";
import SlideEditor from "../components/SlideEditor";
// Custom Alert Component
const CustomAlert = ({ message, type = "error", onClose }) => {
  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-50" : "bg-blue-50";
  const textColor = type === "error" ? "text-red-800" : "text-blue-800";
  const borderColor = type === "error" ? "border-red-200" : "border-blue-200";

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor} flex items-center gap-2 max-w-md animate-fade-in`}
    >
      <AlertCircle className="w-5 h-5" />
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="p-1 hover:bg-white rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const QuizCreator = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [showDeleteSlideModal, setShowDeleteSlideModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
  });
  const { quizId } = useParams();
  const navigate = useNavigate();

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "error" }), 5000);
  };

  const handleApiError = (error) => {
    showAlert(error.message || "An error occurred");
    setLoading(false);
  };

  const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem("token");

    // Add more detailed logging

    if (!token) {
      console.error("No authentication token found");
      navigate("/login"); // Redirect to login page
      throw new Error("Authentication token not found");
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Ensure this matches your backend expectation
        },
      });

      // More detailed error handling
      if (response.status === 401) {
        console.error("Unauthorized access - token may be invalid or expired");
        localStorage.removeItem("token"); // Clear potentially invalid token
        navigate("/login");
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API Error Response:", errorBody);
        throw new Error(errorBody || "API request failed");
      }

      return response;
    } catch (error) {
      console.error("Fetch error:", error);
      throw error;
    }
  };

  const handleSettingsUpdate = (updatedQuiz) => {
    setQuiz(updatedQuiz);
    setIsSettingsOpen(false);
    showAlert("Quiz settings updated successfully", "success");
  };

  const handleSaveQuiz = async () => {
    if (!quizId) {
      showAlert("Cannot save quiz: Invalid quiz ID");
      return;
    }

    try {
      setLoading(true);
      await authenticatedFetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          questions,
        }),
      });

      showAlert("Quiz saved successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to upload the image and get the image ObjectId
  const handleImageUpload = async (file) => {
    const formData = new FormData();
    const token = localStorage.getItem("token");
    formData.append("media", file);
    // Send the image file

    // Make the request to upload the image
    const response = await fetch("http://localhost:5000/api/media/upload", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Image upload failed");
    }

    const data = await response.json();
    return data.imageId; // Return the image's ObjectId from the response
  };

  // Define the refreshSlides
  const refreshSlides = async () => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:5000/api/quizzes/${quizId}/slides`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch slides: ${response.statusText}`);
      }
      const updatedSlides = await response.json();
      setSlides(updatedSlides); // Refresh state with updated slides
    } catch (err) {
      console.error("Error refreshing slides:", err);
    }
  };

  // Slide Functions
  const handleAddSlide = async (slideData) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:5000/api/quizzes/${quizId}/slides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...slideData,
            quizId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add slide: ${response.statusText}`);
      }

      const newSlide = await response.json();
      setSlides((prevSlides) => [...prevSlides, newSlide]);
      setCurrentSlide(newSlide);
      await refreshSlides();
      setIsAddSlideOpen(false);
      showAlert("Slide added successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async (slideId, updatedData) => {
    try {
      setLoading(true);
      let imageId = null;

      if (updatedData.imageFile) {
        imageId = await handleImageUpload(updatedData.imageFile);
      }

      const updatePayload = {
        ...updatedData,
        imageUrl: imageId || updatedData.imageUrl,
      };

      const response = await authenticatedFetch(
        `http://localhost:5000/api/slides/${slideId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update slide: ${response.statusText}`);
      }

      const updatedSlide = await response.json();
      setSlides((prevSlides) =>
        prevSlides.map((s) => (s._id === slideId ? updatedSlide : s))
      );
      setCurrentSlide(updatedSlide);
      showAlert("Slide updated successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (e, slideId) => {
    e.stopPropagation();
    setItemToDelete(slideId);
    setShowDeleteSlideModal(true);
  };

  const handleConfirmDeleteSlide = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:5000/api/slides/${itemToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete slide: ${response.statusText}`);
      }

      setSlides((prevSlides) =>
        prevSlides.filter((s) => s._id !== itemToDelete)
      );
      if (currentSlide?._id === itemToDelete) {
        setCurrentSlide(null);
      }
      showAlert("Slide deleted successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteSlideModal(false);
      setItemToDelete(null);
    }
  };

  const handleReorderSlides = (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    const reorderedSlides = [...slides];
    const [movedSlide] = reorderedSlides.splice(sourceIndex, 1);
    reorderedSlides.splice(destinationIndex, 0, movedSlide);
    setSlides(reorderedSlides);
  };

  // Question Functions
  const handleAddQuestion = async (questionData) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:5000/api/quizzes/${quizId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...questionData,
            quizId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add question: ${response.statusText}`);
      }

      const newQuestion = await response.json();
      setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);
      setCurrentQuestion(newQuestion);
      setIsAddQuestionOpen(false);
      showAlert("Question added successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = async (questionId, updatedData) => {
    try {
      setLoading(true);
      let imageId = null;

      if (updatedData.imageFile) {
        imageId = await handleImageUpload(updatedData.imageFile);
      }

      const updatePayload = {
        ...updatedData,
        imageUrl: imageId || updatedData.imageUrl,
      };

      const response = await authenticatedFetch(
        `http://localhost:5000/api/questions/${questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update question: ${response.statusText}`);
      }

      const updatedQuestion = await response.json();
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q._id === questionId ? updatedQuestion : q))
      );
      setCurrentQuestion(updatedQuestion);
      showAlert("Question updated successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (e, questionId) => {
    e.stopPropagation();
    setItemToDelete(questionId);
    setShowDeleteQuestionModal(true);
  };

  const handleConfirmDeleteQuestion = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `http://localhost:5000/api/questions/${itemToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete question: ${response.statusText}`);
      }

      setQuestions((prevQuestions) =>
        prevQuestions.filter((q) => q._id !== itemToDelete)
      );
      if (currentQuestion?._id === itemToDelete) {
        setCurrentQuestion(null);
      }
      showAlert("Question deleted successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteQuestionModal(false);
      setItemToDelete(null);
    }
  };

  const handleReorderQuestions = (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    const reorderedQuestions = [...questions];
    const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
    reorderedQuestions.splice(destinationIndex, 0, movedQuestion);
    setQuestions(reorderedQuestions);
  };

  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) {
        showAlert("Invalid quiz ID");
        return;
      }

      try {
        setLoading(true);
        const quizResponse = await authenticatedFetch(
          `http://localhost:5000/api/quizzes/${quizId}`
        );
        const quizData = await quizResponse.json();

        setQuiz({
          title: quizData.title || "",
          description: quizData.description || "",
        });

        setSlides(quizData.slides || []);
        setQuestions(quizData.questions || []);
      } catch (err) {
        handleApiError(err);
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, navigate]);

  return (
    <>
      <>
        <Navbar />
      </>
      <>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          {/* Custom Alert */}
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ message: "", type: "error" })}
          />

          {/* Top Navigation */}
          <nav className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 text-transparent bg-clip-text">
                  GM Play...!
                </span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter quiz title..."
                    value={quiz?.title || ""}
                    className="w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer"
                    onClick={() => setIsSettingsOpen(true)}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  onClick={() => navigate("/select-category")}
                >
                  Exit
                </button>
                <button
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={handleSaveQuiz}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Quiz"}
                </button>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Questions List */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="font-medium text-lg mb-4">Questions</h2>
                  <div className="space-y-2">
                    {questions.map((question, index) => (
                      <div
                        key={question._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "text/plain",
                            index.toString()
                          );
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIndex = parseInt(
                            e.dataTransfer.getData("text/plain"),
                            10
                          );
                          handleReorderQuestions(sourceIndex, index);
                        }}
                        className={`p-3 rounded-lg cursor-move transition-colors ${
                          currentQuestion?._id === question._id
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                        onClick={() => {
                          setCurrentQuestion(question);
                          setCurrentSlide(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Question {index + 1}
                          </span>
                          <button
                            onClick={(e) =>
                              handleDeleteQuestion(e, question._id)
                            }
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {question.title}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-medium text-lg mb-4 mt-4">Slides</h2>
                    {slides.map((slide, index) => (
                      <div
                        key={slide._id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "text/plain",
                            index.toString()
                          );
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sourceIndex = parseInt(
                            e.dataTransfer.getData("text/plain"),
                            10
                          );
                          handleReorderSlides(sourceIndex, index);
                        }}
                        className={`p-3 rounded-lg cursor-move transition-colors ${
                          currentSlide?._id === slide._id
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                        onClick={() => {
                          setCurrentSlide(slide);
                          setCurrentQuestion(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Slide {index + 1}</span>
                          <button
                            onClick={(e) => handleDeleteSlide(e, slide._id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {slide.title}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setIsAddQuestionOpen(true)}
                  >
                    Add Question
                  </button>
                  <button
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setIsAddSlideOpen(true)}
                  >
                    Add Slide
                  </button>
                </div>
              </div>

              {/* Question and Slide Editor Container */}
              <div className="md:col-span-2">
                <AnimatePresence>
                  {currentQuestion ? (
                    // Render the QuestionEditor if there's a current question
                    <QuestionEditor
                      question={currentQuestion}
                      onUpdate={(updatedData) =>
                        handleUpdateQuestion(
                          currentQuestion.id || currentQuestion._id,
                          updatedData
                        )
                      }
                      onClose={() => setCurrentQuestion(null)}
                    />
                  ) : currentSlide ? (
                    // Render the SlideEditor if there's a current slide
                    <SlideEditor
                      slide={currentSlide}
                      onUpdate={(updatedData) =>
                        handleUpdateSlide(currentSlide._id, updatedData)
                      }
                      onClose={() => setCurrentSlide(null)}
                    />
                  ) : (
                    // Show placeholder message when no editor is selected
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500"
                    >
                      Select a question or slide to edit or create a new one
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Add Question Modal */}
          <QuestionTypeModal
            isOpen={isAddQuestionOpen}
            onClose={() => setIsAddQuestionOpen(false)}
            onAddQuestion={handleAddQuestion}
          />

          <SlideTypeModal
            isOpen={isAddSlideOpen}
            onClose={() => setIsAddSlideOpen(false)}
            onAddSlide={handleAddSlide}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSettingsUpdate}
            initialData={{
              quizId: quizId,
              title: quiz?.title || "",
              description: quiz?.description || "",
            }}
          />

          <ConfirmationModal
            isOpen={showDeleteQuestionModal}
            onClose={() => {
              setShowDeleteQuestionModal(false);
              setItemToDelete(null);
            }}
            onConfirm={handleConfirmDeleteQuestion}
            title="Delete Question"
            message="Are you sure you want to delete this question? This action cannot be undone."
          />

          <ConfirmationModal
            isOpen={showDeleteSlideModal}
            onClose={() => {
              setShowDeleteSlideModal(false);
              setItemToDelete(null);
            }}
            onConfirm={handleConfirmDeleteSlide}
            title="Delete Slide"
            message="Are you sure you want to delete this slide? This action cannot be undone."
          />
        </div>
      </>
    </>
  );
};

export default QuizCreator;
