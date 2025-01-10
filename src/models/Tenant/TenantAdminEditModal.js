import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import { useTenantContext } from "../../context/TenantContext";
import { toast } from "react-toastify";

const TenantAdminEditModal = ({ isOpen, onClose, admin, tenantId }) => {
  const { updateTenantAdmin, getTenantAdmins } = useTenantContext();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    role: "tenant_admin",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form data and errors when modal is opened/closed or admin changes
  useEffect(() => {
    if (isOpen && admin) {
      setFormData({
        username: admin.username || "",
        email: admin.email || "",
        mobile: admin.mobile || "",
        role: admin.role || "tenant_admin",
      });
      setErrors({});
    } else {
      // Reset everything when modal is closed
      setFormData({
        username: "",
        email: "",
        mobile: "",
        role: "tenant_admin",
      });
      setErrors({});
    }
  }, [isOpen, admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMobileChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      mobile: value || "",
    }));
    setErrors((prev) => ({ ...prev, mobile: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateTenantAdmin(tenantId, admin._id, formData);
      await getTenantAdmins(tenantId);
      toast.success("Admin updated successfully!");
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
        toast.error(error.response?.data?.message || "Failed to update admin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setLoading(false);
    onClose();
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6"
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        <h2 id="modal-title" className="text-xl font-semibold mb-4">
          Edit Tenant Admin
        </h2>
        <form onSubmit={handleSubmit} aria-label="Edit tenant admin form">
          <div className="mb-4">
            <label
              htmlFor="edit-username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              id="edit-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
              required
              aria-invalid={errors.username ? "true" : "false"}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p
                id="username-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.username}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium mb-2"
            >
              Email
            </label>
            <input
              id="edit-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              required
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p
                id="email-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-mobile"
              className="block text-sm font-medium mb-2"
            >
              Mobile
            </label>
            <PhoneInput
              id="edit-mobile"
              value={formData.mobile}
              onChange={handleMobileChange}
              defaultCountry="IN"
              className={`w-full mt-1 ${errors.mobile ? "border-red-500" : ""}`}
              aria-invalid={errors.mobile ? "true" : "false"}
              aria-describedby={errors.mobile ? "mobile-error" : undefined}
            />
            {errors.mobile && (
              <p
                id="mobile-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.mobile}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-role"
              className="block text-sm font-medium mb-2"
            >
              Role
            </label>
            <select
              id="edit-role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
              aria-invalid={errors.role ? "true" : "false"}
              aria-describedby={errors.role ? "role-error" : undefined}
            >
              <option value="tenant_admin">Tenant Admin</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p
                id="role-error"
                className="mt-1 text-sm text-red-500"
                role="alert"
              >
                {errors.role}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              disabled={loading}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white rounded-lg ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
              aria-label={loading ? "Updating admin..." : "Update admin"}
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
