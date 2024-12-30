// categoryContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import { initialState, ACTIONS, categoryReducer } from "../reducers/categoryReducer";

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

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  const actions = {
    createCategory: async (categoryData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: newCategory } = await api.post(
          "/categories",
          categoryData
        );
        dispatch({ type: ACTIONS.ADD_CATEGORY, payload: newCategory });
        return newCategory;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create category",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    updateCategory: async (id, categoryData) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: updatedCategory } = await api.put(
          `/categories/${id}`,
          categoryData
        );
        dispatch({ type: ACTIONS.UPDATE_CATEGORY, payload: updatedCategory });
        return updatedCategory;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to update category",
          errors: error.response?.data?.errors || [],
        };
        dispatch({ type: ACTIONS.SET_ERROR, payload: errorPayload });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    deleteCategory: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        await api.delete(`/categories/${id}`);
        dispatch({ type: ACTIONS.DELETE_CATEGORY, payload: id });
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to delete category",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getAllCategories: async () => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: categories } = await api.get("/categories");
        dispatch({ type: ACTIONS.SET_CATEGORIES, payload: categories });
        return categories;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to fetch categories",
          },
        });
        throw error;
      } finally {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    },

    getCategoryById: async (id) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      try {
        const { data: category } = await api.get(`/categories/${id}`);
        dispatch({ type: ACTIONS.SET_CURRENT_CATEGORY, payload: category });
        return category;
      } catch (error) {
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message:
              error.response?.data?.message || "Failed to fetch category",
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
    categories: state.categories,
    currentCategory: state.currentCategory,
    loading: state.loading,
    error: state.error,
    ...actions,
  };

  return (
    <CategoryContext.Provider value={contextValue}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error(
      "useCategoryContext must be used within a CategoryProvider"
    );
  }
  return context;
};
