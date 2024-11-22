export const initialState = {
  email: null,
  resetCode: null,
  loading: false,
  error: null,
  stage: "INITIAL",
};

export const ACTIONS = {
  SET_EMAIL: "SET_EMAIL",
  SET_RESET_CODE: "SET_RESET_CODE",
  REQUEST_START: "REQUEST_START",
  CODE_SENT_SUCCESS: "CODE_SENT_SUCCESS",
  CODE_VERIFIED_SUCCESS: "CODE_VERIFIED_SUCCESS",
  RESET_SUCCESS: "RESET_SUCCESS",
  REQUEST_ERROR: "REQUEST_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  RESET: "RESET",
};

export const passwordResetReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_EMAIL:
      return { ...state, email: action.payload };
    case ACTIONS.SET_RESET_CODE:
      return { ...state, resetCode: action.payload };
    case ACTIONS.REQUEST_START:
      return { ...state, loading: true, error: null };
    case ACTIONS.CODE_SENT_SUCCESS:
      return { ...state, loading: false, stage: "CODE_SENT" };
    case ACTIONS.CODE_VERIFIED_SUCCESS:
      return { ...state, loading: false, stage: "CODE_VERIFIED" };
    case ACTIONS.RESET_SUCCESS:
      return { ...state, loading: false, stage: "RESET_COMPLETE" };
    case ACTIONS.REQUEST_ERROR:
      return { ...state, loading: false, error: action.payload };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTIONS.RESET:
      return initialState;
    default:
      return state;
  }
};
