// surveySlideContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  SLIDE_ACTIONS,
  slideReducer,
} from "../reducers/surveySlideReducer";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const SurveySlideContext = createContext();

export const SurveySlideProvider = ({ children }) => {
  const [state, dispatch] = useReducer(slideReducer, initialState);

  // Helper function for image upload
  const uploadImage = async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("media", imageFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/media/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.media || !response.data.media[0]) {
        throw new Error("Invalid image upload response");
      }

      return response.data.media[0]._id;
    } catch (error) {
      console.error("Image upload error:", error);
      throw new Error("Failed to upload image");
    }
  };

  const actions = {
    createSlide: async (surveyQuizId, slideData) => {
      dispatch({ type: SLIDE_ACTIONS.CREATE_SLIDE_START });
      try {
        const { data: newSlide } = await api.post(
          `/surveys/${surveyQuizId}/slides`,
          slideData
        );
        dispatch({
          type: SLIDE_ACTIONS.CREATE_SLIDE_SUCCESS,
          payload: newSlide.slide,
        });
        return newSlide;
      } catch (error) {
        dispatch({
          type: SLIDE_ACTIONS.CREATE_SLIDE_FAILURE,
          payload: error.response?.data?.message || "Failed to create slide",
        });
        throw error;
      }
    },

    updateSlide: async (slideId, slideData) => {
      dispatch({ type: SLIDE_ACTIONS.UPDATE_SLIDE_START });
      try {
        const { data: updatedSlide } = await api.put(
          `/surveys/slides/${slideId}`,
          slideData
        );
        dispatch({
          type: SLIDE_ACTIONS.UPDATE_SLIDE_SUCCESS,
          payload: updatedSlide.updatedFields,
        });
        return updatedSlide;
      } catch (error) {
        dispatch({
          type: SLIDE_ACTIONS.UPDATE_SLIDE_FAILURE,
          payload: error.response?.data?.message || "Failed to update slide",
        });
        throw error;
      }
    },

    deleteSlide: async (slideId) => {
      dispatch({ type: SLIDE_ACTIONS.DELETE_SLIDE_START });
      try {
        await api.delete(`/surveys/slides/${slideId}`);
        dispatch({
          type: SLIDE_ACTIONS.DELETE_SLIDE_SUCCESS,
          payload: slideId,
        });
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to delete slide",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SLIDE_ACTIONS.DELETE_SLIDE_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    getAllSlides: async (surveyQuizId) => {
      dispatch({ type: SLIDE_ACTIONS.FETCH_SLIDES_START });
      try {
        const { data } = await api.get(`/surveys/${surveyQuizId}/slides`);
        const slides = data || [];
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDES_SUCCESS,
          payload: slides,
        });
        return slides;
      } catch (error) {
        if (error.response?.status === 404) {
          dispatch({
            type: SLIDE_ACTIONS.FETCH_SLIDES_SUCCESS,
            payload: [],
          });
          return [];
        }
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch slides",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDES_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    getSlideById: async (slideId) => {
      dispatch({ type: SLIDE_ACTIONS.FETCH_SLIDE_START });
      try {
        const { data: slide } = await api.get(`/surveys/slides/${slideId}`);
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDE_SUCCESS,
          payload: slide.slide,
        });
        return slide;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch slide",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDE_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    clearError: () => {
      dispatch({ type: SLIDE_ACTIONS.CLEAR_ERROR });
    },
  };

  const contextValue = {
    state,
    slides: state.slides,
    currentSlide: state.currentSlide,
    loading: state.loading,
    error: state.error,
    uploadImage,
    ...actions,
  };

  return (
    <SurveySlideContext.Provider value={contextValue}>
      {children}
    </SurveySlideContext.Provider>
  );
};

export const useSurveySlideContext = () => {
  const context = useContext(SurveySlideContext);
  if (!context) {
    throw new Error(
      "useSurveySlideContext must be used within a SurveySlideProvider"
    );
  }
  return context;
};