import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  ACTIONS,
  tenantReducer,
} from "../reducers/TenantReducer";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: getAuthHeaders(),
});

// Create context
export const TenantContext = createContext();

// Provider component
export const TenantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);

  // Actions
  const actions = {
    createTenant: async (tenantData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        // Send data to backend to create the tenant
        const { data: newTenant } = await api.post("/tenants", tenantData);
        dispatch({ type: ACTIONS.ADD_TENANT, payload: newTenant });
        return newTenant;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: error.response?.data?.message
            ? {
                message:
                  error.response?.data?.message || "Failed to create tenant",
                errors: error.response?.data?.errors || [],
              }
            : {
                message: "Failed to create tenant",
              },
        });
        throw error;
      }
    },

    updateTenant: async (id, tenantData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        // Send data to backend to update the tenant
        const { data: updatedTenant } = await api.put(
          `/tenants/${id}`,
          tenantData
        );
        dispatch({ type: ACTIONS.UPDATE_TENANT, payload: updatedTenant });
        return updatedTenant;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: error.response?.data?.message
            ? {
                message:
                  error.response?.data?.message || "Failed to update tenant",
                errors: error.response?.data?.errors || [],
              }
            : {
                message: "Failed to update tenant",
              },
        });
        throw error;
      }
    },

    deleteTenant: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/tenants/${id}`);
        dispatch({ type: ACTIONS.DELETE_TENANT, payload: id });
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to delete tenant",
          },
        });
        throw error;
      }
    },

    getAllTenants: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: tenants } = await api.get("/tenants");
        dispatch({ type: ACTIONS.SET_TENANTS, payload: tenants });
        return tenants;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch tenants",
          },
        });
        throw error;
      }
    },

    getTenantById: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: tenant } = await api.get(`/tenants/${id}`);
        dispatch({ type: ACTIONS.SET_CURRENT_TENANT, payload: tenant });
        return tenant;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.response?.data?.message || "Failed to fetch tenant",
          },
        });
        throw error;
      }
    },
  };

  return (
    <TenantContext.Provider value={{ state, ...actions }}>
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook for using the tenant context
export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
};
