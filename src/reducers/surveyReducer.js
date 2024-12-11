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

export const surveyReducer = (state, action) => {
  switch (action.type) {
    // Fetch Surveys
    case SURVEY_ACTIONS.FETCH_SURVEYS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.FETCH_SURVEYS_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.FETCH_SURVEYS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch Single Survey
    case SURVEY_ACTIONS.FETCH_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.FETCH_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSurvey: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.FETCH_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Create Survey
    case SURVEY_ACTIONS.CREATE_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.CREATE_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: [...state.surveys, action.payload],
        currentSurvey: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.CREATE_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Update Survey
    case SURVEY_ACTIONS.UPDATE_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.UPDATE_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === action.payload._id ? action.payload : survey
        ),
        currentSurvey: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.UPDATE_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Delete Survey
    case SURVEY_ACTIONS.DELETE_SURVEY_START:
      return {
        ...state,
        loading: true,
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
    case SURVEY_ACTIONS.DELETE_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Publish Survey
    case SURVEY_ACTIONS.PUBLISH_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.PUBLISH_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === action.payload._id ? action.payload : survey
        ),
        currentSurvey: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.PUBLISH_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Close Survey
    case SURVEY_ACTIONS.CLOSE_SURVEY_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SURVEY_ACTIONS.CLOSE_SURVEY_SUCCESS:
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === action.payload._id ? action.payload : survey
        ),
        currentSurvey: action.payload,
        error: null,
      };
    case SURVEY_ACTIONS.CLOSE_SURVEY_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Clear Error
    case SURVEY_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
