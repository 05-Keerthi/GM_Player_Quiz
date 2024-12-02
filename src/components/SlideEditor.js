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
    <div className="space-y-4">
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
        {(image?.preview || currentImageUrl) && (
          <button
            onClick={() => setImage(null)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
          >
            <Trash2 className="w-5 h-5" />
            Remove
          </button>
        )}
      </div>

      {(image?.preview || currentImageUrl) && (
        <div className="relative mt-4 group">
          <img
            src={image?.preview || currentImageUrl}
            alt="Slide"
            className="w-full h-64 object-cover rounded-lg shadow-md group-hover:opacity-80 transition"
          />
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Slide Image
          </label>
          <ImageUploadArea
            image={image}
            setImage={setImage}
            currentImageUrl={slide.imageUrl}
          />
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
                    onChange={(e) => {
                      const newPoints = [...points];
                      newPoints[index] = e.target.value;
                      setPoints(newPoints);
                    }}
                    className="flex-1 p-2 border-b-2 border-transparent focus:border-blue-500 transition-colors"
                    placeholder={`Point ${index + 1}`}
                  />
                  {points.length > 1 && (
                    <button
                      onClick={() => {
                        const newPoints = points.filter((_, i) => i !== index);
                        setPoints(newPoints);
                      }}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-full"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPoints([...points, ""])}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                Add Bullet Point
              </button>
            </div>
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