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
        surveys: action.payload.map((survey) => ({
          ...survey,
          order: survey.order || [],
        })),
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
        currentSurvey: {
          ...action.payload,
          order: action.payload.order || [],
        },
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
        surveys: [
          ...state.surveys,
          {
            ...action.payload,
            order: action.payload.order || [],
          },
        ],
        currentSurvey: {
          ...action.payload,
          order: action.payload.order || [],
        },
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
    case SURVEY_ACTIONS.UPDATE_SURVEY_SUCCESS: {
      const updatedSurvey = {
        ...action.payload,
        order: action.payload.order || [],
      };
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === updatedSurvey._id ? updatedSurvey : survey
        ),
        currentSurvey: updatedSurvey,
        error: null,
      };
    }
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
    case SURVEY_ACTIONS.PUBLISH_SURVEY_SUCCESS: {
      const publishedSurvey = {
        ...action.payload,
        order: action.payload.order || [],
      };
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === publishedSurvey._id ? publishedSurvey : survey
        ),
        currentSurvey: publishedSurvey,
        error: null,
      };
    }
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
    case SURVEY_ACTIONS.CLOSE_SURVEY_SUCCESS: {
      const closedSurvey = {
        ...action.payload,
        order: action.payload.order || [],
      };
      return {
        ...state,
        loading: false,
        surveys: state.surveys.map((survey) =>
          survey._id === closedSurvey._id ? closedSurvey : survey
        ),
        currentSurvey: closedSurvey,
        error: null,
      };
    }
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
