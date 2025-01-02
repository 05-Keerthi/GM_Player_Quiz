// surveyReducer.js
export const initialState = {
  surveys: [],
  currentSurvey: null,
  loading: false,
  error: null,
};

export const SURVEY_ACTIONS = {
  FETCH_SURVEYS_START: "FETCH_SURVEYS_START",
  FETCH_SURVEYS_SUCCESS: "FETCH_SURVEYS_SUCCESS",
  FETCH_SURVEYS_FAILURE: "FETCH_SURVEYS_FAILURE",

  FETCH_SURVEY_START: "FETCH_SURVEY_START",
  FETCH_SURVEY_SUCCESS: "FETCH_SURVEY_SUCCESS",
  FETCH_SURVEY_FAILURE: "FETCH_SURVEY_FAILURE",

  CREATE_SURVEY_START: "CREATE_SURVEY_START",
  CREATE_SURVEY_SUCCESS: "CREATE_SURVEY_SUCCESS",
  CREATE_SURVEY_FAILURE: "CREATE_SURVEY_FAILURE",

  UPDATE_SURVEY_START: "UPDATE_SURVEY_START",
  UPDATE_SURVEY_SUCCESS: "UPDATE_SURVEY_SUCCESS",
  UPDATE_SURVEY_FAILURE: "UPDATE_SURVEY_FAILURE",

  DELETE_SURVEY_START: "DELETE_SURVEY_START",
  DELETE_SURVEY_SUCCESS: "DELETE_SURVEY_SUCCESS",
  DELETE_SURVEY_FAILURE: "DELETE_SURVEY_FAILURE",

  PUBLISH_SURVEY_START: "PUBLISH_SURVEY_START",
  PUBLISH_SURVEY_SUCCESS: "PUBLISH_SURVEY_SUCCESS",
  PUBLISH_SURVEY_FAILURE: "PUBLISH_SURVEY_FAILURE",

  CLOSE_SURVEY_START: "CLOSE_SURVEY_START",
  CLOSE_SURVEY_SUCCESS: "CLOSE_SURVEY_SUCCESS",
  CLOSE_SURVEY_FAILURE: "CLOSE_SURVEY_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

// Helper function to ensure consistent survey data structure
const processSurveyData = (survey) => {
  if (!survey) return null;
  
  return {
    ...survey,
    questions: Array.isArray(survey.questions) ? survey.questions : [],
    slides: Array.isArray(survey.slides) ? survey.slides : [],
    order: Array.isArray(survey.order) ? survey.order.map(item => ({
      id: item.id,
      type: item.type
    })) : []
  };
};

export const surveyReducer = (state, action) => {
  switch (action.type) {
    case SURVEY_ACTIONS.CREATE_SURVEY_START:
    case SURVEY_ACTIONS.UPDATE_SURVEY_START:
    case SURVEY_ACTIONS.DELETE_SURVEY_START:
    case SURVEY_ACTIONS.FETCH_SURVEYS_START:
    case SURVEY_ACTIONS.FETCH_SURVEY_START:
    case SURVEY_ACTIONS.PUBLISH_SURVEY_START:
    case SURVEY_ACTIONS.CLOSE_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: action.payload.map(processSurveyData),
        error: null,
      };

    case SURVEY_ACTIONS.FETCH_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSurvey: processSurveyData(action.payload),
        error: null,
      };

    case SURVEY_ACTIONS.CREATE_SURVEY_SUCCESS:
      const newSurvey = processSurveyData(action.payload);
      return {
        ...state,
        loading: false,
        surveys: [...state.surveys, newSurvey],
        currentSurvey: newSurvey,
        error: null,
      };

    case SURVEY_ACTIONS.UPDATE_SURVEY_SUCCESS:
      const updatedSurvey = processSurveyData(action.payload);
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === updatedSurvey._id ? updatedSurvey : survey
        ),
        currentSurvey: updatedSurvey,
        error: null,
      };

    case SURVEY_ACTIONS.DELETE_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: state.surveys.filter(
          (survey) => survey._id !== action.payload
        ),
        currentSurvey: null,
        error: null,
      };

    case SURVEY_ACTIONS.PUBLISH_SURVEY_SUCCESS:
    case SURVEY_ACTIONS.CLOSE_SURVEY_SUCCESS:
      const processedSurvey = processSurveyData(action.payload);
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === processedSurvey._id ? processedSurvey : survey
        ),
        currentSurvey: processedSurvey,
        error: null,
      };

    case SURVEY_ACTIONS.CREATE_SURVEY_FAILURE:
    case SURVEY_ACTIONS.UPDATE_SURVEY_FAILURE:
    case SURVEY_ACTIONS.DELETE_SURVEY_FAILURE:
    case SURVEY_ACTIONS.FETCH_SURVEYS_FAILURE:
    case SURVEY_ACTIONS.FETCH_SURVEY_FAILURE:
    case SURVEY_ACTIONS.PUBLISH_SURVEY_FAILURE:
    case SURVEY_ACTIONS.CLOSE_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SURVEY_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};