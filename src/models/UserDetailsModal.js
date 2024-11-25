// UserDetailsModal.js
import React from "react";

const UserDetailsModal = ({ isOpen, onClose, user, onEdit }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96">
        <h2 className="text-lg font-bold mb-4">User Details</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="font-semibold text-lg">{user.username}</h3>
              <p className="text-sm text-blue-600">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Mobile</p>
              <p>{user.mobile}</p>
            </div>
            <div>
              <p className="font-medium">Role</p>
              <p>{user.role}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={() => {
              onEdit(user); // This will open the edit modal
              onClose(); // Close the details modal
            }}
          >
            Edit User
          </button>
          <button
            className="px-4 py-2 bg-gray-300 rounded-lg"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
