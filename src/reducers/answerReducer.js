// answerReducer.js
export const ANSWER_ACTIONS = {
  SUBMIT_ANSWER_START: "SUBMIT_ANSWER_START",
  SUBMIT_ANSWER_SUCCESS: "SUBMIT_ANSWER_SUCCESS",
  SUBMIT_ANSWER_FAILURE: "SUBMIT_ANSWER_FAILURE",
  GET_SESSION_ANSWERS_START: "GET_SESSION_ANSWERS_START",
  GET_SESSION_ANSWERS_SUCCESS: "GET_SESSION_ANSWERS_SUCCESS",
  GET_SESSION_ANSWERS_FAILURE: "GET_SESSION_ANSWERS_FAILURE",
  GET_QUESTION_ANSWERS_START: "GET_QUESTION_ANSWERS_START",
  GET_QUESTION_ANSWERS_SUCCESS: "GET_QUESTION_ANSWERS_SUCCESS",
  GET_QUESTION_ANSWERS_FAILURE: "GET_QUESTION_ANSWERS_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  loading: false,
  error: null,
  sessionAnswers: [],
  questionAnswers: [],
  currentAnswer: null,
};

export const answerReducer = (state, action) => {
  switch (action.type) {
    case ANSWER_ACTIONS.SUBMIT_ANSWER_START:
    case ANSWER_ACTIONS.GET_SESSION_ANSWERS_START:
    case ANSWER_ACTIONS.GET_QUESTION_ANSWERS_START:
      return { ...state, loading: true, error: null };

    case ANSWER_ACTIONS.SUBMIT_ANSWER_SUCCESS:
      return {
        ...state,
        loading: false,
        currentAnswer: action.payload,
        error: null,
      };

    case ANSWER_ACTIONS.GET_SESSION_ANSWERS_SUCCESS:
      return {
        ...state,
        loading: false,
        sessionAnswers: action.payload,
        error: null,
      };

    case ANSWER_ACTIONS.GET_QUESTION_ANSWERS_SUCCESS:
      return {
        ...state,
        loading: false,
        questionAnswers: action.payload,
        error: null,
      };

    case ANSWER_ACTIONS.SUBMIT_ANSWER_FAILURE:
    case ANSWER_ACTIONS.GET_SESSION_ANSWERS_FAILURE:
    case ANSWER_ACTIONS.GET_QUESTION_ANSWERS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case ANSWER_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
