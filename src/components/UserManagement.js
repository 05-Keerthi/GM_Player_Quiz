import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUserContext } from "../context/userContext";
import { useAuthContext } from "../context/AuthContext";
import { paginateData, PaginationControls } from "../utils/pagination";
import ConfirmationModal from "../models/ConfirmationModal";
import EditUserModal from "../models/User/EditUserModel";

const UserTable = ({
  users,
  searchQuery,
  currentUser,
  onEditClick,
  onDeleteClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { currentItems: currentUsers, totalPages } = paginateData(
    filteredUsers,
    currentPage,
    usersPerPage
  );

  const renderRowActions = (user) => {
    const userRole = currentUser?.role;

    if (!userRole || !["admin", "tenant_admin"].includes(userRole)) {
      return null;
    }

    return (
      <div className="flex justify-end gap-2">
        {userRole === "tenant_admin" && (
          <>
            <button
              onClick={() => onEditClick(user._id)}
              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => onDeleteClick(user)}
              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-4 font-medium">Username</th>
              <th className="text-left pb-4 font-medium">Email</th>
              <th className="text-left pb-4 font-medium">Mobile Number</th>
              <th className="text-left pb-4 font-medium">Role</th>
              <th className="text-right pb-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="py-4">
                  <div className="font-medium">{user.username}</div>
                </td>
                <td>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td>
                  <div className="text-sm text-gray-500">{user.mobile}</div>
                </td>
                <td>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td>{renderRowActions(user)}</td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > usersPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

const UserManagement = () => {
  const {
    users,
    loading,
    error,
    fetchUsers,
    deleteUser,
    clearError,
    fetchUserById,
  } = useUserContext();

  const { user: currentUser } = useAuthContext();

  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: clearError,
      });
    }
  }, [error, clearError]);

  const adminUsers = users?.filter((user) => user.role === "admin") || [];
  const regularUsers = users?.filter((user) => user.role === "user") || [];

  const handleEditClick = async (userId) => {
    try {
      await fetchUserById(userId);
      const userToEdit = users.find((user) => user._id === userId);
      setSelectedUser(userToEdit);
      setEditModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch user details");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(selectedUser._id);
      toast.success("User deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setConfirmModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const openConfirmModal = (user) => {
    setSelectedUser(user);
    setConfirmModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          role="status"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
        ></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm min-h-screen">
      <div className="mb-8">
        {/* Admin Section */}
        <div className="mb-8 border-b-8">
          <div className="flex justify-between items-center mb-4 ">
            <h2 className="text-xl font-medium">Administrators</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Administrators"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
          <UserTable
            users={adminUsers}
            searchQuery={adminSearchQuery}
            currentUser={currentUser}
            onEditClick={handleEditClick}
            onDeleteClick={openConfirmModal}
          />
        </div>

        {/* Regular Users Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Regular Users</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Users"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
          <UserTable
            users={regularUsers}
            searchQuery={userSearchQuery}
            currentUser={currentUser}
            onEditClick={handleEditClick}
            onDeleteClick={openConfirmModal}
          />
        </div>
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the user "${selectedUser?.username}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default UserManagement;
