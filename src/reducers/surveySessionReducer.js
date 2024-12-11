// surveySessionReducer.js
export const SURVEY_SESSION_ACTIONS = {
  CREATE_SURVEY_SESSION_START: "CREATE_SURVEY_SESSION_START",
  CREATE_SURVEY_SESSION_SUCCESS: "CREATE_SURVEY_SESSION_SUCCESS",
  CREATE_SURVEY_SESSION_FAILURE: "CREATE_SURVEY_SESSION_FAILURE",
  
  JOIN_SURVEY_SESSION_START: "JOIN_SURVEY_SESSION_START",
  JOIN_SURVEY_SESSION_SUCCESS: "JOIN_SURVEY_SESSION_SUCCESS",
  JOIN_SURVEY_SESSION_FAILURE: "JOIN_SURVEY_SESSION_FAILURE",
  
  START_SURVEY_SESSION_START: "START_SURVEY_SESSION_START",
  START_SURVEY_SESSION_SUCCESS: "START_SURVEY_SESSION_SUCCESS",
  START_SURVEY_SESSION_FAILURE: "START_SURVEY_SESSION_FAILURE",
  
  NEXT_SURVEY_QUESTION_START: "NEXT_SURVEY_QUESTION_START",
  NEXT_SURVEY_QUESTION_SUCCESS: "NEXT_SURVEY_QUESTION_SUCCESS",
  NEXT_SURVEY_QUESTION_FAILURE: "NEXT_SURVEY_QUESTION_FAILURE",
  
  END_SURVEY_SESSION_START: "END_SURVEY_SESSION_START",
  END_SURVEY_SESSION_SUCCESS: "END_SURVEY_SESSION_SUCCESS",
  END_SURVEY_SESSION_FAILURE: "END_SURVEY_SESSION_FAILURE",
  
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  session: null,
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
  status: "idle", // idle, loading, success, error
};

export const surveySessionReducer = (state, action) => {
  switch (action.type) {
    // Create Session
    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_START:
      return {
        ...state,
        loading: true,
        error: null,
        status: "loading",
      };
    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        session: action.payload,
        loading: false,
        error: null,
        status: "success",
      };
    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        status: "error",
      };

    // Join Session
    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_START:
      return {
        ...state,
        loading: true,
        error: null,
        status: "loading",
      };
    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        session: action.payload.session,
        loading: false,
        error: null,
        status: "success",
      };
    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        status: "error",
      };

    // Start Session
    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_START:
      return {
        ...state,
        loading: true,
        error: null,
        status: "loading",
      };
    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        session: action.payload.session,
        questions: action.payload.questions,
        loading: false,
        error: null,
        status: "success",
      };
    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        status: "error",
      };

    // Next Question
    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_START:
      return {
        ...state,
        loading: true,
        error: null,
        status: "loading",
      };
    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_SUCCESS:
      return {
        ...state,
        currentQuestion: action.payload.question,
        loading: false,
        error: null,
        status: "success",
      };
    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        status: "error",
      };

    // End Session
    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_START:
      return {
        ...state,
        loading: true,
        error: null,
        status: "loading",
      };
    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        session: action.payload.session,
        loading: false,
        error: null,
        status: "success",
      };
    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        status: "error",
      };

    case SURVEY_SESSION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};