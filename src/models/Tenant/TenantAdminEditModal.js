import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import { useTenantContext } from "../../context/TenantContext";
import { toast } from "react-toastify";

const TenantAdminEditModal = ({ isOpen, onClose, admin, tenantId }) => {
  const { updateTenantAdmin } = useTenantContext();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    role: "tenant_admin",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setFormData({
        username: admin.username || "",
        email: admin.email || "",
        mobile: admin.mobile || "",
        role: admin.role || "tenant_admin",
      });
      setErrors({}); // Clear errors when admin data changes
    }
  }, [admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMobileChange = (value) => {
    setFormData((prev) => ({ ...prev, mobile: value }));
    setErrors((prev) => ({ ...prev, mobile: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTenantAdmin(tenantId, admin._id, formData);
      toast.success("Admin updated successfully!");
      onClose();
    } catch (err) {
      const fieldErrors =
        err.response?.data?.errors?.reduce((acc, error) => {
          acc[error.field] = error.message;
          return acc;
        }, {}) || {};
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) {
        toast.error("Failed to update admin. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      email: "",
      mobile: "",
      role: "tenant_admin",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Tenant Admin</h2>
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
              className={`w-full mt-1 border rounded-lg p-2 ${
                errors.username ? "border-red-500" : ""
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
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
              className={`w-full mt-1 border rounded-lg p-2 ${
                errors.email ? "border-red-500" : ""
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="mobile" className="block text-sm font-medium">
              Mobile
            </label>
            <PhoneInput
              value={formData.mobile}
              onChange={handleMobileChange}
              defaultCountry="IN"
              className={`w-full mt-1 border rounded-lg p-2 ${
                errors.mobile ? "border-red-500" : ""
              }`}
            />
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>
            )}
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
              <option value="tenant_admin">Tenant Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
              {loading ? "Updating..." : "Update Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantAdminEditModal;
