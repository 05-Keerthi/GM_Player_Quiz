// Action Types
export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_REPORTS: "SET_REPORTS",
  SET_CURRENT_REPORT: "SET_CURRENT_REPORT",
  CLEAR_REPORTS: "CLEAR_REPORTS",
  CLEAR_CURRENT_REPORT: "CLEAR_CURRENT_REPORT",
};

// Initial State
export const initialState = {
  reports: [],
  currentReport: null,
  loading: false,
  error: null,
};

// Reducer
export const reportReducer = (state = initialState, action) => {
  switch (action.type) {
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

    case ACTIONS.SET_REPORTS:
      return {
        ...state,
        reports: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_CURRENT_REPORT:
      return {
        ...state,
        currentReport: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.CLEAR_REPORTS:
      return {
        ...state,
        reports: [],
      };

    case ACTIONS.CLEAR_CURRENT_REPORT:
      return {
        ...state,
        currentReport: null,
      };

    default:
      return state;
  }
};

export default reportReducer;
