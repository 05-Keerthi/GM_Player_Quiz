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
  SET_GUEST_USER: "SET_GUEST_USER",
  CLEAR_GUEST_USER: "CLEAR_GUEST_USER",
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  session: null,
  loading: false,
  error: null,
  guestUser: null,
  currentQuestion: null,
  questions: [],
  isSessionStarted: false,
  isSessionEnded: false,
};

export const surveySessionReducer = (state, action) => {
  switch (action.type) {
    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_START:
    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_START:
    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_START:
    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_START:
    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        session: action.payload,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        session: action.payload.session,
        guestUser: action.payload.user?.isGuest ? action.payload.user : null,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        isSessionStarted: true,
        questions: action.payload.questions,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentQuestion: action.payload.question,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        isSessionEnded: true,
        error: null,
      };

    case SURVEY_SESSION_ACTIONS.CREATE_SURVEY_SESSION_FAILURE:
    case SURVEY_SESSION_ACTIONS.JOIN_SURVEY_SESSION_FAILURE:
    case SURVEY_SESSION_ACTIONS.START_SURVEY_SESSION_FAILURE:
    case SURVEY_SESSION_ACTIONS.NEXT_SURVEY_QUESTION_FAILURE:
    case SURVEY_SESSION_ACTIONS.END_SURVEY_SESSION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SURVEY_SESSION_ACTIONS.SET_GUEST_USER:
      return {
        ...state,
        guestUser: action.payload,
      };

    case SURVEY_SESSION_ACTIONS.CLEAR_GUEST_USER:
      return {
        ...state,
        guestUser: null,
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
