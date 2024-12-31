// // surveyContext.js
// import React, { createContext, useContext, useReducer } from "react";
// import axios from "axios";
// import {
//   initialState,
//   SURVEY_ACTIONS,
//   surveyReducer,
// } from "../reducers/surveyReducer";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export const SurveyContext = createContext();

// export const SurveyProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(surveyReducer, initialState);

//   // Helper function for image upload
//   const uploadImage = async (imageFile) => {
//     if (!imageFile) return null;

//     const formData = new FormData();
//     formData.append("media", imageFile);

//     try {
//       const response = await axios.post(
//         "http://localhost:5000/api/media/upload",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       if (!response.data || !response.data.media || !response.data.media[0]) {
//         throw new Error("Invalid image upload response");
//       }

//       return response.data.media[0]._id;
//     } catch (error) {
//       console.error("Image upload error:", error);
//       throw new Error("Failed to upload image");
//     }
//   };

//   const actions = {
//     createSurvey: async (surveyData) => {
//       dispatch({ type: SURVEY_ACTIONS.CREATE_SURVEY_START });
//       try {
//         // Process the order array if provided
//         const processedSurveyData = {
//           ...surveyData,
//           order:
//             surveyData.order?.map((item) => ({
//               id: item.id,
//               type: item.type, // 'slide' or 'question'
//             })) || [],
//         };

//         const { data: newSurvey } = await api.post(
//           "/survey-quiz",
//           processedSurveyData
//         );
//         dispatch({
//           type: SURVEY_ACTIONS.CREATE_SURVEY_SUCCESS,
//           payload: newSurvey,
//         });
//         return newSurvey;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to create survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.CREATE_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     updateSurvey: async (id, surveyData) => {
//       dispatch({ type: SURVEY_ACTIONS.UPDATE_SURVEY_START });
//       try {
//         // Process order array if it exists in the update data
//         const processedSurveyData = {
//           ...surveyData,
//           order:
//             surveyData.order?.map((item) => ({
//               id: item.id,
//               type: item.type,
//             })) || surveyData.order,
//         };

