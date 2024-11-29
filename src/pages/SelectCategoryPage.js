import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useCategoryContext } from "../context/categoryContext";
import { useQuizContext } from "../context/quizContext";
import Navbar from "../components/NavbarComp";

const SelectCategoryPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { categories, getAllCategories, loading, error } = useCategoryContext();
  const { createQuiz } = useQuizContext();

  useEffect(() => {
    getAllCategories();
  }, []);

  const filteredCategories =
    categories?.filter((category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const toggleCategorySelection = (categoryId) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const handleCreateQuiz = async () => {
    if (selectedCategories.length === 0) return;

    try {
      const response = await createQuiz({
        categoryId: selectedCategories,
        status: "draft",
      });
      console.log(response);
      // Access the _id from the quiz object in the response
      navigate(`/createQuiz/${response.quiz._id}`);
    } catch (err) {
      console.error("Failed to create quiz:", err);
    }
  };

  return (
    <>
      <>
        <Navbar />
      </>
      <>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Select Categories
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Category
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories Grid */}
          {loading ? (
            <div className="text-center py-8">Loading categories...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <div
                  key={category._id}
                  className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all
                ${
                  selectedCategories.includes(category._id)
                    ? "ring-2 ring-blue-500 shadow-lg"
                    : "hover:shadow-lg"
                }`}
                  onClick={() => toggleCategorySelection(category._id)}
                >
                  <span>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => {}} // Handled by parent div onClick
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {category.name}
                  </h3>
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-gray-500">
                      {category.quizCount || 0} quizzes
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Quiz Button */}
          <div className="fixed bottom-8 right-8">
            <button
              onClick={handleCreateQuiz}
              disabled={selectedCategories.length === 0}
              className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 text-white
            ${
              selectedCategories.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            >
              <Plus className="h-5 w-5" />
              Create Quiz ({selectedCategories.length})
            </button>
          </div>
        </div>
      </>
    </>
  );
};

export default SelectCategoryPage;
