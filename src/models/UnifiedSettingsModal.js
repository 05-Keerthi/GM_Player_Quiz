import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

const UnifiedSettingsModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  type = "quiz",
  onTitleUpdate,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
// Update form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
      });
      setError("");
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      setError("Title is required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Update title in parent component
      if (onTitleUpdate) {
        onTitleUpdate(formData.title);
      }

      // Save the form data
      if (onSave) {
        await onSave(formData);
      }

      onClose();
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">
              {type.charAt(0).toUpperCase() + type.slice(1)} Settings
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={`Enter ${type} title`}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={`Enter ${type} description`}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-shadow"
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnifiedSettingsModal;
