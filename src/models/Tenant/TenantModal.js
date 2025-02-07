import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTenantContext } from "../../context/TenantContext";
import { Plus, X, Upload } from "lucide-react";

const TenantModal = ({ isOpen, onClose, tenant = null, onUpdate }) => {
  const { createTenant, updateTenant } = useTenantContext();
  const isEditing = Boolean(tenant);

  const [formData, setFormData] = useState({
    name: "",
    customDomain: "",
    mobileNumber: [""],
    email: [""],
    theme: "",
    primaryColor: "#2929FF",
    secondaryColor: "#FFFFFF",
    fontFamily: "",
    logo: "", // URL for external logo
    customLogo: "", // For uploaded logo
    description: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        customDomain: tenant.customDomain || "",
        mobileNumber: tenant.mobileNumber?.length ? tenant.mobileNumber : [""],
        email: tenant.email?.length ? tenant.email : [""],
        theme: tenant.theme || "",
        primaryColor: tenant.primaryColor || "#2929FF",
        secondaryColor: tenant.secondaryColor || "#FFFFFF",
        fontFamily: tenant.fontFamily || "",
        logo: tenant.logo || "",
        customLogo: tenant.customLogo || "",
        description: tenant.description || "",
      });
      // Set preview URL to customLogo first (if exists), then fall back to logo
      setPreviewUrl(tenant.customLogo || tenant.logo || "");
    } else {
      setFormData({
        name: "",
        customDomain: "",
        mobileNumber: [""],
        email: [""],
        theme: "",
        primaryColor: "#2929FF",
        secondaryColor: "#FFFFFF",
        fontFamily: "",
        logo: "",
        customLogo: "",
        description: "",
      });
      setPreviewUrl("");
      setSelectedFile(null);
    }
    setErrors({});
  }, [tenant, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "File size should be less than 5MB",
        }));
        return;
      }

      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, logo: "Please upload an image file" }));
        return;
      }

      setSelectedFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      // Clear both logo and customLogo when a new file is selected
      setFormData((prev) => ({ ...prev, logo: "", customLogo: "" }));
      setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const clearLogo = () => {
    setPreviewUrl("");
    setSelectedFile(null);
    setFormData((prev) => ({
      ...prev,
      logo: "",
      customLogo: "",
    }));
  };

  const handleArrayFieldChange = (index, value, fieldName) => {
    setFormData((prev) => {
      const newArray = [...prev[fieldName]];
      newArray[index] = value;
      return {
        ...prev,
        [fieldName]: newArray,
      };
    });
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const addArrayField = (fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: [...prev[fieldName], ""],
    }));
  };

  const removeArrayField = (index, fieldName) => {
    setFormData((prev) => {
      const newArray = prev[fieldName].filter((_, i) => i !== index);
      return {
        ...prev,
        [fieldName]: newArray.length === 0 ? [""] : newArray,
      };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    // Validate required fields only
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.customDomain.trim()) {
      newErrors.customDomain = "Custom domain is required";
    }

    const validMobileNumbers = formData.mobileNumber.filter((num) =>
      num.trim()
    );
    if (validMobileNumbers.length === 0) {
      newErrors.mobileNumber = "At least one mobile number is required";
    }

    const validEmails = formData.email.filter((email) => email.trim());
    if (validEmails.length === 0) {
      newErrors.email = "At least one email is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();

      // Add all fields to FormData
      Object.keys(formData).forEach((key) => {
        if (key === "mobileNumber" || key === "email") {
          // Handle arrays
          formData[key]
            .filter((item) => item.trim())
            .forEach((item) => submitData.append(key, item.trim()));
        } else if (key !== "logo" && formData[key] !== "") {
          // Add other fields
          submitData.append(key, formData[key]);
        }
      });

      // Handle logo
      if (selectedFile) {
        submitData.append("customLogo", selectedFile);
      } else if (formData.logo) {
        submitData.append("logo", formData.logo);
      }

      let updatedTenant;
      if (isEditing) {
        updatedTenant = await updateTenant(tenant._id, submitData);
        toast.success("Tenant updated successfully!");
      } else {
        updatedTenant = await createTenant(submitData);
        toast.success("Tenant created successfully!");
      }

      if (onUpdate) {
        onUpdate(updatedTenant);
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {});
        setErrors(fieldErrors);
      } else {
        toast.error(
          error.response?.data?.message ||
            `Failed to ${isEditing ? "update" : "create"} tenant`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
          {isEditing ? "Edit Tenant" : "Create New Tenant"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Required Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter tenant name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Custom Domain Field */}
              <div>
                <label
                  htmlFor="customDomain"
                  className="block text-sm font-medium mb-2"
                >
                  Custom Domain <span className="text-red-500">*</span>
                </label>
                <input
                  id="customDomain"
                  type="text"
                  name="customDomain"
                  value={formData.customDomain}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-4 py-2 ${
                    errors.customDomain ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., tenant.example.com"
                />
                {errors.customDomain && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.customDomain}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Numbers */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Mobile Numbers <span className="text-red-500">*</span>
              </label>
              {formData.mobileNumber.map((number, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="tel"
                    value={number}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        index,
                        e.target.value,
                        "mobileNumber"
                      )
                    }
                    className={`flex-1 border rounded-lg px-4 py-2 ${
                      errors.mobileNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter mobile number"
                  />
                  {formData.mobileNumber.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, "mobileNumber")}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("mobileNumber")}
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Add another number
              </button>
              {errors.mobileNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            {/* Email Addresses */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Addresses <span className="text-red-500">*</span>
              </label>
              {formData.email.map((email, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      handleArrayFieldChange(index, e.target.value, "email")
                    }
                    className={`flex-1 border rounded-lg px-4 py-2 ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter email address"
                  />
                  {formData.email.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField(index, "email")}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("email")}
                className="text-blue-500 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                Add another email
              </button>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Optional Fields Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Additional Information
            </h3>

            {/* Logo Section */}
            <div className="space-y-4">
              <label className="block text-sm font-medium">Logo</label>

              {/* Logo Preview */}
              {(previewUrl || formData.customLogo || formData.logo) && (
                <div className="relative inline-block">
                  <img
                    src={previewUrl || formData.customLogo || formData.logo}
                    alt="Logo preview"
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Logo Input Options */}
              <div className="space-y-4">
                {/* URL Input */}
                <div>
                  <label
                    htmlFor="logo-url"
                    className="block text-sm font-medium mb-2"
                  >
                    Logo URL
                  </label>
                  <input
                    id="logo-url"
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={(e) => {
                      handleChange(e);
                      if (e.target.value) {
                        setSelectedFile(null);
                        setPreviewUrl("");
                        setFormData((prev) => ({ ...prev, customLogo: "" }));
                      }
                    }}
                    placeholder="Enter logo URL"
                    className="w-full border rounded-lg px-4 py-2 border-gray-300"
                    disabled={!!selectedFile || !!formData.customLogo}
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      URL input is disabled while using file upload
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label
                    htmlFor="logo-upload"
                    className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.logo ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    <span>Upload Logo</span>
                    <input
                      id="logo-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={!!formData.logo}
                    />
                  </label>
                  {formData.logo ? (
                    <p className="text-sm text-gray-500 mt-1">
                      File upload is disabled while using URL
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Max file size: 5MB. Supported formats: PNG, JPG, JPEG
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 border-gray-300"
                rows="3"
                placeholder="Enter tenant description"
              />
            </div>

            {/* Theme and Font */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium mb-2"
                >
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 border-gray-300"
                >
                  <option value="">Select Theme</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="fontFamily"
                  className="block text-sm font-medium mb-2"
                >
                  Font Family
                </label>
                <input
                  id="fontFamily"
                  type="text"
                  name="fontFamily"
                  value={formData.fontFamily}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 border-gray-300"
                  placeholder="e.g., Arial, sans-serif"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="primaryColor"
                  className="block text-sm font-medium mb-2"
                >
                  Primary Color
                </label>
                <input
                  id="primaryColor"
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-full h-10"
                />
              </div>
              <div>
                <label
                  htmlFor="secondaryColor"
                  className="block text-sm font-medium mb-2"
                >
                  Secondary Color
                </label>
                <input
                  id="secondaryColor"
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg flex items-center ${
                loading ? "bg-blue-400" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Tenant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantModal;
