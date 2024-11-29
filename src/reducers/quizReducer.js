// quizReducer.js
export const initialState = {
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,
};

export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_QUIZZES: "SET_QUIZZES",
  SET_CURRENT_QUIZ: "SET_CURRENT_QUIZ",
  ADD_QUIZ: "ADD_QUIZ",
  UPDATE_QUIZ: "UPDATE_QUIZ",
  DELETE_QUIZ: "DELETE_QUIZ",
};

export const quizReducer = (state, action) => {
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
      };

    case ACTIONS.SET_QUIZZES:
      return {
        ...state,
        quizzes: action.payload,
        error: null,
      };

    case ACTIONS.SET_CURRENT_QUIZ:
      return {
        ...state,
        currentQuiz: action.payload,
        error: null,
      };

    case ACTIONS.ADD_QUIZ:
      return {
        ...state,
        quizzes: [...state.quizzes, action.payload],
        error: null,
      };

    case ACTIONS.UPDATE_QUIZ:
      return {
        ...state,
        quizzes: state.quizzes.map((quiz) =>
          quiz._id === action.payload._id ? action.payload : quiz
        ),
        currentQuiz:
          state.currentQuiz?._id === action.payload._id
            ? action.payload
            : state.currentQuiz,
        error: null,
      };

    case ACTIONS.DELETE_QUIZ:
      return {
        ...state,
        quizzes: state.quizzes.filter((quiz) => quiz._id !== action.payload),
        currentQuiz:
          state.currentQuiz?._id === action.payload ? null : state.currentQuiz,
        error: null,
      };

    default:
      return state;
  }
};
