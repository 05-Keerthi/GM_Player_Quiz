import React, { useState, useEffect } from "react";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTenantContext } from "../context/TenantContext";
import { paginateData, PaginationControls } from "../utils/pagination";
import TenantModal from "../models/Tenant/TenantModal";
import ConfirmationModal from "../models/ConfirmationModal";

const TenantManagement = () => {
  const navigate = useNavigate();
  const { state, getAllTenants, deleteTenant, error, clearError, loading } =
    useTenantContext();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Selected tenant states
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantToDelete, setTenantToDelete] = useState(null);

  // Search and pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const tenantsPerPage = 5;

  // Initial data fetch
  useEffect(() => {
    getAllTenants();
  }, []);

  // Filter tenants based on search query
  useEffect(() => {
    if (state.tenants) {
      setFilteredTenants(
        state.tenants.filter(
          (tenant) =>
            tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.customDomain
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [state.tenants, searchQuery]);

  // Error handling with toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleTenantClick = (tenantId) => {
    navigate(`/tenants/${tenantId}`);
  };

  const handleCreateNew = () => {
    setSelectedTenant(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tenant) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTenant(null);
  };

  const handleDelete = async () => {
    if (tenantToDelete) {
      try {
        await deleteTenant(tenantToDelete);
        await getAllTenants();
        toast.success("Tenant deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete tenant");
      } finally {
        setTenantToDelete(null);
        setIsConfirmOpen(false);
      }
    }
  };

  const confirmDelete = (tenantId) => {
    setTenantToDelete(tenantId);
    setIsConfirmOpen(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const { currentItems: currentTenants, totalPages } = paginateData(
    filteredTenants,
    currentPage,
    tenantsPerPage
  );

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
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
      <div className="mb-8">
        <div className="flex flex-wrap justify-end items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Tenant"
              aria-label="Search Tenant"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left pb-4 font-medium">Logo</th>
              <th className="text-left pb-4 font-medium">Tenant</th>
              <th className="text-left pb-4 font-medium">Domain</th>
              <th className="text-right pb-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTenants.map((tenant) => (
              <tr key={tenant._id} className="border-b hover:bg-gray-50">
                <td
                  className="py-4 cursor-pointer"
                  onClick={() => handleTenantClick(tenant._id)}
                >
                  <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                </td>
                <td
                  className="py-4 cursor-pointer"
                  onClick={() => handleTenantClick(tenant._id)}
                >
                  <div className="font-medium">{tenant.name}</div>
                </td>
                <td
                  className="text-sm cursor-pointer"
                  onClick={() => handleTenantClick(tenant._id)}
                >
                  <span className="text-blue-600">{tenant.customDomain}</span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(tenant)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      aria-label="Edit Tenant"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => confirmDelete(tenant._id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      aria-label="Delete Tenant"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentTenants.length === 0 && !loading && (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No tenants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredTenants.length > tenantsPerPage && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Unified Modal for Create/Edit */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tenant={selectedTenant}
      />

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
      />
    </div>
  );
};

export default TenantManagement;
