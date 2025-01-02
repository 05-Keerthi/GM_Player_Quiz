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

// Helper function to ensure consistent question data
const processQuestionData = (question) => {
  if (!question) return null;

  return {
    ...question,
    title: question.title || "",
    description: question.description || "",
    imageUrl: question.imageUrl || null,
    answerOptions: Array.isArray(question.answerOptions)
      ? question.answerOptions.map((option) => ({
          optionText: option.optionText || "",
          isCorrect: !!option.isCorrect,
        }))
      : [],
  };
};

export const questionReducer = (state, action) => {
  switch (action.type) {
    case QUESTION_ACTIONS.CREATE_QUESTION_START:
    case QUESTION_ACTIONS.UPDATE_QUESTION_START:
    case QUESTION_ACTIONS.DELETE_QUESTION_START:
    case QUESTION_ACTIONS.FETCH_QUESTIONS_START:
    case QUESTION_ACTIONS.FETCH_QUESTION_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case QUESTION_ACTIONS.CREATE_QUESTION_SUCCESS:
      const newQuestion = processQuestionData(action.payload);
      return {
        ...state,
        questions: [...state.questions, newQuestion],
        currentQuestion: newQuestion,
        loading: false,
        error: null,
      };

    case QUESTION_ACTIONS.UPDATE_QUESTION_SUCCESS:
      const updatedQuestion = processQuestionData(action.payload);
      return {
        ...state,
        questions: state.questions.map((question) =>
          question._id === updatedQuestion._id ? updatedQuestion : question
        ),
        currentQuestion: updatedQuestion,
        loading: false,
        error: null,
      };

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

    case QUESTION_ACTIONS.FETCH_QUESTIONS_SUCCESS:
      return {
        ...state,
        questions: Array.isArray(action.payload)
          ? action.payload.map(processQuestionData)
          : [],
        loading: false,
        error: null,
      };

    case QUESTION_ACTIONS.FETCH_QUESTION_SUCCESS:
      return {
        ...state,
        currentQuestion: processQuestionData(action.payload),
        loading: false,
        error: null,
      };

    case QUESTION_ACTIONS.CREATE_QUESTION_FAILURE:
    case QUESTION_ACTIONS.UPDATE_QUESTION_FAILURE:
    case QUESTION_ACTIONS.DELETE_QUESTION_FAILURE:
    case QUESTION_ACTIONS.FETCH_QUESTIONS_FAILURE:
    case QUESTION_ACTIONS.FETCH_QUESTION_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case QUESTION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
