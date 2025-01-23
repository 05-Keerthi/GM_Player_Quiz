import React, { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Menu } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";
import UnifiedSettingsModal from "../models/UnifiedSettingsModal";
import { useQuestionContext } from "../context/questionContext";
import { useSurveyContext } from "../context/surveyContext";
import { useSurveySlideContext } from "../context/surveySlideContext";
import SurveyQuestionEditor from "../models/SurveyQuestionEditor";
import SurveySlideEditor from "../models/SurveySlideEditor";

const LoadingWrapper = ({ loading, children }) => {
  if (!loading) return children;

  return (
    <div
      data-testid="loading-overlay"
      className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="text-center p-4 bg-white rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <div data-testid="loading-text" className="text-gray-600">
          Loading...
        </div>
      </div>
    </div>
  );
};

// Helper Components
const CustomAlert = ({ message, type = "error", onClose }) => {
  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-50" : "bg-blue-50";
  const textColor = type === "error" ? "text-red-800" : "text-blue-800";
  const borderColor = type === "error" ? "border-red-200" : "border-blue-200";

  return (
    <div
      data-testid="error-alert"
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

const processOrderedItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.id && item.type)
    .map((item) => ({
      id: item.id,
      type: item.type,
      data: item.data || null,
    }));
};

const SurveyCreator = () => {
  // State Management
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showSlideDeleteModal, setShowSlideDeleteModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [orderedItems, setOrderedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [slides, setSlides] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user"))?.id || "";
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  // Hooks
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const {
    currentSurvey,
    loading: surveyLoading,
    getSurveyById,
    updateSurvey,
    publishSurvey,
  } = useSurveyContext();

  const {
    loading: questionLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  } = useQuestionContext();

  const {
    loading: slideLoading,
    createSlide,
    updateSlide,
    deleteSlide,
  } = useSurveySlideContext();

  const loading =
    surveyLoading || questionLoading || slideLoading || isSubmitting;

  // Utility Functions
  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "error" }), 5000);
  };

  const handleApiError = (error) => {
    showAlert(error.message || "An error occurred");
    setIsSubmitting(false);
  };

  const clearAllEditors = () => {
    setCurrentQuestion(null);
    setCurrentSlide(null);
    setIsAddingQuestion(false);
    setIsAddingSlide(false);
  };

  // Update Survey Order
  const updateSurveyOrder = async (
    updatedQuestions,
    updatedSlides,
    updatedOrderedItems
  ) => {
    const surveyPayload = {
      title: currentSurvey?.title || "",
      description: currentSurvey?.description || "",
      questions: updatedQuestions.map((q) => q._id),
      slides: updatedSlides.map((s) => s._id),
      order: updatedOrderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      })),
    };
    await updateSurvey(surveyId, surveyPayload);
  };

  // Handler Functions
  const handleAddNewQuestion = () => {
    clearAllEditors();
    setIsAddingQuestion(true);
  };

  const handleAddNewSlide = () => {
    clearAllEditors();
    setIsAddingSlide(true);
  };

  const handleItemClick = (item) => {
    clearAllEditors();
    if (item.type === "question") {
      setCurrentQuestion(item.data);
    } else {
      // For slides, ensure we're using the most up-to-date data
      const currentSlideData = slides.find((s) => s._id === item.data._id);
      setCurrentSlide(currentSlideData || item.data);
    }
  };

  // Question Handlers
  const handleAddQuestion = async (questionData) => {
    setIsSubmitting(true);
    try {
      const newQuestion = await createQuestion(surveyId, questionData);
      if (newQuestion && newQuestion._id) {
        const updatedQuestions = [...questions, newQuestion];
        const newOrderedItem = {
          id: newQuestion._id,
          type: "question",
          data: newQuestion,
        };
        const updatedOrderedItems = [...orderedItems, newOrderedItem];
        setQuestions(updatedQuestions);
        setOrderedItems(processOrderedItems(updatedOrderedItems));
        await updateSurveyOrder(updatedQuestions, slides, updatedOrderedItems);
        setCurrentQuestion(newQuestion);
        showAlert("Question added successfully", "success");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuestion = async (questionId, updatedData) => {
    setIsSubmitting(true);
    try {
      const updatedQuestion = await updateQuestion(
        surveyId,
        questionId,
        updatedData
      );
      if (updatedQuestion && updatedQuestion._id) {
        const updatedQuestions = questions.map((q) =>
          q._id === questionId ? updatedQuestion : q
        );
        const updatedOrderedItems = orderedItems.map((item) =>
          item.type === "question" && item.id === questionId
            ? { ...item, data: updatedQuestion }
            : item
        );
        setQuestions(updatedQuestions);
        setOrderedItems(processOrderedItems(updatedOrderedItems));
        await updateSurveyOrder(updatedQuestions, slides, updatedOrderedItems);
        setCurrentQuestion(updatedQuestion); // Set the updated question as the current question
        showAlert("Question updated successfully", "success");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    setIsSubmitting(true);
    try {
      await deleteQuestion(surveyId, questionId);
      const updatedQuestions = questions.filter((q) => q._id !== questionId);
      const updatedOrderedItems = orderedItems.filter(
        (item) => !(item.type === "question" && item.id === questionId)
      );

      setQuestions(updatedQuestions);
      setOrderedItems(processOrderedItems(updatedOrderedItems));
      await updateSurveyOrder(updatedQuestions, slides, updatedOrderedItems);

      if (currentQuestion?._id === questionId) {
        clearAllEditors();
      }
      showAlert("Question deleted successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Slide Handlers

  const handleAddSlide = async (slideData) => {
    setIsSubmitting(true);
    try {
      const newSlide = await createSlide(surveyId, {
        ...slideData,
        surveyQuiz: surveyId,
      });

      if (newSlide && newSlide._id) {
        const updatedSlides = [...slides, newSlide];
        const newOrderedItem = {
          id: newSlide._id,
          type: "slide",
          data: newSlide,
        };
        const updatedOrderedItems = [...orderedItems, newOrderedItem];

        setSlides(updatedSlides);
        setOrderedItems(processOrderedItems(updatedOrderedItems));
        await updateSurveyOrder(questions, updatedSlides, updatedOrderedItems);

        setCurrentSlide(newSlide);
        showAlert("Slide added successfully", "success");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSlide = async (slideId, updatedData) => {
    setIsSubmitting(true);
    try {
      const updatedSlide = await updateSlide(slideId, updatedData);
      if (updatedSlide && updatedSlide._id) {
        const updatedSlides = slides.map((s) =>
          s._id === slideId ? updatedSlide : s
        );

        const updatedOrderedItems = orderedItems.map((item) =>
          item.type === "slide" && item.id === slideId
            ? { ...item, data: updatedSlide }
            : item
        );

        setSlides(updatedSlides);
        setOrderedItems(processOrderedItems(updatedOrderedItems));

        setCurrentSlide(updatedSlide); // Set the updated slide as the current slide

        await updateSurveyOrder(questions, updatedSlides, updatedOrderedItems);
        showAlert("Slide updated successfully", "success");
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    setIsSubmitting(true);
    try {
      await deleteSlide(slideId);
      const updatedSlides = slides.filter((s) => s._id !== slideId);
      const updatedOrderedItems = orderedItems.filter(
        (item) => !(item.type === "slide" && item.id === slideId)
      );

      setSlides(updatedSlides);
      setOrderedItems(processOrderedItems(updatedOrderedItems));
      await updateSurveyOrder(questions, updatedSlides, updatedOrderedItems);

      if (currentSlide?._id === slideId) {
        clearAllEditors();
      }
      showAlert("Slide deleted successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
      setShowSlideDeleteModal(false);
      setSlideToDelete(null);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!surveyId) {
        showAlert("Invalid survey ID");
        return;
      }

      try {
        const survey = await getSurveyById(surveyId);
        setSurveyTitle(survey.title || "");

        const surveyQuestions = survey.questions || [];
        const surveySlides = survey.slides || [];

        setQuestions(surveyQuestions || []);
        setSlides(surveySlides || []);

        if (
          survey.order &&
          Array.isArray(survey.order) &&
          survey.order.length > 0
        ) {
          const orderedItemsData = survey.order.map((item) => {
            if (item.type === "question") {
              const questionData = surveyQuestions.find(
                (q) => q._id === item.id
              );
              return questionData
                ? { id: questionData._id, type: "question", data: questionData }
                : null;
            } else if (item.type === "slide") {
              const slideData = surveySlides.find((s) => s._id === item.id);
              return slideData
                ? { id: slideData._id, type: "slide", data: slideData }
                : null;
            }
            return null;
          });

          setOrderedItems(processOrderedItems(orderedItemsData));
        } else {
          // Create default order
          const defaultOrder = [
            ...surveySlides.map((slide) => ({
              id: slide._id,
              type: "slide",
              data: slide,
            })),
            ...surveyQuestions.map((question) => ({
              id: question._id,
              type: "question",
              data: question,
            })),
          ];

          setOrderedItems(processOrderedItems(defaultOrder));
          await updateSurveyOrder(surveyQuestions, surveySlides, defaultOrder);
        }
      } catch (error) {
        handleApiError(error);
        navigate("/survey-list");
      }
    };

    loadSurveyData();
  }, [surveyId]);

  const handleSaveSurvey = async () => {
    setIsSubmitting(true);
    try {
      const surveyData = {
        title: surveyTitle,
        description: currentSurvey?.description || "",
        questions: questions.map((q) => q._id),
        slides: slides.map((s) => s._id),
        order: orderedItems.map((item) => ({
          id: item.id,
          type: item.type,
        })),
      };

      await updateSurvey(surveyId, surveyData);
      showAlert("Survey saved successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishSurvey = async () => {
    setIsSubmitting(true);
    try {
      await publishSurvey(surveyId);
      showAlert("Survey published successfully", "success");
      navigate(
        `/survey-details?type=survey&surveyId=${surveyId}&hostId=${userId}`
      );
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settings and Navigation handlers
  const handleSettingsUpdate = async (updatedSettings) => {
    setIsSubmitting(true);
    try {
      const updatePayload = {
        ...currentSurvey,
        title: updatedSettings.title,
        description: updatedSettings.description,
      };

      await updateSurvey(surveyId, updatePayload);
      setSurveyTitle(updatedSettings.title);
      setIsSettingsOpen(false);
      showAlert("Survey settings updated successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewClick = () => {
    navigate(`/SurveyPreview/${surveyId}`);
  };

  // Reorder Items
  const handleReorderItems = async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    try {
      const reorderedItems = [...orderedItems];
      const [movedItem] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, movedItem);

      const processedItems = processOrderedItems(reorderedItems);
      setOrderedItems(processedItems);

      const newQuestions = processedItems
        .filter((item) => item.type === "question")
        .map((item) => item.data);
      const newSlides = processedItems
        .filter((item) => item.type === "slide")
        .map((item) => item.data);

      setQuestions(newQuestions);
      setSlides(newSlides);

      await updateSurveyOrder(newQuestions, newSlides, processedItems);
      showAlert("Order updated successfully", "success");
    } catch (error) {
      handleApiError(error);
      // Revert states if update fails
      setOrderedItems((prev) => [...prev]);
      setQuestions((prev) => [...prev]);
      setSlides((prev) => [...prev]);
    }
  };

  // Render Editor
  const renderEditor = () => {
    if (isAddingQuestion) {
      return (
        <SurveyQuestionEditor
          onUpdate={handleAddQuestion}
          onClose={() => clearAllEditors()}
        />
      );
    }

    if (currentQuestion) {
      return (
        <SurveyQuestionEditor
          question={currentQuestion}
          onUpdate={(updatedData) =>
            handleUpdateQuestion(currentQuestion._id, updatedData)
          }
          onClose={() => clearAllEditors()}
        />
      );
    }

    if (isAddingSlide) {
      return (
        <SurveySlideEditor
          onUpdate={handleAddSlide}
          onClose={() => clearAllEditors()}
        />
      );
    }

    if (currentSlide) {
      return (
        <SurveySlideEditor
          slide={currentSlide}
          onUpdate={(updatedData) =>
            handleUpdateSlide(currentSlide._id, updatedData)
          }
          onClose={() => clearAllEditors()}
        />
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500"
      >
        Select a question or slide to edit or create a new one
      </motion.div>
    );
  };

  return (
    <>
      <Navbar />

      <LoadingWrapper loading={loading}>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <CustomAlert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ message: "", type: "error" })}
          />

          {/* Navigation Bar */}
          <nav className="bg-white border-b shadow-sm relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-4">
                {/* Title and Input Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto pr-12 sm:pr-0">
                  <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 text-transparent bg-clip-text whitespace-nowrap">
                    Survey Creator
                  </span>
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      data-testid="survey-title-input"
                      placeholder="Enter survey title..."
                      value={surveyTitle}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer"
                      onClick={() => setIsSettingsOpen(true)}
                      readOnly
                    />
                  </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="sm:hidden absolute right-4 top-4 p-2 rounded-lg hover:bg-gray-100 z-20"
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
                  } sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto
        absolute sm:relative top-full left-0 right-0 bg-white sm:bg-transparent p-4 sm:p-0 z-10 border-b sm:border-0 shadow-md sm:shadow-none`}
                >
                  <button
                    onClick={() => navigate("/selectSurveyCategory")}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-center"
                  >
                    Exit
                  </button>

                  <button
                    data-testid="preview-button"
                    onClick={handlePreviewClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                  >
                    Preview
                  </button>

                  <button
                    data-testid="save-survey-button"
                    onClick={handleSaveSurvey}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Survey"
                    )}
                  </button>

                  <button
                    data-testid="publish-survey-button"
                    onClick={handlePublishSurvey}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Survey"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Questions and Slides List */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h2 className="font-medium text-lg mb-4">Content</h2>
                  <div data-testid="content-list" className="space-y-2">
                    {loading ? (
                      <div
                        data-testid="content-loading"
                        className="text-center py-4"
                      >
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-gray-500">Loading content...</div>
                      </div>
                    ) : (
                      orderedItems.map((item, index) => {
                        // Calculate separate counters for questions and slides
                        const questionCount = orderedItems
                          .slice(0, index + 1)
                          .filter((i) => i.type === "question").length;
                        const slideCount = orderedItems
                          .slice(0, index + 1)
                          .filter((i) => i.type === "slide").length;

                        return (
                          <div
                            key={item.id}
                            data-testid={`content-item-${index}`}
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
                              <span className="font-medium">
                                {item.type === "question"
                                  ? `Question ${questionCount}`
                                  : `Slide ${slideCount}`}
                              </span>
                              <button
                                data-testid={`delete-${item.type}-${item.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.type === "question") {
                                    setItemToDelete(item.id);
                                    setShowDeleteModal(true);
                                  } else {
                                    setSlideToDelete(item.id);
                                    setShowSlideDeleteModal(true);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Title */}
                            <p className="text-sm text-gray-500 truncate">
                              {item.type === "question"
                                ? item.data.title
                                : item.data.surveyTitle}
                            </p>

                            {/* Image Preview */}
                            {item.data.imageUrl && (
                              <div className="mt-2 h-20 flex items-center justify-center">
                                <img
                                  src={
                                    item.type === "question"
                                      ? item.data.imageUrl
                                      : item.data.imageUrl
                                  }
                                  alt={
                                    item.type === "question"
                                      ? "Question image"
                                      : "Slide image"
                                  }
                                  className="max-h-full max-w-full object-contain shadow-md rounded p-1"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Add Buttons */}
                  <div className="space-y-2 mt-4">
                    <button
                      data-testid="add-question-button"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      onClick={handleAddNewQuestion}
                      disabled={loading}
                    >
                      Add Question
                    </button>
                    <button
                      data-testid="add-slide-button"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      onClick={handleAddNewSlide}
                      disabled={loading}
                    >
                      Add Slide
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor Area */}
              <div className="md:col-span-2">
                <AnimatePresence mode="wait">{renderEditor()}</AnimatePresence>
              </div>
            </div>
          </div>

          {/* Modals */}
          <UnifiedSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSettingsUpdate}
            onTitleUpdate={(title) => setSurveyTitle(title)}
            initialData={{
              id: surveyId,
              title: surveyTitle || currentSurvey?.title || "",
              description: currentSurvey?.description || "",
            }}
            type="survey"
          />

          {/* Delete Confirmation Modals */}
          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            onConfirm={() => handleDeleteQuestion(itemToDelete)}
            title="Delete Question"
            message="Are you sure you want to delete this question? This action cannot be undone."
          />

          <ConfirmationModal
            isOpen={showSlideDeleteModal}
            onClose={() => {
              setShowSlideDeleteModal(false);
              setSlideToDelete(null);
            }}
            onConfirm={() => handleDeleteSlide(slideToDelete)}
            title="Delete Slide"
            message="Are you sure you want to delete this slide? This action cannot be undone."
          />
        </div>
      </LoadingWrapper>
    </>
  );
};

export default SurveyCreator;
