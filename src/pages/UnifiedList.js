import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuizContext } from "../context/quizContext";
import { useSurveyContext } from "../context/surveyContext";
import { useAuthContext } from "../context/AuthContext";
import {
  ListChecks,
  FileEdit,
  Lock,
  CheckSquare,
  Trash2,
  PlusCircle,
  Layers,
  PlayCircle,
  XCircle,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";

const StatusBadge = ({ status }) => {
  const statusColors = {
    draft: "bg-yellow-200 text-yellow-900",
    active: "bg-green-200 text-green-900",
    closed: "bg-red-200 text-red-900",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-200 text-gray-900"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const UnifiedList = ({ contentType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const isQuiz = contentType === "quiz";

  // Get the survey type from location state
  const surveyType = location.state?.surveyType || "survey";

  // Context setup based on content type
  const {
    quizzes: quizItems,
    getAllQuizzes: getAllQuizItems,
    deleteQuiz: deleteItem,
    updateQuiz: updateItem,
  } = useQuizContext();

  const {
    surveys: surveyItems,
    getAllSurveys: getAllSurveyItems,
    deleteSurvey: deleteSurveyItem,
    updateSurvey: updateSurveyItem,
    publishSurvey,
  } = useSurveyContext();

  // States
  const [filter, setFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filteredList, setFilteredList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const items = isQuiz ? quizItems : surveyItems;
  const getAllItems = isQuiz ? getAllQuizItems : getAllSurveyItems;
  const deleteItemFunc = isQuiz ? deleteItem : deleteSurveyItem;
  const updateItemFunc = isQuiz ? updateItem : updateSurveyItem;

  // Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getAllItems();
  }, []);

  // Filter items based on status and type
  useEffect(() => {
    if (items) {
      const filtered = items.filter((item) => {
        // Apply status filter
        const statusMatch = filter === "all" || item.status === filter;

        // For surveys, also apply type filter
        if (!isQuiz) {
          return statusMatch && item.type === surveyType;
        }

        return statusMatch;
      });
      setFilteredList(filtered);
    }
  }, [items, filter, surveyType]);

  // Handlers
  const handleCardClick = (item) => {
    if (item.status === "active") {
      navigate(
        `/${contentType}-details?type=${contentType}&${contentType}Id=${item._id}&hostId=${user.id}`
      );
    }
  };

  const handleEdit = (e, itemId) => {
    e.stopPropagation();
    navigate(
      `/create${
        contentType.charAt(0).toUpperCase() + contentType.slice(1)
      }/${itemId}`
    );
  };

  const handleDelete = (e, itemId) => {
    e.stopPropagation();
    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteItemFunc(itemToDelete);
        toast.success(
          `${
            contentType.charAt(0).toUpperCase() + contentType.slice(1)
          } deleted successfully!`
        );
      } catch (error) {
        toast.error("Failed to delete");
      } finally {
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination || source.droppableId === destination.droppableId) return;

    const allowedTransitions = {
      active: ["draft", "closed"],
      draft: ["active"],
      closed: ["draft", "active"],
    };

    if (
      !allowedTransitions[source.droppableId]?.includes(destination.droppableId)
    ) {
      toast.error(
        `Cannot move ${contentType} from ${source.droppableId} to ${destination.droppableId}`
      );
      return;
    }

    const item = items.find((i) => i._id === draggableId);
    if (!item) return;

    try {
      const updatedItem = {
        ...item,
        status: destination.droppableId,
      };

      await updateItemFunc(draggableId, updatedItem);

      toast.success(
        `${
          contentType.charAt(0).toUpperCase() + contentType.slice(1)
        } moved successfully!`
      );
      await getAllItems();
    } catch (error) {
      toast.error(`Failed to update status: ${error.message}`);
      console.error(error);
    }
  };

  const handleStatusChange = async (e, item, newStatus) => {
    e.stopPropagation();
    try {
      if (newStatus === "active" && !isQuiz) {
        const updatedItem = await publishSurvey(item._id);
        if (updatedItem) {
          toast.success(`${surveyType} published successfully!`);
          await getAllItems();
          navigate(
            `/${contentType}-details?type=${contentType}&${contentType}Id=${item._id}&hostId=${user.id}`
          );
        }
      } else {
        await updateItemFunc(item._id, { ...item, status: newStatus });
        toast.success(`Status updated successfully!`);
        await getAllItems();

        if (newStatus === "active" && isQuiz) {
          navigate(
            `/${contentType}-details?type=${contentType}&${contentType}Id=${item._id}&hostId=${user.id}`
          );
        }
      }
    } catch (error) {
      toast.error(`Failed to update status`);
      console.error(error);
    }
  };

  const handleCreateNew = () => {
    if (isQuiz) {
      navigate("/selectQuizCategory");
    } else {
      navigate("/selectSurveyCategory", {
        state: { surveyType },
      });
    }
  };

  // Helper function to get the content title
  const getContentTitle = () => {
    if (isQuiz) return "Quizzes";
    return surveyType === "ArtPulse" ? "ArtPulse Surveys" : "Surveys";
  };

  const getStatusActionButton = (item) => {
    const buttonConfigs = {
      draft: {
        label: `Publish ${isQuiz ? "Quiz" : surveyType}`,
        icon: <CheckSquare className="w-4 h-4" />,
        class: "bg-green-500 hover:bg-green-600",
        newStatus: "active",
      },
      active: {
        label: `Close ${isQuiz ? "Quiz" : surveyType}`,
        icon: <Lock className="w-4 h-4" />,
        class: "bg-red-500 hover:bg-red-600",
        newStatus: "closed",
      },
      closed: {
        label: `Reopen ${isQuiz ? "Quiz" : surveyType}`,
        icon: <ArrowRight className="w-4 h-4" />,
        class: "bg-blue-500 hover:bg-blue-600",
        newStatus: "active",
      },
    };

    const config = buttonConfigs[item.status];
    if (!config) return null;

    return (
      <button
        onClick={(e) => handleStatusChange(e, item, config.newStatus)}
        data-testid={`status-button-${item._id}`}
        className={`w-full px-3 py-2 text-white rounded-lg flex items-center justify-center gap-2 ${config.class}`}
      >
        {config.icon}
        {config.label}
      </button>
    );
  };

  const cardColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-pink-50 border-pink-200",
    "bg-teal-50 border-teal-200",
    "bg-amber-50 border-amber-200",
  ];

  const statusConfig = [
    {
      status: "all",
      icon: <Layers className="w-5 h-5" />,
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
    {
      status: "draft",
      icon: <FileEdit className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    },
    {
      status: "active",
      icon: <PlayCircle className="w-5 h-5" />,
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      status: "closed",
      icon: <XCircle className="w-5 h-5" />,
      color: "bg-red-100 text-red-700 hover:bg-red-200",
    },
  ];

  return (
    <>
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex bg-gray-100 min-h-screen pt-16">
        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              data-testid="mobile-menu-button"
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
            >
              {isFilterMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        )}

        {/* Filter Sidebar */}
        <div
          data-testid="filter-menu"
          className={`
            ${
              isMobile
                ? `fixed inset-0 bg-white z-40 pt-16 transform transition-transform duration-300 ${
                    isFilterMenuOpen ? "translate-x-0" : "translate-x-full"
                  }`
                : `w-64 bg-white shadow-lg p-6 fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto z-40`
            }
          `}
        >
          <div className="sticky top-0 bg-white">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {getContentTitle()} Filters
              </h1>
              {isMobile && (
                <button
                  data-testid="close-menu-button"
                  onClick={() => setIsFilterMenuOpen(false)}
                  className="text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {statusConfig.map(({ status, icon, color }) => (
                <button
                  data-testid={`filter-${status}`}
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    isMobile && setIsFilterMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                    filter === status
                      ? `${color} font-semibold`
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {icon}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={`flex-1 p-4 ${isMobile ? "mt-0" : "ml-64"}`}>
            <div className="sticky top-16 z-30 flex flex-col sm:flex-row justify-between items-center mb-6 bg-gray-100 p-5">
              <h1 data-testid="content-header">My {getContentTitle()}</h1>
              <button
                onClick={handleCreateNew}
                data-testid="create-button"
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                Create New{" "}
                {isQuiz
                  ? "Quiz"
                  : surveyType === "ArtPulse"
                  ? "ArtPulse"
                  : "Survey"}
              </button>
            </div>

            <div
              className={`${
                isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-3 gap-6"
              }`}
            >
              {["draft", "active", "closed"].map((status) =>
                filter === "all" || filter === status ? (
                  <Droppable key={status} droppableId={status}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="bg-white rounded-lg shadow-md p-4"
                      >
                        <h2 className="text-lg font-semibold mb-4 capitalize">
                          {status}{" "}
                          {isQuiz
                            ? "Quizzes"
                            : surveyType === "ArtPulse"
                            ? "ArtPulse"
                            : "Surveys"}
                        </h2>
                        {filteredList
                          .filter((item) => item.status === status)
                          .map((item, index) => (
                            <Draggable
                              key={item._id}
                              draggableId={item._id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  data-testid={`${contentType}-card-${item._id}`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleCardClick(item)}
                                  className={`${
                                    cardColors[index % cardColors.length]
                                  } border rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2 relative overflow-hidden mb-4 ${
                                    item.status === "active"
                                      ? "cursor-pointer"
                                      : ""
                                  }`}
                                >
                                  <div className="absolute top-0 right-0 p-2">
                                    <StatusBadge status={item.status} />
                                  </div>

                                  <h2
                                    data-testid={`${contentType}-title-${item._id}`}
                                    className="text-xl font-bold mb-3 text-gray-800"
                                  >
                                    {item.title ||
                                      `Untitled ${
                                        isQuiz ? "Quiz" : surveyType
                                      }`}
                                  </h2>
                                  <p className="text-gray-600 mb-4 line-clamp-3">
                                    {item.description || "No description"}
                                  </p>

                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <ListChecks className="w-5 h-5" />
                                      <span>
                                        {item.questions?.length || 0} Questions
                                      </span>
                                      <ListChecks className="w-5 h-5" />
                                      <span>
                                        {item.slides?.length || 0} Slides
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        data-testid={`edit-button-${item._id}`}
                                        onClick={(e) => handleEdit(e, item._id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title={`Edit ${
                                          isQuiz ? "Quiz" : surveyType
                                        }`}
                                      >
                                        <FileEdit className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          handleDelete(e, item._id)
                                        }
                                        data-testid={`delete-button-${item._id}`}
                                        className="text-red-600 hover:text-red-800"
                                        title={`Delete ${
                                          isQuiz ? "Quiz" : surveyType
                                        }`}
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 border-t pt-3">
                                    {getStatusActionButton(item)}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredList.filter((item) => item.status === status)
                          .length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No {status}{" "}
                            {isQuiz
                              ? "quizzes"
                              : surveyType === "ArtPulse"
                              ? "ArtPulse surveys"
                              : "surveys"}{" "}
                            found
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                ) : null
              )}
            </div>

            {filteredList.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No{" "}
                {isQuiz
                  ? "quizzes"
                  : surveyType === "ArtPulse"
                  ? "ArtPulse surveys"
                  : "surveys"}{" "}
                found for this status.
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      <ConfirmationModal
        data-testid="confirmation-modal"
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${isQuiz ? "Quiz" : surveyType}`}
        message={`Are you sure you want to delete this ${
          isQuiz ? "quiz" : surveyType.toLowerCase()
        }? This action cannot be undone.`}
      />
    </>
  );
};

export default UnifiedList;
