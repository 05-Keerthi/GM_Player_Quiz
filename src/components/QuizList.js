// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useQuizContext } from '../context/quizContext';
// import {
//   ListChecks,
//   FileEdit,
//   Lock,
//   CheckSquare,
//   Trash2,
//   PlusCircle
// } from 'lucide-react';

// const QuizStatusBadge = ({ status }) => {
//   const statusColors = {
//     draft: 'bg-yellow-100 text-yellow-800',
//     active: 'bg-green-100 text-green-800',
//     closed: 'bg-red-100 text-red-800'
//   };

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// };

// const QuizList = () => {
//   const navigate = useNavigate();
//   const {
//     quizzes,
//     getAllQuizzes,
//     deleteQuiz,
//     publishQuiz,
//     closeQuiz
//   } = useQuizContext();
//   const [filter, setFilter] = useState('all');

//   useEffect(() => {
//     getAllQuizzes();
//   }, []);

//   const filteredQuizzes = quizzes.filter(quiz => {
//     if (filter === 'all') return true;
//     return quiz.status === filter;
//   });

//   const handleEditQuiz = (quizId) => {
//     navigate(`/createQuiz/${quizId}`);
//   };

//   const handleDeleteQuiz = async (quizId) => {
//     if (window.confirm('Are you sure you want to delete this quiz?')) {
//       await deleteQuiz(quizId);
//     }
//   };

//   const handlePublishQuiz = async (quizId) => {
//     await publishQuiz(quizId);
//   };

//   const handleCloseQuiz = async (quizId) => {
//     await closeQuiz(quizId);
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">My Quizzes</h1>
//         <button
//           onClick={() => navigate('/select-category')}
//           className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           <PlusCircle className="w-5 h-5" />
//           Create New Quiz
//         </button>
//       </div>

//       <div className="mb-4 flex gap-2">
//         {['all', 'draft', 'active', 'closed'].map(status => (
//           <button
//             key={status}
//             onClick={() => setFilter(status)}
//             className={`px-4 py-2 rounded-lg ${
//               filter === status
//                 ? 'bg-blue-600 text-white'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             {status.charAt(0).toUpperCase() + status.slice(1)}
//           </button>
//         ))}
//       </div>

//       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {filteredQuizzes.map(quiz => (
//           <div
//             key={quiz._id}
//             className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
//           >
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
//                 <QuizStatusBadge status={quiz.status} />
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleEditQuiz(quiz._id)}
//                   className="text-blue-500 hover:text-blue-700"
//                   title="Edit Quiz"
//                 >
//                   <FileEdit className="w-5 h-5" />
//                 </button>
//                 <button
//                   onClick={() => handleDeleteQuiz(quiz._id)}
//                   className="text-red-500 hover:text-red-700"
//                   title="Delete Quiz"
//                 >
//                   <Trash2 className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>

//             <p className="text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>

//             <div className="flex justify-between items-center border-t pt-4">
//               <div className="flex items-center gap-2">
//                 <ListChecks className="w-5 h-5 text-gray-500" />
//                 <span>{quiz.questions?.length || 0} Questions</span>
//               </div>

