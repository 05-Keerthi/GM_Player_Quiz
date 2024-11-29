import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { useCategoryContext } from "../../context/categoryContext";

const EditCategoryModal = ({ isOpen, onClose, categoryId }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const { updateCategory, getCategoryById, loading } = useCategoryContext();

  useEffect(() => {
    if (isOpen && categoryId) {
      loadCategoryData();
    }
  }, [isOpen, categoryId]);

  const loadCategoryData = async () => {
    try {
      const category = await getCategoryById(categoryId);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
      setFieldErrors({});
    } catch (err) {
      toast.error("Failed to load category data");
      onClose();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Category name is required";
    } else if (formData.name.length < 3) {
      errors.name = "Category name must be at least 3 characters";
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await updateCategory(categoryId, formData);
      toast.success("Category updated successfully!");
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle server-side validation errors
        const serverErrors = {};
        err.response.data.errors.forEach((error) => {
          serverErrors[error.field] = error.message;
        });
        setFieldErrors(serverErrors);
      } else {
        toast.error(err.response?.data?.message || "Failed to update category");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter category name"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-500">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.description ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter category description"
                rows={4}
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {fieldErrors.description}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;
