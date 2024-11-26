import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import { useTenantContext } from "../../context/TenantContext";
import { toast } from "react-toastify";

const TenantAddAdminModal = ({ isOpen, onClose, tenant }) => {
  const { registerTenantAdmin, getTenantAdmins } = useTenantContext();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    mobile: "",
    role: "admin", // Default role
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (value) => {
    setFormData((prev) => ({ ...prev, mobile: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerTenantAdmin(tenant._id, formData);
      toast.success("Admin added successfully!");
      await getTenantAdmins(tenant._id); // Optionally refresh admin list
      onClose(); // Close the modal
    } catch (err) {
      toast.error("Failed to add admin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4">Add Tenant Admin</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full mt-1 border rounded-lg p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full mt-1 border rounded-lg p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full mt-1 border rounded-lg p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="mobile" className="block text-sm font-medium">
              Mobile
            </label>
            <PhoneInput
              value={formData.mobile}
              onChange={handleMobileChange}
              defaultCountry="IN" // Set a default country code
              required
              className="w-full mt-1 border rounded-lg p-2"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium">
              Role
            </label>
            <select
              name="role"
              id="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full mt-1 border rounded-lg p-2"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-4 text-white rounded-lg ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Adding..." : "Add Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantAddAdminModal;
