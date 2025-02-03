import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Building, Edit, Mail, Plus, Pencil, Trash, Star } from "lucide-react";
import { useTenantContext } from "../context/TenantContext";
import { toast } from "react-toastify";
import TenantModal from "../models/Tenant/TenantModal";
import TenantAdminModal from "../models/Tenant/TenantAdminModal";
import ConfirmationModal from "../models/ConfirmationModal";
import Navbar from "../components/NavbarComp";

const TenantDetailsPage = () => {
  const { id } = useParams();
  const {
    getTenantById,
    getTenantAdmins,
    deleteTenantAdmin,
    error,
    loading,
    clearError,
  } = useTenantContext();

  // State management
  const [tenant, setTenant] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected item states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const fetchTenantDetails = async () => {
    try {
      const tenantData = await getTenantById(id);
      setTenant(tenantData);
      const adminData = await getTenantAdmins(id);
      setAdmins(adminData);
    } catch (err) {
      toast.error("Failed to fetch tenant details");
    }
  };

  // Function to truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleTenantUpdate = async (updatedTenant) => {
    setTenant(updatedTenant);
    await fetchTenantDetails(); // Refresh all data to ensure everything is in sync
  };

  const getInitial = (username) => {
    return username?.charAt(0)?.toUpperCase() || "";
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleDeleteAdmin = async () => {
    try {
      await deleteTenantAdmin(id, adminToDelete._id);
      toast.success("Admin deleted successfully");
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchTenantDetails();
    } catch (err) {
      toast.error("Failed to delete admin");
    }
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setIsAdminModalOpen(true);
  };

  const handleAddAdmin = () => {
    setSelectedAdmin(null);
    setIsAdminModalOpen(true);
  };

  const handleCloseAdminModal = () => {
    setIsAdminModalOpen(false);
    setSelectedAdmin(null);
    fetchTenantDetails();
  };

  const handleEditTenant = () => {
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          data-testid="loading-spinner"
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
        ></div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen bg-gray-50 p-6"
        data-testid="tenant-details-page"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={tenant.logo || tenant.customLogo}
                      alt={tenant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      data-testid="tenant-logo"
                    />
                    <div>
                      <h2
                        className="text-xl font-semibold"
                        data-testid="tenant-name"
                      >
                        {tenant.name}
                      </h2>
                      <p
                        className="text-sm text-blue-600"
                        data-testid="tenant-domain"
                      >
                        {tenant.customDomain}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEditTenant}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    data-testid="edit-tenant-button"
                  >
                    <Edit size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Details Section */}
                    <div className="space-y-4" data-testid="company-details">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Company Details
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-gray-500">Description</p>
                          <div
                            className="relative"
                            data-testid="tenant-description"
                          >
                            <p
                              className={
                                isDescriptionExpanded ? "" : "line-clamp-2"
                              }
                            >
                              {tenant.description || "No description available"}
                            </p>
                            {tenant.description &&
                              tenant.description.length > 150 && (
                                <button
                                  onClick={() =>
                                    setIsDescriptionExpanded(
                                      !isDescriptionExpanded
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
                                >
                                  {isDescriptionExpanded
                                    ? "View less"
                                    : "View more"}
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4" data-testid="contact-info">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Mobile Numbers
                          </p>
                          <div className="space-y-1">
                            {tenant.mobileNumber?.map((number, index) => (
                              <p
                                key={index}
                                data-testid={`tenant-mobile-${index}`}
                              >
                                {number}
                              </p>
                            ))}
                            {(!tenant.mobileNumber ||
                              tenant.mobileNumber.length === 0) && (
                              <p className="text-gray-400">
                                No mobile numbers available
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">
                            Email Addresses
                          </p>
                          <div className="space-y-1">
                            {tenant.email?.map((email, index) => (
                              <p
                                key={index}
                                data-testid={`tenant-email-${index}`}
                              >
                                {email}
                              </p>
                            ))}
                            {(!tenant.email || tenant.email.length === 0) && (
                              <p className="text-gray-400">
                                No email addresses available
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mt-6" data-testid="additional-info">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5" />
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Creation Date</p>
                        <p className="font-medium" data-testid="creation-date">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Status</p>
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          data-testid="tenant-status"
                        >
                          Active
                        </span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Subscription</p>
                        <p className="font-medium" data-testid="tenant-plan">
                          {tenant.plan || "No Plan"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Admins */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="flex items-center justify-between p-6 pb-2">
                <h2 className="text-lg font-semibold">Administrators</h2>
                <button
                  onClick={handleAddAdmin}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  data-testid="add-admin-button"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-3" data-testid="admins-list">
                  {admins.map((admin) => (
                    <div
                      key={admin._id}
                      data-testid={`admin-item-${admin._id}`}
                      className="group flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium">
                          {getInitial(admin.username)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{admin.username}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {admin.email}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleEditAdmin(admin)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          data-testid={`edit-admin-button-${admin._id}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setAdminToDelete(admin);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-red-500"
                          data-testid={`delete-admin-button-${admin._id}`}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {admins.length === 0 && (
                    <p
                      className="text-gray-500"
                      data-testid="no-admins-message"
                    >
                      No admins found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <TenantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tenant={tenant}
          onUpdate={handleTenantUpdate}
        />

        <TenantAdminModal
          isOpen={isAdminModalOpen}
          onClose={handleCloseAdminModal}
          admin={selectedAdmin}
          tenantId={id}
          mode={selectedAdmin ? "edit" : "add"}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setAdminToDelete(null);
          }}
          onConfirm={handleDeleteAdmin}
          title="Delete Admin"
          message={`Are you sure you want to delete ${adminToDelete?.username} from the tenant admins?`}
        />
      </div>
    </>
  );
};

export default TenantDetailsPage;
