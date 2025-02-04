import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  ACTIONS,
  templateReducer,
} from "../reducers/TemplateReducer";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
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

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(templateReducer, initialState);

  const actions = {
    createTemplate: async (templateData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.post("/create-template", templateData);
        dispatch({ type: ACTIONS.ADD_TEMPLATE, payload: data.data });
        return data.data;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create template",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getAllTemplates: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get("/templates");
        dispatch({ type: ACTIONS.SET_TEMPLATES, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to fetch templates",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getTemplateById: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.get(`/template/${id}`);
        dispatch({ type: ACTIONS.SET_CURRENT_TEMPLATE, payload: data.data });
        return data.data;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to fetch template",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    updateTemplate: async (id, templateData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data } = await api.put(`/template/${id}`, templateData);
        dispatch({ type: ACTIONS.UPDATE_TEMPLATE, payload: data.data });
        return data.data;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to update template",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    deleteTemplate: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/template/${id}`);
        dispatch({ type: ACTIONS.DELETE_TEMPLATE, payload: id });
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to delete template",
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
    templates: state.templates,
    currentTemplate: state.currentTemplate,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <TemplateContext.Provider value={contextValue}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplateContext = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error(
      "useTemplateContext must be used within a TemplateProvider"
    );
  }
  return context;
};
