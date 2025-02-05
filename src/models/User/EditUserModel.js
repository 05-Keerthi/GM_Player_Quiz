import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/userContext";

const EditUserModal = ({ isOpen, onClose, user }) => {
  const { updateUser } = useUserContext();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        mobile: user.mobile || "",
        role: user.role || "",
      });
      setErrors({});
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await updateUser(user._id, formData);
      toast.success("User updated successfully!");
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
        toast.error(error.response?.data?.message || "Failed to update user");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="edit-user-modal"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              aria-label="Username"
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {errors.username}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              aria-label="Email"
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {errors.email}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="mobile" className="block text-sm font-medium mb-2">
              Mobile
            </label>
            <input
              id="mobile"
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
              aria-label="Mobile"
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {errors.mobile}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              aria-label="Role"
              className={`w-full border rounded-lg px-4 py-2 ${
                errors.role ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500" role="alert">
                {errors.role}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
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
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
                loading ? "bg-blue-400" : "hover:bg-blue-600"
              }`}
            >
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
