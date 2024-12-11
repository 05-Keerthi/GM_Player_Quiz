// questionReducer.js
export const QUESTION_ACTIONS = {
  CREATE_QUESTION_START: "CREATE_QUESTION_START",
  CREATE_QUESTION_SUCCESS: "CREATE_QUESTION_SUCCESS",
  CREATE_QUESTION_FAILURE: "CREATE_QUESTION_FAILURE",

  UPDATE_QUESTION_START: "UPDATE_QUESTION_START",
  UPDATE_QUESTION_SUCCESS: "UPDATE_QUESTION_SUCCESS",
  UPDATE_QUESTION_FAILURE: "UPDATE_QUESTION_FAILURE",

  DELETE_QUESTION_START: "DELETE_QUESTION_START",
  DELETE_QUESTION_SUCCESS: "DELETE_QUESTION_SUCCESS",
  DELETE_QUESTION_FAILURE: "DELETE_QUESTION_FAILURE",

  FETCH_QUESTIONS_START: "FETCH_QUESTIONS_START",
  FETCH_QUESTIONS_SUCCESS: "FETCH_QUESTIONS_SUCCESS",
  FETCH_QUESTIONS_FAILURE: "FETCH_QUESTIONS_FAILURE",

  FETCH_QUESTION_START: "FETCH_QUESTION_START",
  FETCH_QUESTION_SUCCESS: "FETCH_QUESTION_SUCCESS",
  FETCH_QUESTION_FAILURE: "FETCH_QUESTION_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
};

export const questionReducer = (state, action) => {
  switch (action.type) {
    // Create question cases
    case QUESTION_ACTIONS.CREATE_QUESTION_START:
      return { ...state, loading: true, error: null };
    case QUESTION_ACTIONS.CREATE_QUESTION_SUCCESS:
      return {
        ...state,
        questions: [...state.questions, action.payload],
        loading: false,
        error: null,
      };
    case QUESTION_ACTIONS.CREATE_QUESTION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Update question cases
    case QUESTION_ACTIONS.UPDATE_QUESTION_START:
      return { ...state, loading: true, error: null };
    case QUESTION_ACTIONS.UPDATE_QUESTION_SUCCESS:
      return {
        ...state,
        questions: state.questions.map((question) =>
          question._id === action.payload._id ? action.payload : question
        ),
        currentQuestion:
          state.currentQuestion?._id === action.payload._id
            ? action.payload
            : state.currentQuestion,
        loading: false,
        error: null,
      };
    case QUESTION_ACTIONS.UPDATE_QUESTION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Delete question cases
    case QUESTION_ACTIONS.DELETE_QUESTION_START:
      return { ...state, loading: true, error: null };
    case QUESTION_ACTIONS.DELETE_QUESTION_SUCCESS:
      return {
        ...state,
        questions: state.questions.filter(
          (question) => question._id !== action.payload
        ),
        currentQuestion:
          state.currentQuestion?._id === action.payload
            ? null
            : state.currentQuestion,
        loading: false,
        error: null,
      };
    case QUESTION_ACTIONS.DELETE_QUESTION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Fetch questions cases
    case QUESTION_ACTIONS.FETCH_QUESTIONS_START:
      return { ...state, loading: true, error: null };
    case QUESTION_ACTIONS.FETCH_QUESTIONS_SUCCESS:
      return {
        ...state,
        questions: action.payload,
        loading: false,
        error: null,
      };
    case QUESTION_ACTIONS.FETCH_QUESTIONS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Fetch single question cases
    case QUESTION_ACTIONS.FETCH_QUESTION_START:
      return { ...state, loading: true, error: null };
    case QUESTION_ACTIONS.FETCH_QUESTION_SUCCESS:
      return {
        ...state,
        currentQuestion: action.payload,
        loading: false,
        error: null,
      };
    case QUESTION_ACTIONS.FETCH_QUESTION_FAILURE:
      return { ...state, loading: false, error: action.payload };

    // Clear error case
    case QUESTION_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
