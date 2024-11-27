import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Building,
  Edit,
  Globe,
  Mail,
  Users,
  Plus,
  Pencil,
  Trash,
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
      fetchTenantDetails(); // Refresh the admin list
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
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div className="col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              {/* Existing tenant info content */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <img
                    src={tenant.logo}
                    alt={tenant.name}
                    className="w-16 h-16 rounded-lg object-cover mr-4"
                  />
                  <div>
                    <h2 className="text-xl font-semibold">{tenant.name}</h2>
                    <p className="text-gray-500">{tenant.customDomain}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-gray-400 mr-3" />
                  <span>
                    {tenant.description || "No description available"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{tenant.customDomain}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <span>{tenant.contactEmail}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Admins */}
          <div className="col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tenant Admins</h3>
                <button
                  onClick={() => setIsAddAdminModalOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {admins.map((admin) => (
                  <div
                    key={admin._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {admin.firstName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {admin.firstName} {admin.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setAdminToDelete(admin);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-red-500"
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
          message={`Are you sure you want to delete ${adminToDelete?.firstName} ${adminToDelete?.lastName} from the tenant admins?`}
        />
      </div>
    </div>
  );
};

export default TenantDetailsPage;
