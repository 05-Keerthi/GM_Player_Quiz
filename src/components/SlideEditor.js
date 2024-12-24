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
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchImageUrl = async (imageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/media/${imageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
  
      const data = await response.json();
      return data.media.url; // This will return the full URL for the image
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };


  useEffect(() => {
    const loadImageUrl = async () => {
      if (slide?.imageUrl) {
        const imageUrl = await fetchImageUrl(slide.imageUrl);
        setImage({ preview: imageUrl });
      } else {
        setImage(null);
      }
    };
  
    if (slide) {
      setTitle(slide.title || "");
      if (slide.type === "bullet_points") {
        setPoints(slide.content ? slide.content.split("\n") : [""]);
      } else {
        setContent(slide.content || "");
      }
      loadImageUrl();
    }
  }, [slide]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, preview: reader.result });
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError("Error reading image file");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = () => {
    setImage(null);
    setError(null);
  };

  const handlePointChange = (index, value) => {
    setPoints((prev) => prev.map((point, i) => (i === index ? value : point)));
  };

  const handleAddPoint = () => {
    setPoints((prev) => [...prev, ""]);
  };

  const handleRemovePoint = (index) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const getSlideTypeIcon = (type) => {
    const typeIcons = {
      classic: <ImageIcon className="w-6 h-6 text-blue-600" />,
      big_title: <Type className="w-6 h-6 text-purple-600" />,
      bullet_points: <ListOrdered className="w-6 h-6 text-green-600" />,
    };
    return typeIcons[type] || null;
  };

  const handleSubmit = async () => {
    try {
      // Prepare the base update data
      let updatedData = {
        ...slide,
        title,
        content: slide.type === "bullet_points" ? points.join("\n") : content
      };
  
      // Handle image upload if there's a new file
      if (image?.file) {
        const formData = new FormData();
        formData.append("media", image.file);
  
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/media/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error("Failed to upload image");
        }
  
        const data = await response.json();
        updatedData.imageUrl = data.media[0]._id; // Store the media ID
      } else if (image?.preview && !image?.file) {
        // Keep existing image
        updatedData.imageUrl = slide.imageUrl;
      } else {
        // No image case
        updatedData.imageUrl = null;
      }
  
      await onUpdate(updatedData);
      onClose();
    } catch (error) {
      setError(error.message);
    }
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
          <label className="block text-sm font-medium text-gray-700">
            Slide Image (Optional)
          </label>
          {!image?.preview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Click to upload image
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={image.preview}
                alt="Slide"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleImageRemove}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {slide.type === "classic" && (
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

        {slide.type === "bullet_points" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Bullet Points
              </label>
              {points.length < 6 && (
                <button
                  onClick={handleAddPoint}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Add Point
                </button>
              )}
            </div>
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
                    onClick={() => handleRemovePoint(index)}
                    className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSubmit}
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
