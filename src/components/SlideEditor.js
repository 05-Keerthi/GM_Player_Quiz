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

const ImageUploadArea = ({ image, setImage, currentImageUrl }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, preview: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {!image?.preview && !currentImageUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Click to upload image</span>
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
            src={image?.preview || currentImageUrl}
            alt="Slide"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const SlideEditor = ({ slide, onUpdate, onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [points, setPoints] = useState([""]);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slide) {
      setTitle(slide.title || "");
      if (slide.type === "bullet_points") {
        setPoints(slide.content ? slide.content.split("\n") : [""]);
      } else {
        setContent(slide.content || "");
      }
      setImage(null);
    }
  }, [slide]);

  const handleSave = async () => {
    try {
      let updatedData = {
        title,
        type: slide.type,
        content: slide.type === "bullet_points" ? points.join("\n") : content,
      };

      if (image?.file) {
        updatedData.imageFile = image.file;
      }

      await onUpdate(updatedData);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!slide) return null;

  const getSlideTypeIcon = (type) => {
    const typeIcons = {
      classic: <ImageIcon className="w-6 h-6 text-blue-600" />,
      big_title: <Type className="w-6 h-6 text-purple-600" />,
      bullet_points: <ListOrdered className="w-6 h-6 text-green-600" />,
    };
    return typeIcons[type] || null;
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white rounded-lg shadow-sm p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getSlideTypeIcon(slide.type)}
          <h2 className="text-xl font-semibold">Edit Slide</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title input - different styling based on slide type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
              slide.type === "big_title" ? "text-4xl font-bold" : "text-xl"
            }`}
            placeholder="Enter title..."
          />
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Slide Image (Optional)
          </label>
          <ImageUploadArea
            image={image}
            setImage={setImage}
            currentImageUrl={slide.imageUrl}
          />
        </div>

        {/* Content Section - varies by slide type */}
        {slide.type === "classic" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[150px]"
              placeholder="Enter slide content..."
            />
          </div>
        )}

        {slide.type === "bullet_points" && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Bullet Points
            </label>
            <div className="space-y-3">
              {points.map((point, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-gray-500">•</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...points];
                      newPoints[index] = e.target.value;
                      setPoints(newPoints);
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={`Point ${index + 1}`}
                  />
                  {points.length > 1 && (
                    <button
                      onClick={() => {
                        const newPoints = points.filter((_, i) => i !== index);
                        setPoints(newPoints);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {points.length < 6 && (
                <button
                  onClick={() => setPoints([...points, ""])}
                  className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Add Bullet Point
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleSave}
            disabled={!title}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SlideEditor;
