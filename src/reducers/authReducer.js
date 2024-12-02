export const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  sessionExpired: false,
};

export const ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  GET_USER_PROFILE: "GET_USER_PROFILE",
  REGISTER: "REGISTER",
  SESSION_EXPIRED: "SESSION_EXPIRED", // New action
  RESET_SESSION_STATE: "RESET_SESSION_STATE", // To reset session expired state
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
        sessionExpired: false, // Reset session expired state on login/register
      };
    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        sessionExpired: state.sessionExpired, // Preserve session expired state during logout
      };
    case ACTIONS.GET_USER_PROFILE:
      return {
        ...state,
        user: action.payload,
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
    default:
      return state;
  }
};
