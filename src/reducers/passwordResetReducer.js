// passwordResetReducer.js
export const initialState = {
  email: "",
  resetCode: "",
  isLoading: false,
  error: null,
  success: false,
  stage: "email", // Stages: 'email', 'code', 'newPassword'
};

export const ACTIONS = {
  SET_EMAIL: "SET_EMAIL",
  SET_RESET_CODE: "SET_RESET_CODE",
  REQUEST_RESET: "REQUEST_RESET",
  RESET_SUCCESS: "RESET_SUCCESS",
  RESET_ERROR: "RESET_ERROR",
  CHANGE_STAGE: "CHANGE_STAGE",
  RESET: "RESET",
};

export function passwordResetReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload, error: null };

    case ACTIONS.SET_RESET_CODE:
      return { ...state, resetCode: action.payload, error: null };

    case ACTIONS.REQUEST_RESET:
      return { ...state, isLoading: true, error: null };

    case ACTIONS.RESET_SUCCESS:
      return {
        ...state,
        isLoading: false,
        success: true,
        error: null,
      };

    case ACTIONS.RESET_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case ACTIONS.CHANGE_STAGE:
      return { ...state, stage: action.payload };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}
