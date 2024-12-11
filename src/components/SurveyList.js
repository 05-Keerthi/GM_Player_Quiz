import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useSurveyContext } from "../context/surveyContext";
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
import Navbar from "./NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";
import { useAuthContext } from "../context/AuthContext";

const SurveyStatusBadge = ({ status }) => {
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

const SurveyList = () => {
  const navigate = useNavigate();
  const { surveys, getAllSurveys, deleteSurvey, updateSurvey } =
    useSurveyContext();
  const { user } = useAuthContext();
  const [filter, setFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [filteredSurveyList, setFilteredSurveyList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getAllSurveys();
  }, []);

  useEffect(() => {
    const filtered = surveys.filter((survey) => {
      if (filter === "all") return true;
      return survey.status === filter;
    });
    setFilteredSurveyList(filtered);
  }, [surveys, filter]);

  const handleEditSurvey = (surveyId) => {
    navigate(`/createSurvey/${surveyId}`);
  };

  const handleDeleteSurvey = (e, surveyId) => {
    e.stopPropagation();
    setSurveyToDelete(surveyId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (surveyToDelete) {
      await deleteSurvey(surveyToDelete);
      toast.success("Survey deleted successfully!");
      setShowDeleteModal(false);
      setSurveyToDelete(null);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) return;

    const allowedTransitions = {
      active: ["draft", "closed"],
      draft: ["active"],
      closed: ["active"],
    };

    const sourceStatus = source.droppableId;
    const targetStatus = destination.droppableId;

    if (!allowedTransitions[sourceStatus]?.includes(targetStatus)) {
      toast.error(`Cannot move survey from ${sourceStatus} to ${targetStatus}`);
      return;
    }

    const survey = surveys.find((s) => s._id === draggableId);
    if (!survey) return;

    try {
      const updatedSurvey = await updateSurvey(draggableId, {
        ...survey,
        status: targetStatus,
      });

      if (updatedSurvey) {
        toast.success(`Survey moved to ${targetStatus} successfully!`);
        // Refresh the surveys list to get the updated data
        await getAllSurveys();
      }
    } catch (error) {
      toast.error(`Failed to update survey status: ${error.message}`);
      console.error(error);
      // Refresh to ensure UI is in sync with backend
      await getAllSurveys();
    }
  };

  const handlePublishSurvey = async (survey) => {
    try {
      await updateSurvey(survey._id, { ...survey, status: "active" });
      toast.success("Survey published successfully!");
      await getAllSurveys();
      navigate(`/survey-details?surveyId=${survey._id}&hostId=${user.id}`);
    } catch (error) {
      toast.error("Failed to publish survey");
      console.error(error);
    }
  };

  const handleCloseSurvey = async (survey) => {
    try {
      await updateSurvey(survey._id, { ...survey, status: "closed" });
      toast.success("Survey closed successfully!");
      await getAllSurveys();
    } catch (error) {
      toast.error("Failed to close survey");
      console.error(error);
    }
  };

  const handleReopenSurvey = async (survey) => {
    try {
      await updateSurvey(survey._id, { ...survey, status: "active" });
      toast.success("Survey reopened successfully!");
      await getAllSurveys();
    } catch (error) {
      toast.error("Failed to reopen survey");
      console.error(error);
    }
  };
  const getStatusActionButton = (survey) => {
    switch (survey.status) {
      case "draft":
        return (
          <button
            onClick={() => handlePublishSurvey(survey)}
            className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Publish Survey
          </button>
        );
      case "active":
        return (
          <button
            onClick={() => handleCloseSurvey(survey)}
            className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Close Survey
          </button>
        );
      case "closed":
        return (
          <button
            onClick={() => handleReopenSurvey(survey)}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Reopen Survey
          </button>
        );
      default:
        return null;
    }
  };

  const surveyStatusConfig = [
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

  const surveyCardColors = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-pink-50 border-pink-200",
    "bg-teal-50 border-teal-200",
    "bg-amber-50 border-amber-200",
  ];

  return (
    <>
      <div className="fixed top-0 w-full z-50">
        <Navbar />
      </div>

      <div className="flex bg-gray-100 min-h-screen pt-16">
        {isMobile && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
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

        <div
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
                Survey Filters
              </h1>
              {isMobile && (
                <button
                  onClick={() => setIsFilterMenuOpen(false)}
                  className="text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {surveyStatusConfig.map(({ status, icon, color }) => (
                <button
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

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={`flex-1 p-4 ${isMobile ? "mt-0" : "ml-64"}`}>
            <div className="sticky top-16 z-30 flex flex-col sm:flex-row justify-between items-center mb-6 bg-gray-100 p-5">
              <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
                My Surveys
              </h1>
              <button
                onClick={() => navigate("/selectSurveyCategory")}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Survey
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
                          {status} Surveys
                        </h2>
                        {filteredSurveyList
                          .filter((survey) => survey.status === status)
                          .map((survey, index) => (
                            <Draggable
                              key={survey._id}
                              draggableId={survey._id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${
                                    surveyCardColors[
                                      index % surveyCardColors.length
                                    ]
                                  } border rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2 relative overflow-hidden mb-4`}
                                >
                                  <div className="absolute top-0 right-0 p-2">
                                    <SurveyStatusBadge status={survey.status} />
                                  </div>

                                  <h2 className="text-xl font-bold mb-3 text-gray-800">
                                    {survey.title || "Untitled Survey"}
                                  </h2>
                                  <p className="text-gray-600 mb-4 line-clamp-3">
                                    {survey.description || "No description"}
                                  </p>

                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <ListChecks className="w-5 h-5" />
                                      <span>
                                        {survey.questions?.length || 0}{" "}
                                        Questions
                                      </span>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleEditSurvey(survey._id)
                                        }
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Edit Survey"
                                      >
                                        <FileEdit className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          handleDeleteSurvey(e, survey._id)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete Survey"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 border-t pt-3">
                                    {getStatusActionButton(survey)}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                        {filteredSurveyList.filter(
                          (survey) => survey.status === status
                        ).length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No {status} surveys found
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                ) : null
              )}
            </div>

            {filteredSurveyList.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No surveys found for this status.
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSurveyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Survey"
        message="Are you sure you want to delete this survey? This action cannot be undone."
      />
    </>
  );
};

export default SurveyList;
