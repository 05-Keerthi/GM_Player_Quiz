import React, { useState } from "react";
import { toast } from "react-toastify";
import { useTenantContext } from "../../context/TenantContext";

const CreateTenantModal = ({ isOpen, onClose }) => {
  const { createTenant } = useTenantContext();
  const [formData, setFormData] = useState({
    name: "",
    customDomain: "",
    theme: "",
    primaryColor: "#000000",
    secondaryColor: "#000000",
    fontFamily: "",
    logo: "", // Added logo field
  });

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
      await createTenant(formData);
      toast.success("Tenant created successfully!");
      setFormData({
        name: "",
        customDomain: "",
        theme: "",
        primaryColor: "#000000",
        secondaryColor: "#000000",
        fontFamily: "",
        logo: "",
      });
      onClose();
    } catch (error) {
      if (error.errors) {
        error.errors.forEach((err) => toast.error(err));
      } else {
        toast.error("Failed to create tenant");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Create New Tenant</h2>
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
              placeholder="Enter tenant name"
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
              placeholder="e.g., tenant.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <input
              type="url"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2"
              required
              placeholder="Enter logo URL"
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
              placeholder="e.g., Arial, sans-serif"
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
              Create Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;
