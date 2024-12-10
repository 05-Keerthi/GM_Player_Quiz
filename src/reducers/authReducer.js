export const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  sessionExpired: false,
  users: [],
  loading: false,
  error: null,
};

export const ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
  GET_USER_PROFILE: "GET_USER_PROFILE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  RESET_SESSION_STATE: "RESET_SESSION_STATE",
  LIST_USERS: "LIST_USERS",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOGIN:
    case ACTIONS.REGISTER:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        sessionExpired: false,
        error: null,
        loading: false,
      };

    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        sessionExpired: state.sessionExpired,
      };

    case ACTIONS.GET_USER_PROFILE:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.SESSION_EXPIRED:
      return {
        ...initialState,
        sessionExpired: true,
      };

    case ACTIONS.RESET_SESSION_STATE:
      return {
        ...state,
        sessionExpired: false,
      };

    case ACTIONS.LIST_USERS:
      return {
        ...state,
        users: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
