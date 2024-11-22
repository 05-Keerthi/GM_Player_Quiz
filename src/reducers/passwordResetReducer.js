// passwordResetReducer.js
export const initialState = {
  email: "",
  resetCode: "",
  isLoading: false,
  error: null,
  success: false,
  isCodeSent: false,
  isCodeVerified: false,
  currentStep: "email", // email -> code -> password
};

export const ACTIONS = {
  SET_EMAIL: "SET_EMAIL",
  SET_RESET_CODE: "SET_RESET_CODE",
  REQUEST_START: "REQUEST_START",
  REQUEST_ERROR: "REQUEST_ERROR",
  CODE_SENT_SUCCESS: "CODE_SENT_SUCCESS",
  CODE_VERIFIED_SUCCESS: "CODE_VERIFIED_SUCCESS",
  RESET_SUCCESS: "RESET_SUCCESS",
  CLEAR_ERROR: "CLEAR_ERROR",
  RESET: "RESET",
};

export function passwordResetReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_EMAIL:
      return {
        ...state,
        email: action.payload,
        error: null,
      };

    case ACTIONS.SET_RESET_CODE:
      return {
        ...state,
        resetCode: action.payload,
        error: null,
      };

    case ACTIONS.REQUEST_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ACTIONS.REQUEST_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case ACTIONS.CODE_SENT_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
        isCodeSent: true,
        currentStep: "code",
      };

    case ACTIONS.CODE_VERIFIED_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
        isCodeVerified: true,
        currentStep: "password",
      };

    case ACTIONS.RESET_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
        success: true,
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
}