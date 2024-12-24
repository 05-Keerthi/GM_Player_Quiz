// SlideEditor.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Image as ImageIcon,
  Type,
  ListOrdered,
  Upload,
  Trash2,
} from "lucide-react";

const SlideEditor = ({ slide, onUpdate, onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [points, setPoints] = useState([""]);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:5000"; // You might want to move this to an environment variable

  useEffect(() => {
    if (slide) {
      setTitle(slide.title || "");
      if (slide.type === "bullet_points") {
        setPoints(slide.content ? slide.content.split("\n") : [""]);
      } else {
        setContent(slide.content || "");
      }

      if (slide.imageUrl) {
        // If imageUrl is already a full path, use it directly
        if (slide.imageUrl.startsWith("/uploads/")) {
          setImagePreview(`${API_BASE_URL}${slide.imageUrl}`);
        } else {
          setImagePreview(slide.imageUrl);
        }
      } else {
        setImagePreview(null);
      }
    }
  }, [slide]);

  const getSlideTypeIcon = (type) => {
    const typeIcons = {
      classic: <ImageIcon className="w-6 h-6 text-blue-600" />,
      big_title: <Type className="w-6 h-6 text-purple-600" />,
      bullet_points: <ListOrdered className="w-6 h-6 text-green-600" />,
    };
    return typeIcons[type] || null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("media", file);

        const token = localStorage.getItem("token");
        const uploadResponse = await fetch(`${API_BASE_URL}/api/media/upload`, {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadResponse.json();
        const mediaData = uploadData.media[0];

        // Use the URL directly from the response
        setImagePreview(`${API_BASE_URL}${mediaData.url}`);

        // Store the media ID in the slide object
        slide.imageUrl = mediaData._id;
      } catch (error) {
        console.error("Image upload error:", error);
        setError("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getMediaIdentifier = (imageUrl) => {
    if (!imageUrl) return null;

    if (typeof imageUrl === "string" && imageUrl.includes("/uploads/")) {
      return imageUrl.split("/uploads/")[1];
    }

    return imageUrl;
  };

  // Update handleImageRemove in SlideEditor.js
  const handleImageRemove = async () => {
    if (slide.imageUrl) {
      try {
        const mediaIdentifier = getMediaIdentifier(slide.imageUrl);
        if (!mediaIdentifier) {
          throw new Error("Invalid image URL");
        }

        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/media/byFilename/${encodeURIComponent(
            mediaIdentifier
          )}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete image");
        }

        setImagePreview(null);
        slide.imageUrl = null;
      } catch (error) {
        console.error("Error deleting image:", error);
        setError("Failed to delete image");
        return;
      }
    }
  };

  // Update handleSave in SlideEditor.js to handle image deletion
  const handleSave = async () => {
    try {
      const updatedData = {
        title,
        type: slide.type,
        content: slide.type === "bullet_points" ? points.join("\n") : content,
        imageUrl: slide.imageUrl,
        // Add deleteImage flag if the image was removed
        deleteImage: !slide.imageUrl && imagePreview !== null,
      };

      await onUpdate(updatedData);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handlePointChange = (index, value) => {
    const newPoints = [...points];
    newPoints[index] = value;
    setPoints(newPoints);
  };

  const addPoint = () => {
    setPoints([...points, ""]);
  };

  const removePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    setPoints(newPoints);
  };

  if (!slide) return null;

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-gray-50 rounded-xl shadow-2xl p-8 w-full max-w-2xl mx-auto relative"
    >
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div className="flex items-center gap-4">
          {getSlideTypeIcon(slide.type)}
          <h2 className="text-2xl font-bold text-gray-800">Edit Slide</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors group"
        >
          <X className="w-6 h-6 text-gray-600 group-hover:text-gray-900" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Slide Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
            placeholder="Enter slide title..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Slide Image
          </label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              className="hidden"
              id="image-upload"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <label
              htmlFor="image-upload"
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 transition"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </label>
            {imagePreview && (
              <button
                onClick={handleImageRemove}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                <Trash2 className="w-5 h-5" />
                Remove
              </button>
            )}
          </div>

          {imagePreview && (
            <div className="relative mt-4 group">
              <img
                src={imagePreview}
                alt="Slide"
                className="w-full h-64 object-cover rounded-lg shadow-md group-hover:opacity-80 transition"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {slide.type === "bullet_points" ? (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Bullet Points
            </label>
            <div className="space-y-3">
              {points.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border"
                >
                  <span className="text-gray-500 font-bold">•</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handlePointChange(index, e.target.value)}
                    className="flex-1 p-2 border-b-2 border-transparent focus:border-blue-500 transition-colors"
                    placeholder={`Point ${index + 1}`}
                  />
                  {points.length > 1 && (
                    <button
                      onClick={() => removePoint(index)}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPoint}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                Add Bullet Point
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300 min-h-[150px]"
              placeholder="Enter slide content..."
            />
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SlideEditor;
