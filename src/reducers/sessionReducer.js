// sessionReducer.js
export const SESSION_ACTIONS = {
  CREATE_SESSION_START: "CREATE_SESSION_START",
  CREATE_SESSION_SUCCESS: "CREATE_SESSION_SUCCESS",
  CREATE_SESSION_FAILURE: "CREATE_SESSION_FAILURE",

  JOIN_SESSION_START: "JOIN_SESSION_START",
  JOIN_SESSION_SUCCESS: "JOIN_SESSION_SUCCESS",
  JOIN_SESSION_FAILURE: "JOIN_SESSION_FAILURE",

  GET_PLAYERS_START: "GET_PLAYERS_START",
  GET_PLAYERS_SUCCESS: "GET_PLAYERS_SUCCESS",
  GET_PLAYERS_FAILURE: "GET_PLAYERS_FAILURE",

  START_SESSION_START: "START_SESSION_START",
  START_SESSION_SUCCESS: "START_SESSION_SUCCESS",
  START_SESSION_FAILURE: "START_SESSION_FAILURE",

  GET_QUESTIONS_START: "GET_QUESTIONS_START",
  GET_QUESTIONS_SUCCESS: "GET_QUESTIONS_SUCCESS",
  GET_QUESTIONS_FAILURE: "GET_QUESTIONS_FAILURE",

  END_SESSION_START: "END_SESSION_START",
  END_SESSION_SUCCESS: "END_SESSION_SUCCESS",
  END_SESSION_FAILURE: "END_SESSION_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  currentSession: null,
  players: [],
  questions: [],
  loading: false,
  error: null,
  playerCount: 0,
};

export const sessionReducer = (state, action) => {
  switch (action.type) {
    // Create Session
    case SESSION_ACTIONS.CREATE_SESSION_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.CREATE_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload,
        error: null,
      };
    case SESSION_ACTIONS.CREATE_SESSION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Join Session
    case SESSION_ACTIONS.JOIN_SESSION_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.JOIN_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        error: null,
      };
    case SESSION_ACTIONS.JOIN_SESSION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Get Players
    case SESSION_ACTIONS.GET_PLAYERS_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.GET_PLAYERS_SUCCESS:
      return {
        ...state,
        loading: false,
        players: action.payload.players,
        playerCount: action.payload.playerCount,
        error: null,
      };
    case SESSION_ACTIONS.GET_PLAYERS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Start Session
    case SESSION_ACTIONS.START_SESSION_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.START_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        questions: action.payload.questions,
        error: null,
      };
    case SESSION_ACTIONS.START_SESSION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Get Questions
    case SESSION_ACTIONS.GET_QUESTIONS_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.GET_QUESTIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        questions: action.payload.questions,
        error: null,
      };
    case SESSION_ACTIONS.GET_QUESTIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // End Session
    case SESSION_ACTIONS.END_SESSION_START:
      return { ...state, loading: true, error: null };
    case SESSION_ACTIONS.END_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentSession: action.payload.session,
        error: null,
      };
    case SESSION_ACTIONS.END_SESSION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case SESSION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