//         const { data: updatedSurvey } = await api.put(
//           `/survey-quiz/${id}`,
//           processedSurveyData
//         );
//         dispatch({
//           type: SURVEY_ACTIONS.UPDATE_SURVEY_SUCCESS,
//           payload: updatedSurvey,
//         });
//         return updatedSurvey;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to update survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.UPDATE_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     deleteSurvey: async (id) => {
//       dispatch({ type: SURVEY_ACTIONS.DELETE_SURVEY_START });
//       try {
//         await api.delete(`/survey-quiz/${id}`);
//         dispatch({
//           type: SURVEY_ACTIONS.DELETE_SURVEY_SUCCESS,
//           payload: id,
//         });
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to delete survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.DELETE_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     getAllSurveys: async () => {
//       dispatch({ type: SURVEY_ACTIONS.FETCH_SURVEYS_START });
//       try {
//         const { data } = await api.get("/survey-quiz");
//         const surveys = data || [];
//         dispatch({
//           type: SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS,
//           payload: surveys,
//         });
//         return surveys;
//       } catch (error) {
//         if (error.response?.status === 404) {
//           dispatch({
//             type: SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS,
//             payload: [],
//           });
//           return [];
//         }
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to fetch surveys",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.FETCH_SURVEYS_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     getSurveyById: async (id) => {
//       dispatch({ type: SURVEY_ACTIONS.FETCH_SURVEY_START });
//       try {
//         const { data: survey } = await api.get(`/survey-quiz/${id}`);
//         dispatch({
//           type: SURVEY_ACTIONS.FETCH_SURVEY_SUCCESS,
//           payload: survey,
//         });
//         return survey;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to fetch survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.FETCH_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     publishSurvey: async (id) => {
//       dispatch({ type: SURVEY_ACTIONS.PUBLISH_SURVEY_START });
//       try {
//         const { data: survey } = await api.post(`/survey-quiz/${id}/publish`);
//         dispatch({
//           type: SURVEY_ACTIONS.PUBLISH_SURVEY_SUCCESS,
//           payload: survey,
//         });
//         return survey;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to publish survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.PUBLISH_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     closeSurvey: async (id) => {
//       dispatch({ type: SURVEY_ACTIONS.CLOSE_SURVEY_START });
//       try {
//         const { data: survey } = await api.post(`/survey-quiz/${id}/close`);
//         dispatch({
//           type: SURVEY_ACTIONS.CLOSE_SURVEY_SUCCESS,
//           payload: survey,
//         });
//         return survey;
//       } catch (error) {
//         const errorPayload = {
//           message: error.response?.data?.message || "Failed to close survey",
//           errors: error.response?.data?.errors || [],
//         };
//         dispatch({
//           type: SURVEY_ACTIONS.CLOSE_SURVEY_FAILURE,
//           payload: errorPayload,
//         });
//         throw error;
//       }
//     },

//     clearError: () => {
//       dispatch({ type: SURVEY_ACTIONS.CLEAR_ERROR });
//     },
//   };

//   const contextValue = {
//     state,
//     surveys: state.surveys,
//     currentSurvey: state.currentSurvey,
//     loading: state.loading,
//     error: state.error,
//     uploadImage,
//     ...actions,
//   };

//   return (
//     <SurveyContext.Provider value={contextValue}>
//       {children}
//     </SurveyContext.Provider>
//   );
// };

// export const useSurveyContext = () => {
//   const context = useContext(SurveyContext);
//   if (!context) {
//     throw new Error("useSurveyContext must be used within a SurveyProvider");
//   }
//   return context;
// };
import React, { createContext, useContext, useReducer } from "react";
import axios from "axios";
import {
  initialState,
  SURVEY_ACTIONS,
  surveyReducer,
} from "../reducers/surveyReducer";

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

export const SurveyContext = createContext();

export const SurveyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(surveyReducer, initialState);

  // Helper function for image upload
  const uploadImage = async (imageFile) => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("media", imageFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/media/upload",
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
    createSurvey: async (surveyData) => {
      dispatch({ type: SURVEY_ACTIONS.CREATE_SURVEY_START });
      try {
        // Process the order array if provided
        const processedSurveyData = {
          ...surveyData,
          order:
            surveyData.order?.map((item) => ({
              id: item.id,
              type: item.type, // 'slide' or 'question'
            })) || [],
        };

        const { data: newSurvey } = await api.post(
          "/survey-quiz",
          processedSurveyData
        );
        dispatch({
          type: SURVEY_ACTIONS.CREATE_SURVEY_SUCCESS,
          payload: newSurvey,
        });
        return newSurvey;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to create survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.CREATE_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    updateSurvey: async (id, surveyData) => {
      dispatch({ type: SURVEY_ACTIONS.UPDATE_SURVEY_START });
      try {
        // Process order array if it exists in the update data
        const processedSurveyData = {
          ...surveyData,
          order:
            surveyData.order?.map((item) => ({
              id: item.id,
              type: item.type,
            })) || surveyData.order,
        };

        const { data: updatedSurvey } = await api.put(
          `/survey-quiz/${id}`,
          processedSurveyData
        );
        dispatch({
          type: SURVEY_ACTIONS.UPDATE_SURVEY_SUCCESS,
          payload: updatedSurvey,
        });
        return updatedSurvey;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to update survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.UPDATE_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    deleteSurvey: async (id) => {
      dispatch({ type: SURVEY_ACTIONS.DELETE_SURVEY_START });
      try {
        await api.delete(`/survey-quiz/${id}`);
        dispatch({
          type: SURVEY_ACTIONS.DELETE_SURVEY_SUCCESS,
          payload: id,
        });
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to delete survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.DELETE_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    getAllSurveys: async () => {
      dispatch({ type: SURVEY_ACTIONS.FETCH_SURVEYS_START });
      try {
        const { data } = await api.get("/survey-quiz");
        const surveys = data || [];
        
        // Process the surveys to ensure we have the correct structure
        const processedSurveys = surveys.map(survey => ({
          ...survey,
          // Make sure we're accessing the correct property for slides and questions
          surveySlides: survey.slides || [], // Ensure slides data is available
          questions: survey.questions || []
        }));

        dispatch({
          type: SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS,
          payload: processedSurveys
        });
        return processedSurveys;
      } catch (error) {
        if (error.response?.status === 404) {
          dispatch({
            type: SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS,
            payload: []
          });
          return [];
        }
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch surveys",
          errors: error.response?.data?.errors || []
        };
        dispatch({
          type: SURVEY_ACTIONS.FETCH_SURVEYS_FAILURE,
          payload: errorPayload
        });
        throw error;
      }
    },

    getSurveyById: async (id) => {
      dispatch({ type: SURVEY_ACTIONS.FETCH_SURVEY_START });
      try {
        const { data: survey } = await api.get(`/survey-quiz/${id}`);
        // Process the survey to ensure correct structure
        const processedSurvey = {
          ...survey,
          surveySlides: survey.slides || [],
          questions: survey.questions || []
        };
        dispatch({
          type: SURVEY_ACTIONS.FETCH_SURVEY_SUCCESS,
          payload: processedSurvey,
        });
        return processedSurvey;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to fetch survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.FETCH_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    publishSurvey: async (id) => {
      dispatch({ type: SURVEY_ACTIONS.PUBLISH_SURVEY_START });
      try {
        const { data: survey } = await api.post(`/survey-quiz/${id}/publish`);
        const processedSurvey = {
          ...survey,
          surveySlides: survey.slides || [],
          questions: survey.questions || []
        };
        dispatch({
          type: SURVEY_ACTIONS.PUBLISH_SURVEY_SUCCESS,
          payload: processedSurvey,
        });
        return processedSurvey;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to publish survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.PUBLISH_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    closeSurvey: async (id) => {
      dispatch({ type: SURVEY_ACTIONS.CLOSE_SURVEY_START });
      try {
        const { data: survey } = await api.post(`/survey-quiz/${id}/close`);
        const processedSurvey = {
          ...survey,
          surveySlides: survey.slides || [],
          questions: survey.questions || []
        };
        dispatch({
          type: SURVEY_ACTIONS.CLOSE_SURVEY_SUCCESS,
          payload: processedSurvey,
        });
        return processedSurvey;
      } catch (error) {
        const errorPayload = {
          message: error.response?.data?.message || "Failed to close survey",
          errors: error.response?.data?.errors || [],
        };
        dispatch({
          type: SURVEY_ACTIONS.CLOSE_SURVEY_FAILURE,
          payload: errorPayload,
        });
        throw error;
      }
    },

    clearError: () => {
      dispatch({ type: SURVEY_ACTIONS.CLEAR_ERROR });
    },
  };

  const contextValue = {
    state,
    surveys: state.surveys,
    currentSurvey: state.currentSurvey,
    loading: state.loading,
    error: state.error,
    uploadImage,
    ...actions,
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveyContext = () => {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurveyContext must be used within a SurveyProvider");
  }
  return context;
};

export default SurveyProvider;
