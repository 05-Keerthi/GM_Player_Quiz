import React, { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Menu } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";
import UnifiedSettingsModal from "../models/UnifiedSettingsModal";
import { useQuizContext } from "../context/quizContext";
import { toast } from "react-toastify";
import QuestionEditor from "../components/QuestionEditor";
import SlideEditor from "../components/SlideEditor";

// Custom Alert Component
const CustomAlert = ({ message, type = "error", onClose }) => {
  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-50" : "bg-blue-50";
  const textColor = type === "error" ? "text-red-800" : "text-blue-800";
  const borderColor = type === "error" ? "border-red-200" : "border-blue-200";

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg border ${bgColor} ${textColor} ${borderColor} flex items-center gap-2 max-w-md animate-fade-in z-50`}
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
  const { updateQuiz, publishQuiz } = useQuizContext();
  const [orderedItems, setOrderedItems] = useState([]);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userId = JSON.parse(localStorage.getItem("user"))?.id || "";

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
  });

  const { quizId } = useParams();
  const navigate = useNavigate();

  const closeAllEditors = () => {
    setCurrentQuestion(null);
    setCurrentSlide(null);
    setIsAddQuestionOpen(false);
    setIsAddSlideOpen(false);
  };

  const handlePreviewClick = () => {
    navigate(`/preview/${quizId}`);
  };

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

    if (!token) {
      console.error("No authentication token found");
      navigate("/login");
      throw new Error("Authentication token not found");
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
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

  const handleSettingsUpdate = async (updatedQuiz) => {
    try {
      await updateQuiz(quizId, updatedQuiz);
      setQuiz(updatedQuiz);
      setIsSettingsOpen(false);
      showAlert("Quiz settings updated successfully", "success");
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleSaveQuiz = async () => {
    if (!quizId) {
      showAlert("Cannot save quiz: Invalid quiz ID");
      return;
    }

    try {
      setLoading(true);
      const order = orderedItems
        .map((item) => ({
          id: item.id,
          type: item.type,
        }))
        .filter((item) => item.id);

      const cleanSlides = slides.filter((slide) => slide._id);
      const cleanQuestions = questions.filter((question) => question._id);

      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: quiz.title,
            description: quiz.description,
            questions: cleanQuestions,
            slides: cleanSlides,
            order,
          }),
        }
      );

      showAlert("Quiz saved successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateQuestion = async (questionData) => {
    try {
      setLoading(true);

      if (currentQuestion) {
        // Update existing question
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/questions/${currentQuestion._id}`,
          {
            method: "PUT",
            body: JSON.stringify(questionData),
          }
        );

        const { question: updatedQuestion } = await response.json();

        setQuestions((prevQuestions) =>
          prevQuestions.map((q) =>
            q._id === currentQuestion._id ? updatedQuestion : q
          )
        );

        setOrderedItems((prevItems) =>
          prevItems.map((item) =>
            item.id === currentQuestion._id && item.type === "question"
              ? { ...item, data: updatedQuestion }
              : item
          )
        );

        // Set the current question to show the updated data in the editor
        setCurrentQuestion(updatedQuestion);
        showAlert("Question updated successfully", "success");
      } else {
        // Add new question
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}/questions`,
          {
            method: "POST",
            body: JSON.stringify({ ...questionData, quizId }),
          }
        );

        const newQuestion = await response.json();

        // Update local state with new question
        setQuestions((prev) => [...prev, newQuestion]);

        // Add new question to ordered items
        const updatedOrderedItems = [
          ...orderedItems,
          { id: newQuestion._id, type: "question", data: newQuestion },
        ];
        setOrderedItems(updatedOrderedItems);

        // Set the current question to show the new data in the editor
        setCurrentQuestion(newQuestion);

        // Update quiz order
        await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: quiz.title,
              description: quiz.description,
              questions: [...questions, newQuestion],
              slides,
              order: updatedOrderedItems.map((item) => ({
                id: item.id,
                type: item.type,
              })),
            }),
          }
        );

        showAlert("Question added successfully", "success");
      }
    } catch (err) {
      handleApiError(err);
      closeAllEditors();
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateSlide = async (slideData) => {
    try {
      setLoading(true);

      if (currentSlide) {
        // Update existing slide
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/slides/${currentSlide._id}`,
          {
            method: "PUT",
            body: JSON.stringify(slideData),
          }
        );

        const { slide: updatedSlide } = await response.json();

        setSlides((prevSlides) =>
          prevSlides.map((s) => (s._id === currentSlide._id ? updatedSlide : s))
        );

        setOrderedItems((prevItems) =>
          prevItems.map((item) =>
            item.id === currentSlide._id && item.type === "slide"
              ? { ...item, data: updatedSlide }
              : item
          )
        );

        // Set the current slide to show the updated data in the editor
        setCurrentSlide(updatedSlide);
        showAlert("Slide updated successfully", "success");
      } else {
        // Add new slide
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}/slides`,
          {
            method: "POST",
            body: JSON.stringify({ ...slideData, quizId }),
          }
        );

        const newSlide = await response.json();

        // Update local state with new slide
        setSlides((prev) => [...prev, newSlide]);

        // Add new slide to ordered items
        const updatedOrderedItems = [
          ...orderedItems,
          { id: newSlide._id, type: "slide", data: newSlide },
        ];
        setOrderedItems(updatedOrderedItems);

        // Set the current slide to show the new data in the editor
        setCurrentSlide(newSlide);

        // Update quiz order
        await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              title: quiz.title,
              description: quiz.description,
              questions,
              slides: [...slides, newSlide],
              order: updatedOrderedItems.map((item) => ({
                id: item.id,
                type: item.type,
              })),
            }),
          }
        );

        showAlert("Slide added successfully", "success");
      }
    } catch (err) {
      handleApiError(err);
      closeAllEditors();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const endpoint = deleteType === "question" ? "questions" : "slides";

      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/${endpoint}/${itemToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (deleteType === "question") {
        setQuestions((prev) => prev.filter((q) => q._id !== itemToDelete));
        if (currentQuestion?._id === itemToDelete) setCurrentQuestion(null);
      } else {
        setSlides((prev) => prev.filter((s) => s._id !== itemToDelete));
        if (currentSlide?._id === itemToDelete) setCurrentSlide(null);
      }

      setOrderedItems((prev) =>
        prev.filter(
          (item) => !(item.id === itemToDelete && item.type === deleteType)
        )
      );

      showAlert(
        `${
          deleteType === "question" ? "Question" : "Slide"
        } deleted successfully`,
        "success"
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  const handlePublishQuiz = async () => {
    setIsSubmitting(true);
    try {
      await publishQuiz(quizId);
      toast.success("Quiz published successfully");
      navigate(`/quiz-details?type=quiz&quizId=${quizId}&hostId=${userId}`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemClick = (item) => {
    closeAllEditors();
    if (item.type === "question") {
      setCurrentQuestion(item.data);
    } else {
      setCurrentSlide(item.data);
    }
  };

  const handleReorderItems = async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    try {
      const reorderedItems = [...orderedItems];
      const [movedItem] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, movedItem);

      setOrderedItems(reorderedItems);

      const newSlides = reorderedItems
        .filter((item) => item.type === "slide")
        .map((item) => item.data);
      const newQuestions = reorderedItems
        .filter((item) => item.type === "question")
        .map((item) => item.data);

      setSlides(newSlides);
      setQuestions(newQuestions);

      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: quiz.title,
            description: quiz.description,
            questions: newQuestions,
            slides: newSlides,
            order: reorderedItems.map((item) => ({
              id: item.id,
              type: item.type,
            })),
          }),
        }
      );

      showAlert("Order updated successfully", "success");
    } catch (err) {
      handleApiError(err);
    }
  };

  useEffect(() => {
    const loadQuizData = async () => {
      if (!quizId) {
        showAlert("Invalid quiz ID");
        return;
      }

      try {
        setLoading(true);
        const response = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`
        );

        const quizData = await response.json();

        setQuiz({
          title: quizData.title || "",
          description: quizData.description || "",
        });
        setQuizTitle(quizData.title || "");

        const validQuestions = (quizData.questions || []).filter((q) => q._id);
        const validSlides = (quizData.slides || []).filter((s) => s._id);

        setQuestions(validQuestions);
        setSlides(validSlides);

        let orderItems = [];

        if (quizData.order?.length > 0) {
          orderItems = quizData.order
            .filter((item) => item?.id && item?.type)
            .map((item) => {
              const itemData =
                item.type === "question"
                  ? validQuestions.find((q) => q._id === item.id)
                  : validSlides.find((s) => s._id === item.id);

              return itemData
                ? {
                    id: itemData._id,
                    type: item.type,
                    data: itemData,
                  }
                : null;
            })
            .filter(Boolean);
        }

        if (orderItems.length === 0) {
          orderItems = [
            ...validSlides.map((slide) => ({
              id: slide._id,
              type: "slide",
              data: slide,
            })),
            ...validQuestions.map((question) => ({
              id: question._id,
              type: "question",
              data: question,
            })),
          ];
        }

        setOrderedItems(orderItems);
      } catch (err) {
        handleApiError(err);
        navigate("/quizzes");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, navigate]);

  const isEditorOpen =
    currentQuestion || currentSlide || isAddQuestionOpen || isAddSlideOpen;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "error" })}
        />

        {/* Navigation Bar */}
        <nav className="bg-white border-b shadow-sm relative">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-4">
              {/* Title and Input Section */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full lg:w-auto pr-12 lg:pr-0">
                <span className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 text-transparent bg-clip-text whitespace-nowrap">
                  Quiz Creator
                </span>
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    data-testid="quiz-title-input"
                    placeholder="Enter quiz title..."
                    value={quizTitle}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer"
                    onClick={() => setIsSettingsOpen(true)}
                    readOnly
                  />
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-100 z-20"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Navigation Links */}
              <div
                className={`${
                  isMenuOpen ? "flex" : "hidden"
                } lg:flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3
                w-full lg:w-auto absolute lg:relative top-full left-0 right-0 
                bg-white lg:bg-transparent px-4 pb-4 lg:p-0 z-10 
                border-b lg:border-0 shadow-md lg:shadow-none`}
              >
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-center w-full md:w-auto"
                    onClick={() => navigate("/selectQuizCategory")}
                  >
                    Exit
                  </button>

                  <button
                    data-testid="preview-quiz-btn"
                    onClick={handlePreviewClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center w-full md:w-auto"
                  >
                    Preview
                  </button>

                  <button
                    data-testid="save-quiz-btn"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 
                     flex items-center justify-center gap-2 w-full md:w-auto"
                    onClick={handleSaveQuiz}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save Quiz"
                    )}
                  </button>

                  <button
                    data-testid="publish-quiz-button"
                    onClick={handlePublishQuiz}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 
                     flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      "Publish Quiz"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Questions and Slides List */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-medium text-lg mb-4">Content</h2>
                <div className="space-y-2">
                  {orderedItems.map((item, index) => {
                    // Calculate the sequence number for this type
                    const itemsOfType = orderedItems
                      .slice(0, index + 1)
                      .filter((i) => i.type === item.type);
                    const sequenceNumber = itemsOfType.length;
                    const sequenceLabel = `${
                      item.type === "question" ? "Question" : "Slide"
                    } ${sequenceNumber}`;

                    return (
                      <div
                        key={item.id}
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
                          handleReorderItems(sourceIndex, index);
                        }}
                        className={`p-3 rounded-lg cursor-move transition-colors ${
                          (item.type === "question" &&
                            currentQuestion?._id === item.id) ||
                          (item.type === "slide" &&
                            currentSlide?._id === item.id)
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "hover:bg-gray-50 border border-gray-200"
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sequenceLabel}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item.id);
                              setDeleteType(item.type);
                              setShowDeleteModal(true);
                            }}
                            data-testid={`delete-${item.type}-${item.id}`}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                            aria-label={`Delete ${item.type}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {item.data.title}
                        </p>
                        {item.data.imageUrl && (
                          <div className="mt-2 h-20 flex items-center justify-center">
                            <img
                              src={item.data.imageUrl}
                              alt={
                                item.type === "question"
                                  ? "Question image"
                                  : "Slide image"
                              }
                              className="max-h-full max-w-full object-contain shadow-md rounded p-1"
                              onError={(e) => {
                                e.target.style.display = "none";
                                console.error("Error loading image:", e);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 mt-4">
                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => {
                      // Reset all editing states
                      setCurrentQuestion(null);
                      setCurrentSlide(null);
                      closeAllEditors();
                      // Open new question modal
                      setIsAddQuestionOpen(true);
                    }}
                  >
                    Add Question
                  </button>
                  <button
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => {
                      // Reset all editing states
                      setCurrentQuestion(null);
                      setCurrentSlide(null);
                      closeAllEditors();
                      // Open new slide modal
                      setIsAddSlideOpen(true);
                    }}
                  >
                    Add Slide
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {currentQuestion ? (
                  <QuestionEditor
                    key="edit-question"
                    initialQuestion={currentQuestion}
                    onSubmit={handleAddOrUpdateQuestion}
                    onClose={() => setCurrentQuestion(null)}
                  />
                ) : currentSlide ? (
                  <SlideEditor
                    key="edit-slide"
                    initialSlide={currentSlide}
                    onSubmit={handleAddOrUpdateSlide}
                    onClose={() => setCurrentSlide(null)}
                  />
                ) : isAddQuestionOpen ? (
                  <QuestionEditor
                    key="new-question"
                    initialQuestion={null}
                    onSubmit={handleAddOrUpdateQuestion}
                    onClose={() => setIsAddQuestionOpen(false)}
                  />
                ) : isAddSlideOpen ? (
                  <SlideEditor
                    key="new-slide"
                    initialSlide={null}
                    onSubmit={handleAddOrUpdateSlide}
                    onClose={() => setIsAddSlideOpen(false)}
                  />
                ) : (
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

        {/* Modals */}
        <UnifiedSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSettingsUpdate}
          onTitleUpdate={setQuizTitle}
          initialData={{
            id: quizId,
            title: quiz?.title || "",
            description: quiz?.description || "",
          }}
          type="quiz"
        />

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
            setDeleteType(null);
          }}
          onConfirm={handleDelete}
          title={`Delete ${deleteType === "question" ? "Question" : "Slide"}`}
          message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        />
      </div>
    </>
  );
};

export default QuizCreator;