//               <div className="flex gap-2">
//                 {quiz.status === 'draft' && (
//                   <button
//                     onClick={() => handlePublishQuiz(quiz._id)}
//                     className="px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 flex items-center gap-1"
//                   >
//                     <CheckSquare className="w-4 h-4" />
//                     Publish
//                   </button>
//                 )}
//                 {quiz.status === 'active' && (
//                   <button
//                     onClick={() => handleCloseQuiz(quiz._id)}
//                     className="px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 flex items-center gap-1"
//                   >
//                     <Lock className="w-4 h-4" />
//                     Close
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {filteredQuizzes.length === 0 && (
//         <div className="text-center py-12 text-gray-500">
//           No quizzes found for this status.
//         </div>
//       )}
//     </div>
//   );
// };

// export default QuizList;

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useQuizContext } from "../context/quizContext";
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
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "./NavbarComp";
import ConfirmationModal from "../models/ConfirmationModal";
import { useAuthContext } from "../context/AuthContext";

const QuizStatusBadge = ({ status }) => {
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

const QuizList = () => {
  const navigate = useNavigate();
  const { quizzes, getAllQuizzes, deleteQuiz, publishQuiz, closeQuiz } =
    useQuizContext();
  const { user } = useAuthContext();
  const [filter, setFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [filteredQuizList, setFilteredQuizList] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Check screen size and update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getAllQuizzes();
  }, []);

  useEffect(() => {
    const filtered = quizzes.filter((quiz) => {
      if (filter === "all") return true;
      return quiz.status === filter;
    });
    setFilteredQuizList(filtered);
  }, [quizzes, filter]);

  const handleEditQuiz = (quizId) => {
    navigate(`/createQuiz/${quizId}`);
  };

  const handleDeleteQuiz = (e, quizId) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (quizToDelete) {
      await deleteQuiz(quizToDelete);
      toast.success("Quiz deleted successfully!");
      setShowDeleteModal(false);
      setQuizToDelete(null);
    }
  };

  const handlePublishQuiz = async (quizId) => {
    try {
      const response = await publishQuiz(quizId, user.id);
      navigate(`/quiz-details?quizId=${quizId}&hostId=${user.id}`);
    } catch (error) {
      toast.error("Failed to publish quiz. Please try again.");
      console.error("Error publishing quiz:", error);
    }
  };

  const handleCloseQuiz = async (quizId) => {
    try {
      await closeQuiz(quizId);
      toast.success("Quiz closed successfully!");
      await getAllQuizzes();
    } catch (error) {
      toast.error("Failed to close quiz");
      console.error(error);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Check if the source and destination are the same
    if (source.droppableId === destination.droppableId) return;

    const statusMap = {
      draft: "draft",
      active: "active",
      closed: "closed",
    };

    const newStatus = statusMap[destination.droppableId];

    if (newStatus) {
      try {
        if (newStatus === "draft") {
          // Assume we have some condition to check if moving to draft is not allowed
          const isAllowedToDraft = false; // Replace with actual logic if applicable

          if (!isAllowedToDraft) {
            toast.error("Cannot move quiz back to draft.");
            return;
          }

          await publishQuiz(draggableId, "draft");
          toast.success("Quiz moved back to draft successfully!");
        } else if (newStatus === "active") {
          await publishQuiz(draggableId);
          toast.success("Quiz published successfully!");
        } else if (newStatus === "closed") {
          await closeQuiz(draggableId);
          toast.success("Quiz closed successfully!");
        }

        await getAllQuizzes();
      } catch (error) {
        toast.error("Failed to update quiz status");
        console.error(error);
      }
    }
  };

  const quizStatusConfig = [
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

  const quizCardColors = [
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
        {/* Mobile Filter Toggle */}
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

        {/* Sidebar Filter - Responsive */}
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
              <h1 className="text-2xl font-bold text-gray-800">Quiz Filters</h1>
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
              {quizStatusConfig.map(({ status, icon, color }) => (
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
                My Quizzes
              </h1>
              <button
                onClick={() => navigate("/select-category")}
                className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Quiz
              </button>
            </div>

            <div
              className={`
              ${isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-3 gap-6"}
            `}
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
                          {status} Quizzes
                        </h2>
                        {filteredQuizList
                          .filter((quiz) => quiz.status === status)
                          .map((quiz, index) => (
                            <Draggable
                              key={quiz._id}
                              draggableId={quiz._id}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${
                                    quizCardColors[
                                      index % quizCardColors.length
                                    ]
                                  } border rounded-xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-2 relative overflow-hidden mb-4`}
                                >
                                  <div className="absolute top-0 right-0 p-2">
                                    <QuizStatusBadge status={quiz.status} />
                                  </div>

                                  <h2 className="text-xl font-bold mb-3 text-gray-800">
                                    {quiz.title || "Untitled Quiz"}
                                  </h2>
                                  <p className="text-gray-600 mb-4 line-clamp-3">
                                    {quiz.description || "No description"}
                                  </p>

                                  <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <ListChecks className="w-5 h-5" />
                                      <span>
                                        {quiz.questions?.length || 0} Questions
                                      </span>
                                      <ListChecks className="w-5 h-5" />
                                      <span>
                                        {quiz.slides?.length || 0} Slides
                                      </span>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditQuiz(quiz._id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Edit Quiz"
                                      >
                                        <FileEdit className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          handleDeleteQuiz(e, quiz._id)
                                        }
                                        className="text-red-600 hover:text-red-800"
                                        title="Delete Quiz"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-4 border-t pt-3">
                                    {quiz.status === "draft" && (
                                      <button
                                        onClick={() =>
                                          handlePublishQuiz(quiz._id)
                                        }
                                        className="w-full px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                                      >
                                        <CheckSquare className="w-4 h-4" />
                                        Publish Quiz
                                      </button>
                                    )}
                                    {quiz.status === "active" && (
                                      <button
                                        onClick={() =>
                                          handleCloseQuiz(quiz._id)
                                        }
                                        className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                                      >
                                        <Lock className="w-4 h-4" />
                                        Close Quiz
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ) : null
              )}
            </div>

            {filteredQuizList.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No quizzes found for this status.
              </div>
            )}
          </div>
        </DragDropContext>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setQuizToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? This action cannot be undone."
      />
    </>
  );
};

export default QuizList;


