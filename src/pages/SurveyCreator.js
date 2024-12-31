import React, { useState, useEffect } from "react";
import { X, Trash2, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import SurveyQuestionEditor from "../models/SurveyQuestionEditor";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";
import { useQuestionContext } from "../context/questionContext";
import { useSurveyContext } from "../context/surveyContext";
import UnifiedSettingsModal from "../models/UnifiedSettingsModal";
import SurveySlideEditor from "../models/SurveySlideEditor";
import { useSurveySlideContext } from "../context/surveySlideContext";

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

const SurveyCreator = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(null);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [showSlideDeleteModal, setShowSlideDeleteModal] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState(null);
  const [orderedItems, setOrderedItems] = useState([]);
  const [surveyTitle, setSurveyTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { surveyId } = useParams();
  const navigate = useNavigate();

  const {
    currentSurvey,
    loading: surveyLoading,
    getSurveyById,
    updateSurvey,
  } = useSurveyContext();

  const {
    loading: questionLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestions,
  } = useQuestionContext();

  const {
    loading: slideLoading,
    createSlide,
    updateSlide,
    deleteSlide,
    getAllSlides,
  } = useSurveySlideContext();

  const loading =
    surveyLoading || questionLoading || slideLoading || isSubmitting;

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "error" }), 5000);
  };

  const handleApiError = (error) => {
    showAlert(error.message || "An error occurred");
    setIsSubmitting(false);
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    const token = localStorage.getItem("token");
    formData.append("media", file);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.media[0]._id;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleAddQuestion = async (questionData) => {
    setIsSubmitting(true);
    try {
      let imageId = null;
      if (questionData.imageFile) {
        imageId = await handleImageUpload(questionData.imageFile);
      }

      const questionPayload = {
        ...questionData,
        imageUrl: imageId || questionData.imageUrl,
      };
      delete questionPayload.imageFile;

      const newQuestion = await createQuestion(surveyId, questionPayload);

      if (newQuestion && newQuestion._id) {
        setOrderedItems((prevItems) => {
          const newItems = [
            ...prevItems,
            {
              id: newQuestion._id,
              type: "question",
              data: newQuestion,
            },
          ];

          // Update survey with new order
          const orderPayload = newItems.map((item) => ({
            id: item.id,
            type: item.type,
          }));

          // Update survey with both questions and order
          updateSurvey(surveyId, {
            questions: newItems
              .filter((item) => item.type === "question")
              .map((item) => item.id),
            order: orderPayload,
          });

          return newItems;
        });

        // Refresh survey data
        await getSurveyById(surveyId);
        setIsAddingQuestion(false);
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
      let imageId = null;
      if (updatedData.imageFile) {
        imageId = await handleImageUpload(updatedData.imageFile);
      }

      const updatePayload = {
        ...updatedData,
        imageUrl: imageId || updatedData.imageUrl,
      };
      delete updatePayload.imageFile;

      const updatedQuestion = await updateQuestion(
        surveyId,
        questionId,
        updatePayload
      );

      if (updatedQuestion && updatedQuestion._id) {
        setOrderedItems((prevItems) =>
          prevItems.map((item) =>
            item.type === "question" && item.id === questionId
              ? {
                  ...item,
                  data: updatedQuestion,
                }
              : item
          )
        );
      }

      setCurrentQuestion(null);
      showAlert("Question updated successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSlide = async (slideData) => {
    setIsSubmitting(true);
    try {
      let imageId = null;
      if (slideData.imageFile) {
        imageId = await handleImageUpload(slideData.imageFile);
      }

      const slidePayload = {
        ...slideData,
        surveyQuiz: surveyId,
        imageUrl: imageId || slideData.imageUrl,
      };
      delete slidePayload.imageFile;

      const newSlide = await createSlide(surveyId, slidePayload);

      if (newSlide && newSlide._id) {
        setOrderedItems((prevItems) => {
          const newItems = [
            ...prevItems,
            {
              id: newSlide._id,
              type: "slide",
              data: newSlide,
            },
          ];

          // Update survey with new order
          const orderPayload = newItems.map((item) => ({
            id: item.id,
            type: item.type,
          }));

          // Update survey with both slides and order
          updateSurvey(surveyId, {
            slides: newItems
              .filter((item) => item.type === "slide")
              .map((item) => item.id),
            order: orderPayload,
          });

          return newItems;
        });

        // Refresh survey data
        await getSurveyById(surveyId);
        setIsAddingSlide(false);
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
      let imageId = null;
      if (updatedData.imageFile) {
        imageId = await handleImageUpload(updatedData.imageFile);
      }

      const updatePayload = {
        ...updatedData,
        imageUrl: imageId || updatedData.imageUrl,
      };
      delete updatePayload.imageFile;

      const updatedSlide = await updateSlide(slideId, updatePayload);

      if (updatedSlide && updatedSlide._id) {
        setOrderedItems((prevItems) =>
          prevItems.map((item) =>
            item.type === "slide" && item.id === slideId
              ? {
                  ...item,
                  data: updatedSlide,
                }
              : item
          )
        );
      }

      setCurrentSlide(null);
      showAlert("Slide updated successfully", "success");
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

      setOrderedItems((prevItems) => {
        const newItems = prevItems.filter(
          (item) => !(item.id === questionId && item.type === "question")
        );

        const orderPayload = newItems.map((item) => ({
          id: item.id,
          type: item.type,
        }));

        updateSurvey(surveyId, {
          order: orderPayload,
        });

        return newItems;
      });

      if (currentQuestion?._id === questionId) {
        setCurrentQuestion(null);
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

  const handleDeleteSlide = async (slideId) => {
    setIsSubmitting(true);
    try {
      await deleteSlide(slideId);

      setOrderedItems((prevItems) => {
        const newItems = prevItems.filter(
          (item) => !(item.id === slideId && item.type === "slide")
        );

        const orderPayload = newItems.map((item) => ({
          id: item.id,
          type: item.type,
        }));

        updateSurvey(surveyId, {
          order: orderPayload,
        });

        return newItems;
      });

      if (currentSlide?._id === slideId) {
        setCurrentSlide(null);
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

  const handleReorderItems = async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    try {
      const reorderedItems = [...orderedItems];
      const [movedItem] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, movedItem);

      setOrderedItems(reorderedItems);

      const orderPayload = reorderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      await updateSurvey(surveyId, {
        order: orderPayload,
      });

      showAlert("Order updated successfully", "success");
    } catch (error) {
      handleApiError(error);
      setOrderedItems((prev) => [...prev]);
    }
  };

  // Load initial survey data
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!surveyId) {
        showAlert("Invalid survey ID");
        return;
      }

      try {
        const survey = await getSurveyById(surveyId);
        setSurveyTitle(survey.title || "");

        const surveyQuestions = await getAllQuestions(surveyId);
        const surveySlides = await getAllSlides(surveyId);

        let finalOrderedItems = [];

        if (surveyQuestions && surveySlides) {
          if (
            survey.order &&
            Array.isArray(survey.order) &&
            survey.order.length > 0
          ) {
            finalOrderedItems = survey.order
              .filter((item) => item && item.id)
              .map((item) => {
                if (item.type === "question") {
                  const questionData = surveyQuestions.find(
                    (q) => q._id === item.id
                  );
                  return questionData
                    ? {
                        id: questionData._id,
                        type: "question",
                        data: questionData,
                      }
                    : null;
                } else if (item.type === "slide") {
                  const slideData = surveySlides.find((s) => s._id === item.id);
                  return slideData
                    ? {
                        id: slideData._id,
                        type: "slide",
                        data: slideData,
                      }
                    : null;
                }
                return null;
              })
              .filter(Boolean);
          } else {
            finalOrderedItems = [
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
          }
        }

        setOrderedItems(finalOrderedItems);
      } catch (error) {
        handleApiError(error);
        navigate("/survey-list");
      }
    };

    loadSurveyData();
  }, [surveyId]);

  // Update survey title when currentSurvey changes
  useEffect(() => {
    if (currentSurvey?.title) {
      setSurveyTitle(currentSurvey.title);
    }
  }, [currentSurvey]);

  const handleSettingsUpdate = async (updatedSurvey) => {
    setIsSubmitting(true);
    try {
      await updateSurvey(surveyId, updatedSurvey);
      setSurveyTitle(updatedSurvey.title);
      setIsSettingsOpen(false);
      showAlert("Survey settings updated successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveClick = async () => {
    setIsSubmitting(true);
    try {
      const orderArray = orderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      await updateSurvey(surveyId, {
        title: surveyTitle,
        description: currentSurvey?.description || "",
        questions: orderedItems
          .filter((item) => item.type === "question")
          .map((item) => item.id),
        slides: orderedItems
          .filter((item) => item.type === "slide")
          .map((item) => item.id),
        order: orderArray,
      });

      await getSurveyById(surveyId);
      showAlert("Survey saved successfully", "success");
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewClick = () => {
    navigate(`/SurveyPreview/${surveyId}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "error" })}
        />

        <nav className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 text-transparent bg-clip-text">
                Survey Creator
              </span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter survey title..."
                  value={surveyTitle}
                  className="w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none cursor-pointer"
                  onClick={() => setIsSettingsOpen(true)}
                  readOnly
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                onClick={() => navigate("/selectSurveyCategory")}
              >
                Exit
              </button>
              <button
                onClick={handlePreviewClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ml-2"
              >
                Preview
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
                onClick={handleSaveClick}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Questions and Slides List */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="font-medium text-lg mb-4">Content</h2>
                <div className="space-y-2">
                  {orderedItems.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", index.toString());
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
                        (item.type === "slide" && currentSlide?._id === item.id)
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "hover:bg-gray-50 border border-gray-200"
                      }`}
                      onClick={() => {
                        if (item.type === "question") {
                          setCurrentQuestion(item.data);
                          setCurrentSlide(null);
                        } else {
                          setCurrentSlide(item.data);
                          setCurrentQuestion(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {item.type === "question"
                            ? `Question ${index + 1}`
                            : `Slide ${index + 1}`}
                        </span>
                        <button
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
                      <p className="text-sm text-gray-500 truncate">
                        {item.type === "question"
                          ? item.data.title
                          : item.data.surveyTitle}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <button
                    className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                    onClick={() => setIsAddingQuestion(true)}
                    disabled={loading}
                  >
                    Add Question
                  </button>
                  <button
                    className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                    onClick={() => setIsAddingSlide(true)}
                    disabled={loading}
                  >
                    Add Slide
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div className="md:col-span-2">
              <AnimatePresence>
                {/* Question Editor */}
                {(currentQuestion || isAddingQuestion) && (
                  <SurveyQuestionEditor
                    question={currentQuestion}
                    onUpdate={
                      currentQuestion
                        ? (updatedData) =>
                            handleUpdateQuestion(
                              currentQuestion._id,
                              updatedData
                            )
                        : handleAddQuestion
                    }
                    onClose={() => {
                      setCurrentQuestion(null);
                      setIsAddingQuestion(false);
                    }}
                  />
                )}

                {/* Slide Editor */}
                {(currentSlide || isAddingSlide) && (
                  <SurveySlideEditor
                    slide={currentSlide}
                    onUpdate={
                      currentSlide
                        ? (data) => handleUpdateSlide(currentSlide._id, data)
                        : handleAddSlide
                    }
                    onClose={() => {
                      setCurrentSlide(null);
                      setIsAddingSlide(false);
                    }}
                  />
                )}

                {/* Default State Message */}
                {!currentQuestion &&
                  !isAddingQuestion &&
                  !currentSlide &&
                  !isAddingSlide && (
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
          onTitleUpdate={setSurveyTitle}
          initialData={{
            id: surveyId,
            title: currentSurvey?.title || "",
            description: currentSurvey?.description || "",
          }}
          type="survey"
        />

        {/* Delete Confirmation Modals */}
        {showDeleteModal && (
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
        )}

        {showSlideDeleteModal && (
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
        )}
      </div>
    </>
  );
};

export default SurveyCreator;
