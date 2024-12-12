import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useCategoryContext } from "../context/categoryContext";
import { useSurveyContext } from "../context/surveyContext";
import { paginateData, PaginationControls } from "../utils/pagination";
import Navbar from "../components/NavbarComp";
import CreateCategoryModal from "../models/Category/CreateCategoryModal";
import EditCategoryModal from "../models/Category/EditCategoryModal";
import ConfirmationModal from "../models/ConfirmationModal";
import { toast } from "react-toastify";

const SelectSurveyCategory = () => {
  const navigate = useNavigate();
  const { categories, getAllCategories, deleteCategory, loading, error } =
    useCategoryContext();
  const { createSurvey } = useSurveyContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const itemsPerPage = 15;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // Load categories on mount
  useEffect(() => {
    getAllCategories();
  }, []);

  // Filter categories when search query or categories change
  useEffect(() => {
    if (categories) {
      setFilteredCategories(
        categories.filter((category) =>
          category?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase().trim())
        )
      );
      setCurrentPage(1);
    }
  }, [categories, searchQuery]);

  const { currentItems, totalPages } = paginateData(
    filteredCategories,
    currentPage,
    itemsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleCategorySelection = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleCreateSurvey = async () => {
    if (selectedCategories.length === 0) return;

    try {
      const response = await createSurvey({
        categoryId: selectedCategories,
        status: "draft",
      });
      console.log(response);
      navigate(`/createSurvey/${response.surveyQuiz._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create survey");
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    getAllCategories(); // Refresh categories after creation
  };

  const handleEdit = (e, categoryId) => {
    e.stopPropagation();
    setSelectedCategoryId(categoryId);
    setShowEditModal(true);
  };

  const handleDelete = (e, categoryId) => {
    e.stopPropagation();
    setSelectedCategoryId(categoryId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(selectedCategoryId);
      toast.success("Category deleted successfully!");
      setShowDeleteModal(false);
      setSelectedCategoryId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header and Search Bar Container */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Select Survey Categories
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Category
            </button>
          </div>

          {/* Search Bar - Centered with max-width */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search survey categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid Container - 80% width and centered */}
        <div className="mx-auto w-4/5">
          {loading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentItems.map((category) => (
                  <div
                    key={category._id}
                    className={`bg-white rounded-lg shadow-md px-4 py-2 cursor-pointer transition-all flex items-center justify-between
                    ${
                      selectedCategories.includes(category._id)
                        ? "ring-2 ring-blue-500 shadow-lg"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => toggleCategorySelection(category._id)}
                  >
                    <div className="flex items-center gap-4 flex-grow">
                      <div
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategorySelection(category._id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category._id)}
                          readOnly
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {category.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleEdit(e, category._id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, category._id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {currentItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No categories found
                </div>
              )}

              {/* Pagination Controls */}
              {filteredCategories.length > itemsPerPage && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>

        {/* Create Survey Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={handleCreateSurvey}
            disabled={selectedCategories.length === 0}
            className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-white
              ${
                selectedCategories.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
          >
            <Plus className="h-5 w-5" />
            Create Survey ({selectedCategories.length})
          </button>
        </div>
      </div>

      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
      />

      <EditCategoryModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategoryId(null);
        }}
        categoryId={selectedCategoryId}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategoryId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </>
  );
};

export default SelectSurveyCategory;
