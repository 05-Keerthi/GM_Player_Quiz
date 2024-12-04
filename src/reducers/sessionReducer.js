// sessionReducer.js
export const SESSION_ACTIONS = {
  CREATE_SESSION_START: "CREATE_SESSION_START",
  CREATE_SESSION_SUCCESS: "CREATE_SESSION_SUCCESS",
  CREATE_SESSION_FAILURE: "CREATE_SESSION_FAILURE",

  JOIN_SESSION_START: "JOIN_SESSION_START",
  JOIN_SESSION_SUCCESS: "JOIN_SESSION_SUCCESS",
  JOIN_SESSION_FAILURE: "JOIN_SESSION_FAILURE",

  START_SESSION_START: "START_SESSION_START",
  START_SESSION_SUCCESS: "START_SESSION_SUCCESS",
  START_SESSION_FAILURE: "START_SESSION_FAILURE",

  NEXT_QUESTION_START: "NEXT_QUESTION_START",
  NEXT_QUESTION_SUCCESS: "NEXT_QUESTION_SUCCESS",
  NEXT_QUESTION_FAILURE: "NEXT_QUESTION_FAILURE",

  END_SESSION_START: "END_SESSION_START",
  END_SESSION_SUCCESS: "END_SESSION_SUCCESS",
  END_SESSION_FAILURE: "END_SESSION_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  currentSession: null,
  currentItem: null,
  currentItemType: null,
  questions: [],
  slides: [],
  loading: false,
  error: null,
};

export const sessionReducer = (state, action) => {
  switch (action.type) {
    case SESSION_ACTIONS.CREATE_SESSION_START:
    case SESSION_ACTIONS.JOIN_SESSION_START:
    case SESSION_ACTIONS.START_SESSION_START:
    case SESSION_ACTIONS.NEXT_QUESTION_START:
    case SESSION_ACTIONS.END_SESSION_START:
      return { ...state, loading: true, error: null };

    case SESSION_ACTIONS.CREATE_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload,
        error: null,
      };

    case SESSION_ACTIONS.JOIN_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        error: null,
      };

    case SESSION_ACTIONS.START_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        questions: action.payload.questions,
        slides: action.payload.slides,
        error: null,
      };

    case SESSION_ACTIONS.NEXT_QUESTION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentItem: action.payload.item,
        currentItemType: action.payload.type,
        error: null,
      };

    case SESSION_ACTIONS.END_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        error: null,
      };

    case SESSION_ACTIONS.CREATE_SESSION_FAILURE:
    case SESSION_ACTIONS.JOIN_SESSION_FAILURE:
    case SESSION_ACTIONS.START_SESSION_FAILURE:
    case SESSION_ACTIONS.NEXT_QUESTION_FAILURE:
    case SESSION_ACTIONS.END_SESSION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case SESSION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
