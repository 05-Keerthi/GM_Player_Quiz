// TenantDetailsModal.js
import React from "react";

const TenantDetailsModal = ({ isOpen, onClose, tenant, onEdit }) => {
  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-96">
        <h2 className="text-lg font-bold mb-4">Tenant Details</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <img
              src={tenant.logo}
              alt={tenant.name}
              className="w-16 h-16 rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-lg">{tenant.name}</h3>
              <p className="text-sm text-blue-600">{tenant.customDomain}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Theme</p>
              <p>{tenant.theme}</p>
            </div>
            <div>
              <p className="font-medium">Font Family</p>
              <p>{tenant.fontFamily}</p>
            </div>
            <div>
              <p className="font-medium">Colors</p>
              <div className="flex space-x-2">
                <div
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: tenant.primaryColor }}
                  title="Primary Color"
                />
                <div
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: tenant.secondaryColor }}
                  title="Secondary Color"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={() => {
              onEdit(tenant);
              onClose();
            }}
          >
            Edit Tenant
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

export default TenantDetailsModal;
