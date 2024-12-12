// Action Types
export const SURVEY_ANSWER_ACTIONS = {
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

// Initial state
export const initialState = {
  loading: false,
  error: null,
  sessionAnswers: null,
  questionAnswers: null,
  lastSubmittedAnswer: null,
};

// Reducer function
export const surveyAnswerReducer = (state, action) => {
  switch (action.type) {
    case SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        lastSubmittedAnswer: action.payload,
      };

    case SURVEY_ANSWER_ACTIONS.SUBMIT_ANSWER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_START:
      return {
        ...state,
        loading: true,
        error: null,
        sessionAnswers: null,
      };

    case SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        sessionAnswers: action.payload,
      };

    case SURVEY_ANSWER_ACTIONS.GET_SESSION_ANSWERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        sessionAnswers: null,
      };

    case SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_START:
      return {
        ...state,
        loading: true,
        error: null,
        questionAnswers: null,
      };

    case SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
        questionAnswers: action.payload,
      };

    case SURVEY_ANSWER_ACTIONS.GET_QUESTION_ANSWERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        questionAnswers: null,
      };

    case SURVEY_ANSWER_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
