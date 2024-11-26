import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import {
  initialState,
  ACTIONS,
  tenantReducer,
} from "../reducers/TenantReducer";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to always get fresh token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);

  const actions = {
    createTenant: async (tenantData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: newTenant } = await api.post("/tenants", tenantData);
        dispatch({ type: ACTIONS.ADD_TENANT, payload: newTenant });
        return newTenant;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create tenant",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    updateTenant: async (id, tenantData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: updatedTenant } = await api.put(
          `/tenants/${id}`,
          tenantData
        );
        dispatch({ type: ACTIONS.UPDATE_TENANT, payload: updatedTenant });
        return updatedTenant;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to update tenant",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
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
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
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
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
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
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },
  };

  const contextValue = {
    state,
    tenants: state.tenants,
    currentTenant: state.currentTenant,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
};
