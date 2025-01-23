import React, { useState, useEffect } from "react";
import { X, Trash2, Upload } from "lucide-react";
import { motion } from "framer-motion";

const processSlideData = (data) => {
  return {
    surveyTitle: data.surveyTitle || "",
    surveyContent: data.surveyContent || "",
    imageUrl: data.imageUrl || null,
    position: data.position || 0,
  };
};

const SurveySlideEditor = ({ slide, onUpdate, onClose }) => {
  const [formData, setFormData] = useState(() =>
    processSlideData({
      surveyTitle: slide?.surveyTitle || "",
      surveyContent: slide?.surveyContent || "",
      imageUrl: slide?.imageUrl || null,
      position: slide?.position || 0,
    })
  );

  const [imagePreview, setImagePreview] = useState(slide?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slide) {
      const processedData = processSlideData({
        surveyTitle: slide.surveyTitle || "",
        surveyContent: slide.surveyContent || "",
        imageUrl: slide.imageUrl || null,
        position: slide.position || 0,
      });
      setFormData(processedData);
      setImagePreview(slide.imageUrl); // Directly use the imageUrl from the slide
    }
  }, [slide]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

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

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      const mediaData = data.media[0];

      // Set preview URL using the full URL
      const mediaUrl = `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`;
      setImagePreview(mediaUrl);

      // Store the media ID in form data
      setFormData((prev) => ({
        ...prev,
        imageUrl: mediaData._id, // Store the media ID
      }));
    } catch (error) {
      console.error("Error uploading image:", error);
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

  const validateForm = () => {
    if (!formData.surveyTitle.trim()) {
      setError("Please enter a slide title");
      return false;
    }
    if (!formData.surveyContent.trim()) {
      setError("Please enter slide content");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const submissionData = {
        ...formData,
        imageUrl: formData.imageUrl, // This will be either null or the media ID
      };

      if (onUpdate) {
        onUpdate(submissionData);
      }
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {slide ? "Edit Slide" : "Add Slide"}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Slide Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Slide Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.surveyTitle}
            onChange={(e) => handleInputChange("surveyTitle", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter slide title"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.surveyContent}
            onChange={(e) => handleInputChange("surveyContent", e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-32"
            placeholder="Enter slide content"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Slide Image (Optional)
          </label>
          {!imagePreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  {isUploading ? "Uploading..." : "Click to upload image"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <div className="relative w-full rounded-lg overflow-hidden bg-gray-100">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "75%" }}
                >
                  <img
                    src={imagePreview}
                    alt="Slide"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleImageRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isUploading}
          >
            {slide ? "Update Slide" : "Add Slide"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SurveySlideEditor;
