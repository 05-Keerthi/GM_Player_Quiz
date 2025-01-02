// surveySlideContext.js
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  SLIDE_ACTIONS,
  slideReducer,
} from "../reducers/surveySlideReducer";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}/api`,
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

  const uploadImage = async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("media", imageFile);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/media/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data?.media?.[0]) {
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
        // Ensure proper slide data structure
        const processedSlideData = {
          ...slideData,
          surveyQuiz: surveyQuizId,
        };

        const response = await api.post(
          `/surveys/${surveyQuizId}/slides`,
          processedSlideData
        );

        // Check for both possible response structures
        const newSlide = response.data?.slide || response.data;

        if (!newSlide || !newSlide._id) {
          throw new Error("Invalid slide data received from server");
        }

        dispatch({
          type: SLIDE_ACTIONS.CREATE_SLIDE_SUCCESS,
          payload: newSlide,
        });

        return newSlide;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to create slide";
        dispatch({
          type: SLIDE_ACTIONS.CREATE_SLIDE_FAILURE,
          payload: errorMessage,
        });
        throw error;
      }
    },

    updateSlide: async (slideId, slideData) => {
      dispatch({ type: SLIDE_ACTIONS.UPDATE_SLIDE_START });
      try {
        // Process slide data before sending
        const processedSlideData = {
          ...slideData,
          // Ensure consistent data structure
          surveyTitle: slideData.surveyTitle || slideData.title,
          surveyContent: slideData.surveyContent || slideData.content,
        };

        const response = await api.put(
          `/surveys/slides/${slideId}`,
          processedSlideData
        );

        // Handle different response structures
        const updatedSlide = response.data?.updatedFields || response.data;

        if (!updatedSlide) {
          throw new Error("Invalid slide data received from server");
        }

        dispatch({
          type: SLIDE_ACTIONS.UPDATE_SLIDE_SUCCESS,
          payload: updatedSlide,
        });

        return updatedSlide;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to update slide";
        dispatch({
          type: SLIDE_ACTIONS.UPDATE_SLIDE_FAILURE,
          payload: errorMessage,
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
        const response = await api.get(`/surveys/${surveyQuizId}/slides`);

        // Handle potential response structures
        let slides;
        if (Array.isArray(response.data)) {
          slides = response.data;
        } else if (Array.isArray(response.data?.data)) {
          slides = response.data.data;
        } else {
          slides = [];
        }

        // Process slides to ensure consistent structure
        const processedSlides = slides.map((slide) => ({
          ...slide,
          surveyTitle: slide.surveyTitle || slide.title,
          surveyContent: slide.surveyContent || slide.content,
          surveyQuiz: slide.surveyQuiz || surveyQuizId,
        }));

        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDES_SUCCESS,
          payload: processedSlides,
        });

        return processedSlides;
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
        const response = await api.get(`/surveys/slides/${slideId}`);

        // Handle different response structures
        const slide = response.data?.slide || response.data;

        if (!slide) {
          throw new Error("Slide not found");
        }

        // Process slide to ensure consistent structure
        const processedSlide = {
          ...slide,
          surveyTitle: slide.surveyTitle || slide.title,
          surveyContent: slide.surveyContent || slide.content,
        };

        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDE_SUCCESS,
          payload: processedSlide,
        });

        return processedSlide;
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
