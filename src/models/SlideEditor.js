import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { SlideTypeModal } from "./SlideTypeModal";

const SlideEditor = ({ initialSlide = null, onSubmit, onClose }) => {
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(!initialSlide);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    content: "",
    points: [""],
    imageUrl: null,
    position: 0,
  });

  useEffect(() => {
    if (initialSlide) {
      setFormData({
        ...initialSlide,
        points:
          initialSlide.type === "bullet_points"
            ? initialSlide.content.split("\n")
            : [""],
      });
      if (initialSlide.imageUrl) {
        setImagePreview(initialSlide.imageUrl);
      }
    }
  }, [initialSlide]);

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      points: type === "bullet_points" ? [""] : [],
      content: "",
    }));
    setIsTypeModalOpen(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("media", file);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/media/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      const mediaData = data.media[0];

      setImagePreview(
        `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
      );
      setFormData((prev) => ({
        ...prev,
        imageUrl: mediaData._id,
      }));
    } catch (error) {
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const handlePointChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      points: prev.points.map((point, i) => (i === index ? value : point)),
    }));
  };

  const addPoint = () => {
    if (formData.points.length < 6) {
      // Limit to 6 bullet points
      setFormData((prev) => ({
        ...prev,
        points: [...prev.points, ""],
      }));
    }
  };

  const removePoint = (index) => {
    if (formData.points.length > 1) {
      setFormData((prev) => ({
        ...prev,
        points: prev.points.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Slide title is required");
      return false;
    }

    if (formData.type === "bullet_points") {
      const validPoints = formData.points.filter((point) => point.trim());
      if (validPoints.length === 0) {
        setError("At least one bullet point is required");
        return false;
      }
    } else if (!formData.content.trim()) {
      setError("Slide content is required");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Format the data before submission
      const submissionData = {
        ...formData,
        content:
          formData.type === "bullet_points"
            ? formData.points.filter((point) => point.trim()).join("\n")
            : formData.content,
      };
      onSubmit(submissionData);
    }
  };

  return (
    <>
      <SlideTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onTypeSelect={handleTypeSelect}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-lg w-full max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 border-b pb-3 sm:pb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
            {initialSlide ? "Edit Slide" : "Add New Slide"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm sm:text-base">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            {error}
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slide Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Enter slide title"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Slide Image (Optional)
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <input
                type="file"
                className="hidden"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 text-sm sm:text-base"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                Upload Image
              </label>
              {imagePreview && (
                <button
                  onClick={handleImageRemove}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Remove
                </button>
              )}
            </div>

            {imagePreview && (
              <div className="mt-3 sm:mt-4">
                <img
                  src={imagePreview}
                  alt="Slide"
                  className="w-full max-h-48 sm:max-h-64 object-contain rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Content Section */}
          {formData.type === "bullet_points" ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Bullet Points <span className="text-red-500">*</span>
                </label>
                {formData.points.length < 6 && (
                  <button
                    onClick={addPoint}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add Point
                  </button>
                )}
              </div>
              {formData.points.map((point, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-gray-500">•</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handlePointChange(index, e.target.value)}
                    className="flex-1 p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    placeholder={`Point ${index + 1}`}
                  />
                  {formData.points.length > 1 && (
                    <button
                      onClick={() => removePoint(index)}
                      className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px] sm:min-h-[150px] resize-y text-sm sm:text-base"
                placeholder={
                  formData.type === "big_title"
                    ? "Enter title text"
                    : "Enter slide content"
                }
                style={
                  formData.type === "big_title"
                    ? { fontSize: "1.25rem", fontWeight: "600" }
                    : {}
                }
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {initialSlide ? "Update Slide" : "Add Slide"}
            </button>
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default SlideEditor;
