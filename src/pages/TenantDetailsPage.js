import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Building,
  Edit,
  Globe,
  Mail,
  Plus,
  Pencil,
  Trash,
  Calendar,
  Star,
} from "lucide-react";
import { useTenantContext } from "../context/TenantContext";
import { toast } from "react-toastify";
import TenantEditModal from "../models/Tenant/TenantEditModel";
import ConfirmationModal from "../models/ConfirmationModal";
import TenantAddAdminModal from "../models/Tenant/TenantAddAdminModal";
import TenantAdminEditModal from "../models/Tenant/TenantAdminEditModal";

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
  const [tenant, setTenant] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const getInitial = (username) => {
    return username?.charAt(0)?.toUpperCase() || "";
  };

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        onClose: clearError,
      });
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
    setIsEditAdminModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Company Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{tenant.name}</h2>
                    <p className="text-sm text-blue-600">
                      {tenant.customDomain}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Details Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Company Details
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p>
                          {tenant.description || "No description available"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Domain</p>
                        <p>{tenant.customDomain}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p>{tenant.contactEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Creation Date</p>
                      <p className="font-medium">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Subscription</p>
                      <p className="font-medium">{tenant.plan || "No Plan"}</p>
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
                onClick={() => setIsAddAdminModalOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div
                    key={admin._id}
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
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setAdminToDelete(admin);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-red-500"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {admins.length === 0 && (
                  <p className="text-gray-500">No admins found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TenantEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tenant={tenant}
      />

      <TenantAdminEditModal
        isOpen={isEditAdminModalOpen}
        onClose={() => {
          setIsEditAdminModalOpen(false);
          setSelectedAdmin(null);
          fetchTenantDetails();
        }}
        admin={selectedAdmin}
        tenantId={id}
      />

      <TenantAddAdminModal
        isOpen={isAddAdminModalOpen}
        onClose={() => {
          setIsAddAdminModalOpen(false);
          fetchTenantDetails();
        }}
        tenant={tenant}
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
  );
};

export default TenantDetailsPage;
