// authReducer.js
export const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  users: [],
  loading: true, // Start with loading true
  error: null,
};

export const ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  REGISTER: "REGISTER",
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
        error: null,
        loading: false,
      };

    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false, // Ensure loading is false after logout
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
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
