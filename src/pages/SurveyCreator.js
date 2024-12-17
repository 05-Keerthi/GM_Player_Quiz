// SurveyCreator.js
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

const SurveyCreator = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "error" });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [surveyTitle, setSurveyTitle] = useState("");
  const { surveyId } = useParams();
  const navigate = useNavigate();

  const {
    state: surveyState,
    currentSurvey,
    loading: surveyLoading,
    getSurveyById,
    updateSurvey,
  } = useSurveyContext();

  const {
    state: questionState,
    questions,
    loading: questionLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    getAllQuestions,
  } = useQuestionContext();

  const loading = surveyLoading || questionLoading;

  const showAlert = (message, type = "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "error" }), 5000);
  };

  const handleApiError = (error) => {
    showAlert(error.message || "An error occurred");
  };

  const handleSettingsUpdate = async (updatedSurvey) => {
    try {
      await updateSurvey(surveyId, updatedSurvey);
      setIsSettingsOpen(false);
      showAlert("Survey settings updated successfully", "success");
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    const token = localStorage.getItem("token");
    formData.append("media", file);

    try {
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
      // The API returns media array with the first item containing the uploaded image info
      const imageUrl = data.media[0]._id;
      return imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleAddQuestion = async (questionData) => {
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

      await createQuestion(surveyId, questionPayload);
      setIsAddingQuestion(false);
      showAlert("Question added successfully", "success");
      await getAllQuestions(surveyId);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleUpdateQuestion = async (questionId, updatedData) => {
    try {
      let imageId = null;

      if (updatedData.imageFile) {
        // Only upload if there's a new file
        const formData = new FormData();
        formData.append("media", updatedData.imageFile);

        const response = await fetch("http://localhost:5000/api/media/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Image upload failed");
        }

        const data = await response.json();
        imageId = data.media[0]._id;
      }

      const updatePayload = {
        ...updatedData,
        imageUrl: imageId || updatedData.imageUrl, // Use new ID or keep existing Media ID
      };
      delete updatePayload.imageFile;

      await updateQuestion(surveyId, questionId, updatePayload);
      setCurrentQuestion(null);
      showAlert("Question updated successfully", "success");
      await getAllQuestions(surveyId);
    } catch (error) {
      handleApiError(error);
    }
  };
  const handleDeleteQuestion = (e, questionId) => {
    e.stopPropagation();
    setItemToDelete(questionId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuestion(surveyId, itemToDelete);
      if (currentQuestion?._id === itemToDelete) {
        setCurrentQuestion(null);
      }
      showAlert("Question deleted successfully", "success");
      await getAllQuestions(surveyId);
    } catch (error) {
      handleApiError(error);
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleReorderQuestions = async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    const reorderedQuestions = [...questions];
    const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
    reorderedQuestions.splice(destinationIndex, 0, movedQuestion);

    try {
      await updateSurvey(surveyId, { questions: reorderedQuestions });
      await getAllQuestions(surveyId);
    } catch (error) {
      handleApiError(error);
    }
  };

  useEffect(() => {
    const loadSurveyData = async () => {
      if (!surveyId) {
        showAlert("Invalid survey ID");
        return;
      }

      try {
        const survey = await getSurveyById(surveyId);
        setSurveyTitle(survey.title || ""); // Add this line
        await getAllQuestions(surveyId);
      } catch (error) {
        handleApiError(error);
        navigate("/surveys");
      }
    };

    loadSurveyData();
  }, [surveyId, navigate]);

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
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
                onClick={() => updateSurvey(surveyId)}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
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
                        e.dataTransfer.setData("text/plain", index.toString());
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
                      onClick={() => setCurrentQuestion(question)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Question {index + 1}
                        </span>
                        <button
                          onClick={(e) => handleDeleteQuestion(e, question._id)}
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
                <button
                  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => setIsAddingQuestion(true)}
                >
                  Add Question
                </button>
              </div>
            </div>

            {/* Question Editor Container */}
            <div className="md:col-span-2">
              <AnimatePresence>
                {currentQuestion || isAddingQuestion ? (
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
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500"
                  >
                    Select a question to edit or create a new one
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

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Question"
          message="Are you sure you want to delete this question? This action cannot be undone."
        />
      </div>
    </>
  );
};

export default SurveyCreator;
