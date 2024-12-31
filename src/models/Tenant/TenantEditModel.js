import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTenantContext } from "../../context/TenantContext";

const TenantEditModal = ({ isOpen, onClose, tenant }) => {
  const { updateTenant } = useTenantContext();
  const [formData, setFormData] = useState({
    name: "",
    customDomain: "",
    theme: "",
    primaryColor: "",
    secondaryColor: "",
    fontFamily: "",
    logo: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        customDomain: tenant.customDomain || "",
        theme: tenant.theme || "",
        primaryColor: tenant.primaryColor || "",
        secondaryColor: tenant.secondaryColor || "",
        fontFamily: tenant.fontFamily || "",
        logo: tenant.logo || "",
      });
      setErrors({});
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedTenant = await updateTenant(tenant._id, formData);
      toast.success("Tenant updated successfully!");
      onClose();
    } catch (error) {
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors.reduce((acc, err) => {
          acc[err.field] = err.message;
          return acc;
        }, {});
        setErrors(fieldErrors);
        error.response.data.errors.forEach((err) =>
          toast.error(`${err.field}: ${err.message}`)
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to update tenant");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Edit Tenant</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Custom Domain
            </label>
            <input
              type="text"
              name="customDomain"
              value={formData.customDomain}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.customDomain ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.customDomain && (
              <p className="mt-1 text-sm text-red-500">{errors.customDomain}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <input
              type="url"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.logo ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.logo && (
              <p className="mt-1 text-sm text-red-500">{errors.logo}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.theme ? "border-red-500" : "border-gray-300"
              }`}
              required
            >
              <option value="">Select Theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            {errors.theme && (
              <p className="mt-1 text-sm text-red-500">{errors.theme}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Color
              </label>
              <input
                type="color"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-full h-10"
              />
              {errors.primaryColor && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.primaryColor}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Secondary Color
              </label>
              <input
                type="color"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="w-full h-10"
              />
              {errors.secondaryColor && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.secondaryColor}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Font Family
            </label>
            <input
              type="text"
              name="fontFamily"
              value={formData.fontFamily}
              onChange={handleChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.fontFamily ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.fontFamily && (
              <p className="mt-1 text-sm text-red-500">{errors.fontFamily}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg ${
                loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantEditModal;
