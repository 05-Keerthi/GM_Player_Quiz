import React, { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, Menu } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionTypeModal from "../models/QuestionTypeModal";
import QuestionEditor from "../components/QuestionEditor";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/NavbarComp";
import SlideTypeModal from "../models/SlideTypeModal";
import ConfirmationModal from "../models/ConfirmationModal";
import SlideEditor from "../components/SlideEditor";
import UnifiedSettingsModal from "../models/UnifiedSettingsModal";
import { useQuizContext } from "../context/quizContext";
import { toast } from "react-toastify";

// Custom Alert Component
const CustomAlert = ({ message, type = "error", onClose }) => {
  if (!message) return null;

  const bgColor = type === "error" ? "bg-red-50" : "bg-blue-50";
  const textColor = type === "error" ? "text-red-800" : "text-blue-800";
  const borderColor = type === "error" ? "border-red-200" : "border-blue-200";

  return (
    <div
      data-testid="alert-message"
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
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [showDeleteSlideModal, setShowDeleteSlideModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = JSON.parse(localStorage.getItem("user"))?.id || "";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
  });

  const { quizId } = useParams();
  const navigate = useNavigate();

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
        console.error("Unauthorized access - token may be invalid or expired");
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
      // Format order array properly
      const order = orderedItems
        .map((item) => ({
          id: item.id,
          type: item.type,
        }))
        .filter((item) => item.id); // Filter out any items without id

      // Get actual slides and questions arrays
      const cleanSlides = slides.filter((slide) => slide._id); // Filter out malformed slides
      const cleanQuestions = questions.filter((question) => question._id); // Filter out malformed questions

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

  const handleAddSlide = async (slideData) => {
    try {
      setLoading(true);
      console.log("Sending slide data:", slideData);

      const response = await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}/slides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(slideData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add slide: ${response.statusText}`);
      }

      const newSlide = await response.json();
      console.log("Received slide response:", newSlide);

      // Ensure the slide data is in the correct format for our UI
      const formattedSlide = {
        _id: newSlide._id,
        title: newSlide.title,
        content: newSlide.content,
        type: newSlide.type,
        imageUrl: newSlide.imageUrl,
        position: newSlide.position || 0,
        quiz: newSlide.quiz,
      };

      // Update slides array BEFORE updating orderedItems
      setSlides((prevSlides) => [...prevSlides, formattedSlide]);

      // Create new ordered item
      const newOrderedItem = {
        id: formattedSlide._id,
        type: "slide",
        data: formattedSlide,
      };

      // Update ordered items
      const updatedOrderedItems = [...orderedItems, newOrderedItem];
      setOrderedItems(updatedOrderedItems);

      // Save the updated quiz state to backend with the new slides array
      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: quiz.title,
            description: quiz.description,
            questions: questions,
            slides: [...slides, formattedSlide], // Include the new slide in the update
            order: updatedOrderedItems.map((item) => ({
              id: item.id,
              type: item.type,
            })),
          }),
        }
      );

      setCurrentSlide(formattedSlide);
      setIsAddSlideOpen(false);
      showAlert("Slide added successfully", "success");
    } catch (err) {
      console.error("Error adding slide:", err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async (slideId, updatedData) => {
    try {
      setLoading(true);

      // Handle image deletion if needed
      if (updatedData.deleteImage) {
        const currentSlide = slides.find((s) => s._id === slideId);
        if (currentSlide?.imageUrl) {
          await handleDeleteImage(currentSlide.imageUrl);
        }
        updatedData.imageUrl = null;
      }
      // Rest of the update logic remains the same
      else if (updatedData.imageFile) {
        const imageId = await handleImageUpload(updatedData.imageFile);
        updatedData.imageUrl = imageId;
      }

      const updatePayload = {
        title: updatedData.title,
        content: updatedData.content || "",
        type: updatedData.type,
        imageUrl: updatedData.imageUrl,
      };

      const response = await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/slides/${slideId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update slide");
      }

      const { slide: updatedSlide } = await response.json();

      setSlides((prevSlides) =>
        prevSlides.map((s) => (s._id === slideId ? updatedSlide : s))
      );
      setCurrentSlide(updatedSlide);
      setOrderedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === slideId && item.type === "slide"
            ? { ...item, data: updatedSlide }
            : item
        )
      );

      showAlert("Slide updated successfully", "success");
    } catch (err) {
      console.error("Error updating slide:", err);
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
        `${process.env.REACT_APP_API_URL}/api/slides/${itemToDelete}`,
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

      // Remove from ordered items
      setOrderedItems((prevItems) =>
        prevItems.filter(
          (item) => !(item.id === itemToDelete && item.type === "slide")
        )
      );

      showAlert("Slide deleted successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteSlideModal(false);
      setItemToDelete(null);
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}/questions`,
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

      if (!newQuestion || !newQuestion._id) {
        throw new Error("Invalid question data received from server");
      }

      // Update questions array
      const updatedQuestions = [...questions, newQuestion];
      setQuestions(updatedQuestions);

      // Create new ordered item
      const newOrderedItem = {
        id: newQuestion._id,
        type: "question",
        data: newQuestion,
      };

      // Update ordered items
      const updatedOrderedItems = [...orderedItems, newOrderedItem];
      setOrderedItems(updatedOrderedItems);

      // Save the updated quiz state to backend
      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: quiz.title,
            description: quiz.description,
            questions: updatedQuestions,
            slides: slides,
            order: updatedOrderedItems.map((item) => ({
              id: item.id,
              type: item.type,
            })),
          }),
        }
      );

      setCurrentQuestion(newQuestion);
      setIsAddQuestionOpen(false);
      showAlert("Question added successfully", "success");
    } catch (err) {
      console.error("Error adding question:", err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const validateOptions = (options) => {
    if (!Array.isArray(options)) return [];
    return options.filter((option) => option.text && option.text.trim() !== "");
  };

  const handleUpdateQuestion = async (questionId, updatedData) => {
    try {
      setLoading(true);

      // Handle image deletion
      if (updatedData.deleteImage) {
        const currentQuestion = questions.find((q) => q._id === questionId);
        if (currentQuestion?.imageUrl) {
          await handleDeleteImage(currentQuestion.imageUrl);
        }
        updatedData.imageUrl = null;
      }
      // Handle new image upload
      else if (updatedData.imageFile) {
        const imageId = await handleImageUpload(updatedData.imageFile);
        updatedData.imageUrl = imageId;
      }

      // Validate and sanitize options
      const validatedOptions = validateOptions(updatedData.options);

      const updatePayload = {
        title: updatedData.title,
        type: updatedData.type,
        imageUrl: updatedData.imageUrl,
        options: validatedOptions,
        correctAnswer: updatedData.correctAnswer,
        points: updatedData.points || 0,
        timer: updatedData.timer || 0,
      };

      const response = await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/questions/${questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update question");
      }

      const { question: updatedQuestion } = await response.json();

      if (!updatedQuestion || !updatedQuestion._id) {
        throw new Error("Invalid question data received from server");
      }

      // Update state
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q._id === questionId ? updatedQuestion : q))
      );
      setCurrentQuestion(updatedQuestion);
      setOrderedItems((prevItems) =>
        prevItems.map((item) =>
          item.id === questionId && item.type === "question"
            ? { ...item, data: updatedQuestion }
            : item
        )
      );

      showAlert("Question updated successfully", "success");
    } catch (err) {
      console.error("Error updating question:", err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishQuiz = async () => {
    setIsSubmitting(true);
    try {
      await publishQuiz(quizId);
      toast("Quiz published successfully", "success");
      navigate(`/quiz-details?type=quiz&quizId=${quizId}&hostId=${userId}`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function for image upload
  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/media/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      const imageId = data.media[0]._id;
      return imageId;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Utility function to handle URL encodings correctly
  const getMediaIdentifier = (imageUrl) => {
    if (!imageUrl) return null;

    try {
      // If it's already a Media ID (no slashes), return it
      if (typeof imageUrl === "string" && !imageUrl.includes("/")) {
        return imageUrl;
      }

      // Extract just the filename from the URL
      if (typeof imageUrl === "string" && imageUrl.includes("/uploads/")) {
        // Split by /uploads/ and take the last part
        const parts = imageUrl.split("/uploads/");
        if (parts.length !== 2) return null;

        // The filename might be encoded multiple times, so decode it
        let filename = parts[1];
        while (filename.includes("%")) {
          try {
            const decoded = decodeURIComponent(filename);
            if (decoded === filename) break;
            filename = decoded;
          } catch (e) {
            break;
          }
        }
        return filename;
      }
    } catch (error) {
      console.error("Error processing image URL:", error);
    }
    return null;
  };

  // Updated handleDeleteImage function
  const handleDeleteImage = async (imageUrl) => {
    try {
      if (!imageUrl) {
        console.log("No image URL provided");
        return false;
      }

      const filename = getMediaIdentifier(imageUrl);
      if (!filename) {
        console.error("Could not extract filename from:", imageUrl);
        return false;
      }

      console.log("Attempting to delete image:", filename);

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL
        }/api/media/byFilename/${encodeURIComponent(filename)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete image");
      }

      return true;
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
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
        `${process.env.REACT_APP_API_URL}/api/questions/${itemToDelete}`,
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

      // Remove from ordered items
      setOrderedItems((prevItems) =>
        prevItems.filter(
          (item) => !(item.id === itemToDelete && item.type === "question")
        )
      );

      showAlert("Question deleted successfully", "success");
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setShowDeleteQuestionModal(false);
      setItemToDelete(null);
    }
  };

  const handleReorderItems = async (sourceIndex, destinationIndex) => {
    if (sourceIndex === destinationIndex) return;

    try {
      // Update local state
      const reorderedItems = [...orderedItems];
      const [movedItem] = reorderedItems.splice(sourceIndex, 1);
      reorderedItems.splice(destinationIndex, 0, movedItem);
      setOrderedItems(reorderedItems);

      // Update the individual arrays based on type
      const newSlides = reorderedItems
        .filter((item) => item.type === "slide")
        .map((item) => item.data);
      const newQuestions = reorderedItems
        .filter((item) => item.type === "question")
        .map((item) => item.data);

      setSlides(newSlides);
      setQuestions(newQuestions);

      // Automatically save the new order to backend
      const order = reorderedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }));

      await authenticatedFetch(
        `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            title: quiz.title,
            description: quiz.description,
            questions: newQuestions,
            slides: newSlides,
            order,
          }),
        }
      );

      showAlert("Order updated successfully", "success");
    } catch (err) {
      handleApiError(err);
    }
  };

  // Helper functions for validation
  const isValidQuestion = (question) => {
    return (
      question &&
      typeof question === "object" &&
      "_id" in question &&
      "title" in question &&
      "type" in question
    );
  };

  const isValidSlide = (slide) => {
    return (
      slide && typeof slide === "object" && "_id" in slide && "title" in slide
    );
  };

  // Use in useEffect
  useEffect(() => {
    // Updated loadQuizData function
    const loadQuizData = async () => {
      if (!quizId) {
        showAlert("Invalid quiz ID");
        return;
      }

      try {
        setLoading(true);
        const quizResponse = await authenticatedFetch(
          `${process.env.REACT_APP_API_URL}/api/quizzes/${quizId}`
        );

        if (!quizResponse.ok) {
          throw new Error(`Failed to fetch quiz: ${quizResponse.statusText}`);
        }

        const quizData = await quizResponse.json();

        // Validate and set basic quiz data
        setQuiz({
          title: quizData.title || "",
          description: quizData.description || "",
        });
        setQuizTitle(quizData.title || "");

        // Validate questions and slides
        const validQuestions = Array.isArray(quizData.questions)
          ? quizData.questions.filter(isValidQuestion)
          : [];

        const validSlides = Array.isArray(quizData.slides)
          ? quizData.slides.filter(isValidSlide)
          : [];

        // Set questions and slides state
        setQuestions(validQuestions);
        setSlides(validSlides);

        // Handle ordered items
        let finalOrderedItems = [];

        if (
          quizData.order &&
          Array.isArray(quizData.order) &&
          quizData.order.length > 0
        ) {
          // Process existing order
          finalOrderedItems = quizData.order
            .filter((item) => item && item.id && item.type) // Filter valid order items
            .map((item) => {
              if (item.type === "question") {
                const questionData = validQuestions.find(
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
                const slideData = validSlides.find((s) => s._id === item.id);
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
            .filter(Boolean); // Remove null entries
        }

        // If no valid order exists or order array is empty, create default order
        if (finalOrderedItems.length === 0) {
          // Create default order by combining slides and questions
          finalOrderedItems = [
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

        // Set the final ordered items
        setOrderedItems(finalOrderedItems);

        // Reset current selections
        setCurrentQuestion(null);
        setCurrentSlide(null);
      } catch (err) {
        console.error("Error loading quiz data:", err);
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
      <Navbar />
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
                  Quiz Creator
                </span>
                <div className="relative w-full sm:w-64">
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
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-center"
                  onClick={() => navigate("/selectQuizCategory")}
                >
                  Exit
                </button>

                <button
                  data-testid="preview-quiz-btn"
                  onClick={handlePreviewClick}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Preview
                </button>

                <button
                  data-testid="save-quiz-btn"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={handleSaveQuiz}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Quiz"
                  )}
                </button>

                <button
                  data-testid="publish-survey-button"
                  onClick={handlePublishQuiz}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Quiz"
                  )}
                </button>
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
                  {orderedItems.map((item, index) => (
                    <div
                      data-testid={`content-item-${index}`}
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
                              handleDeleteQuestion(e, item.id);
                            } else {
                              handleDeleteSlide(e, item.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {item.data.title}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-4">
                  <button
                    data-testid="add-question-sidebar-btn"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setIsAddQuestionOpen(true)}
                  >
                    Add Question
                  </button>
                  <button
                    data-testid="add-slide-sidebar-btn"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setIsAddSlideOpen(true)}
                  >
                    Add Slide
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Container */}
            <div data-testid="editor-container" className="md:col-span-2">
              <AnimatePresence>
                {currentQuestion ? (
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
                  <SlideEditor
                    slide={currentSlide}
                    onUpdate={(updatedData) =>
                      handleUpdateSlide(currentSlide._id, updatedData)
                    }
                    onClose={() => setCurrentSlide(null)}
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
  );
};

export default QuizCreator;
