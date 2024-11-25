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
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        customDomain: tenant.customDomain || "",
        theme: tenant.theme || "",
        primaryColor: tenant.primaryColor || "",
        secondaryColor: tenant.secondaryColor || "",
        fontFamily: tenant.fontFamily || "",
      });
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTenant(tenant._id, formData);
      toast.success("Tenant updated successfully!");
      onClose();
    } catch (error) {
      if (error.response && error.response.data.errors) {
        // If validation errors are returned from the server
        error.response.data.errors.forEach((err) =>
          toast.error(`${err.field}: ${err.message}`)
        );
      } else {
        // General error message if no specific errors are returned
        toast.error("Failed to update tenant");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Edit Tenant</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Domain
            </label>
            <input
              type="text"
              name="customDomain"
              value={formData.customDomain}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
            >
              <option value="">Select Theme</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
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
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Font Family
            </label>
            <input
              type="text"
              name="fontFamily"
              value={formData.fontFamily}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantEditModal;
