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
        const processedSlideData = {
          ...slideData,
          surveyQuiz: surveyQuizId,
          imageUrl: slideData.imageUrl === null ? null : slideData.imageUrl,
        };

        const response = await api.post(
          `/surveys/${surveyQuizId}/slides`,
          processedSlideData
        );

        let newSlide = response.data?.slide || response.data;

        if (
          newSlide.imageUrl &&
          typeof newSlide.imageUrl === "string" &&
          !newSlide.imageUrl.startsWith("http")
        ) {
          const baseUrl = process.env.REACT_APP_API_URL;
          newSlide.imageUrl = `${baseUrl}/uploads/${newSlide.imageUrl}`;
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
        const processedSlideData = {
          ...slideData,
          surveyTitle: slideData.surveyTitle || slideData.title,
          surveyContent: slideData.surveyContent || slideData.content,
          imageUrl: slideData.imageUrl === null ? null : slideData.imageUrl,
        };

        const response = await api.put(
          `/surveys/slides/${slideId}`,
          processedSlideData
        );

        let updatedSlide =
          response.data?.data || response.data?.updatedFields || response.data;

        if (
          updatedSlide.imageUrl &&
          typeof updatedSlide.imageUrl === "string" &&
          !updatedSlide.imageUrl.startsWith("http")
        ) {
          const baseUrl = process.env.REACT_APP_API_URL;
          updatedSlide.imageUrl = `${baseUrl}/uploads/${updatedSlide.imageUrl}`;
        }

        // Ensure the slide has the correct ID
        updatedSlide._id = slideId;

        dispatch({
          type: SLIDE_ACTIONS.UPDATE_SLIDE_SUCCESS,
          payload: updatedSlide,
        });

        return updatedSlide;
      } catch (error) {
        console.error("Error updating slide:", error);
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
        dispatch({
          type: SLIDE_ACTIONS.DELETE_SLIDE_FAILURE,
          payload: error.response?.data?.message || "Failed to delete slide",
        });
        throw error;
      }
    },

    getAllSlides: async (surveyQuizId) => {
      dispatch({ type: SLIDE_ACTIONS.FETCH_SLIDES_START });
      try {
        const response = await api.get(`/surveys/${surveyQuizId}/slides`);
        let slides = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        // Process slides to ensure consistent image URLs
        slides = slides.map((slide) => {
          if (
            slide.imageUrl &&
            typeof slide.imageUrl === "string" &&
            !slide.imageUrl.startsWith("http")
          ) {
            const baseUrl = process.env.REACT_APP_API_URL;
            slide.imageUrl = `${baseUrl}/uploads/${slide.imageUrl}`;
          }
          return slide;
        });

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
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDES_FAILURE,
          payload: error.response?.data?.message || "Failed to fetch slides",
        });
        throw error;
      }
    },

    getSlideById: async (slideId) => {
      dispatch({ type: SLIDE_ACTIONS.FETCH_SLIDE_START });
      try {
        const response = await api.get(`/surveys/slides/${slideId}`);
        let slide = response.data?.slide || response.data;

        if (
          slide.imageUrl &&
          typeof slide.imageUrl === "string" &&
          !slide.imageUrl.startsWith("http")
        ) {
          const baseUrl = process.env.REACT_APP_API_URL;
          slide.imageUrl = `${baseUrl}/uploads/${slide.imageUrl}`;
        }

        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDE_SUCCESS,
          payload: slide,
        });

        return slide;
      } catch (error) {
        dispatch({
          type: SLIDE_ACTIONS.FETCH_SLIDE_FAILURE,
          payload: error.response?.data?.message || "Failed to fetch slide",
        });
        throw error;
      }
    },

    clearError: () => {
      dispatch({ type: SLIDE_ACTIONS.CLEAR_ERROR });
    },
  };

  return (
    <SurveySlideContext.Provider value={{ ...state, ...actions }}>
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
