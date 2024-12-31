// mediaContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  mediaReducer,
  MEDIA_ACTIONS,
  initialState,
} from "../reducers/mediaReducer";

const BASE_URL = `${process.env.REACT_APP_API_URL}`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data", // Changed for file uploads
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const MediaContext = createContext();

export const MediaProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mediaReducer, initialState);

  const uploadMedia = async (files) => {
    dispatch({ type: MEDIA_ACTIONS.UPLOAD_MEDIA_START });
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('media', file);
      });

      const response = await api.post('/media/upload', formData);
      dispatch({
        type: MEDIA_ACTIONS.UPLOAD_MEDIA_SUCCESS,
        payload: response.data
      });
      return response.data;
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Failed to upload media";
      dispatch({
        type: MEDIA_ACTIONS.UPLOAD_MEDIA_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  const getAllMedia = async () => {
    dispatch({ type: MEDIA_ACTIONS.GET_MEDIA_START });
    try {
      const response = await api.get('/media');
      dispatch({
        type: MEDIA_ACTIONS.GET_MEDIA_SUCCESS,
        payload: response.data
      });
      return response.data;
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Failed to fetch media";
      dispatch({
        type: MEDIA_ACTIONS.GET_MEDIA_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  const getMediaDetails = async (id) => {
    dispatch({ type: MEDIA_ACTIONS.GET_MEDIA_START });
    try {
      const response = await api.get(`/media/${id}`);
      dispatch({
        type: MEDIA_ACTIONS.GET_MEDIA_SUCCESS,
        payload: response.data
      });
      return response.data;
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Failed to fetch media details";
      dispatch({
        type: MEDIA_ACTIONS.GET_MEDIA_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  const deleteMedia = async (id) => {
    dispatch({ type: MEDIA_ACTIONS.DELETE_MEDIA_START });
    try {
      await api.delete(`/media/${id}`);
      dispatch({
        type: MEDIA_ACTIONS.DELETE_MEDIA_SUCCESS,
        payload: id
      });
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Failed to delete media";
      dispatch({
        type: MEDIA_ACTIONS.DELETE_MEDIA_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  const deleteAllMedia = async () => {
    dispatch({ type: MEDIA_ACTIONS.DELETE_ALL_MEDIA_START });
    try {
      await api.delete('/media/all');
      dispatch({
        type: MEDIA_ACTIONS.DELETE_ALL_MEDIA_SUCCESS
      });
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || "Failed to delete all media";
      dispatch({
        type: MEDIA_ACTIONS.DELETE_ALL_MEDIA_FAILURE,
        payload: errorMessage
      });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: MEDIA_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    uploadMedia,
    getAllMedia,
    getMediaDetails,
    deleteMedia,
    deleteAllMedia,
    clearError,
  };

  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
};

export const useMediaContext = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMediaContext must be used within a MediaProvider");
  }
  return context;
};