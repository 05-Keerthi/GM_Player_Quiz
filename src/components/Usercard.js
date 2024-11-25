import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUserContext } from "../context/userContext";
import EditUserModal from "../models/EditUserModel";
import { paginateData, PaginationControls } from "../utils/pagination";
import ConfirmationModal from "../models/ConfiremationModel";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.mobile.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [users, searchQuery]);

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
      fetchUsers(); // Fetch updated list
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setConfirmModalOpen(false); // Close confirmation modal
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { currentItems: currentUsers, totalPages } = paginateData(
    filteredUsers,
    currentPage,
    usersPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm min-h-screen">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search User"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-4 font-medium">Username</th>
              <th className="text-left pb-4 font-medium">Email</th>
              <th className="text-left pb-4 font-medium">Mobile Number</th>
              <th className="text-left pb-4 font-medium">User Role</th>
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
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(user._id)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => openConfirmModal(user)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && !loading && (
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
          onPageChange={handlePageChange}
        />
      )}

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
