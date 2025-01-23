import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  X,
  Image as ImageIcon,
  Type,
  ListOrdered,
  Upload,
  Trash2,
} from "lucide-react";

const SlideTypeModal = ({ isOpen, onClose, onAddSlide }) => {
  const { quizId } = useParams();
  const [selectedType, setSelectedType] = useState(null);
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [slide, setSlide] = useState({
    title: "",
    type: "",
    content: "",
    imageUrl: null,
    points: [""],
    quizId: quizId,
    position: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
      setStep(1);
      setImagePreview(null);
      setSlide({
        title: "",
        type: "",
        content: "",
        points: [""],
        imageUrl: null,
        quizId: quizId,
      });
    }
  }, [isOpen, quizId]);

  const slideTypes = [
    {
      id: "classic",
      icon: ImageIcon,
      title: "Classic",
      description: "Give players more context or additional explanation",
    },
    {
      id: "big_title",
      icon: Type,
      title: "Big Title",
      description: "Display large text with emphasis",
    },
    {
      id: "bullet_points",
      icon: ListOrdered,
      title: "Bullet Points",
      description: "Present information in a structured list",
    },
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("media", file);

        const token = localStorage.getItem("token");
        const uploadResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/media/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadResponse.json();
        const mediaData = uploadData.media[0];

        // Store the media ID
        setSlide((prev) => ({
          ...prev,
          imageUrl: mediaData._id, // Store just the media ID
        }));

        // Set preview URL
        setImagePreview(
          `${process.env.REACT_APP_API_URL}/uploads/${mediaData.filename}`
        );

        console.log("Media uploaded successfully:", mediaData._id); // Debug log
      } catch (error) {
        console.error("Image upload error:", error);
        setError("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setSlide((prev) => ({
      ...prev,
      imageUrl: null,
    }));
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSlide((prev) => ({
      ...prev,
      type: type,
      points: type === "bullet_points" ? [""] : [],
    }));
    setStep(2);
  };

  const handlePointChange = (index, value) => {
    setSlide((prev) => ({
      ...prev,
      points: prev.points.map((point, i) => (i === index ? value : point)),
    }));
  };

  const addPoint = () => {
    setSlide((prev) => ({
      ...prev,
      points: [...prev.points, ""],
    }));
  };

  const removePoint = (index) => {
    setSlide((prev) => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      // Log the current state before submission
      console.log("Current slide state before submission:", slide);

      const finalSlide = {
        title: slide.title,
        type: slide.type,
        content:
          slide.type === "bullet_points"
            ? slide.points.join("\n")
            : slide.content,
        imageUrl: slide.imageUrl, // This is already the media ID
        position: slide.position || 0,
        quizId: quizId, // Ensure quizId is included
      };

      console.log("Submitting slide payload:", finalSlide); // Debug log

      if (!finalSlide.title) {
        throw new Error("Slide title is required");
      }

      // Validate type is one of the allowed values
      const validTypes = ["classic", "big_title", "bullet_points"];
      if (!validTypes.includes(finalSlide.type)) {
        throw new Error(
          `Invalid slide type. Must be one of: ${validTypes.join(", ")}`
        );
      }

      await onAddSlide(finalSlide);

      // Reset the form
      setSelectedType(null);
      setStep(1);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Slide submission error:", error);
      setError(error.message);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 1 ? "Select Slide Type" : "Create Slide"}
          </h2>
          <button
            onClick={() => {
              if (step === 2) {
                setStep(1);
                setSelectedType(null);
              } else {
                onClose();
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slideTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="p-4 border rounded-lg text-left transition-all hover:border-blue-300"
              >
                <div className="flex items-center gap-3">
                  <type.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium">{type.title}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="slide-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Slide Title <span className="text-red-500">*</span>
              </label>
              <input
                id="slide-title"
                type="text"
                value={slide.title}
                onChange={(e) => setSlide({ ...slide, title: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your slide title..."
                aria-label="Slide Title"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Slide Image (Optional)
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
              </div>

              {imagePreview && (
                <div className="relative mt-4">
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
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={handleImageRemove}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedType === "bullet_points" ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">
                    Points
                  </label>
                  {slide.points.length < 6 && (
                    <button
                      onClick={addPoint}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Add Point
                    </button>
                  )}
                </div>
                {slide.points.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handlePointChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Point ${index + 1}`}
                    />
                    {slide.points.length > 1 && (
                      <button
                        onClick={() => removePoint(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        aria-label="remove Point"
                      >
                        <X className="w-4 h-4" />
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
                  value={slide.content}
                  onChange={(e) =>
                    setSlide({ ...slide, content: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter slide content..."
                  rows={4}
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!slide.title}
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Slide
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlideTypeModal;
