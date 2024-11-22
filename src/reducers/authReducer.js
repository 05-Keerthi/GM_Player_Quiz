export const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
};

export const ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  GET_USER_PROFILE: "GET_USER_PROFILE",
  REGISTER: "REGISTER", // New action
};

export const authReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOGIN:
    case ACTIONS.REGISTER: // Both actions do the same thing
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case ACTIONS.LOGOUT:
      return initialState;
    case ACTIONS.GET_USER_PROFILE:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};
