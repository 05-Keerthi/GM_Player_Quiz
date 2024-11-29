// categoryReducer.js

export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_CATEGORIES: "SET_CATEGORIES",
  ADD_CATEGORY: "ADD_CATEGORY",
  UPDATE_CATEGORY: "UPDATE_CATEGORY",
  DELETE_CATEGORY: "DELETE_CATEGORY",
  SET_CURRENT_CATEGORY: "SET_CURRENT_CATEGORY",
};

export const initialState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

export const categoryReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
        loading: false,
        error: null,
      };

    case ACTIONS.ADD_CATEGORY:
      return {
        ...state,
        categories: [...state.categories, action.payload],
        loading: false,
        error: null,
      };

    case ACTIONS.UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((category) =>
          category._id === action.payload._id ? action.payload : category
        ),
        currentCategory:
          state.currentCategory?._id === action.payload._id
            ? action.payload
            : state.currentCategory,
        loading: false,
        error: null,
      };

    case ACTIONS.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category._id !== action.payload
        ),
        currentCategory:
          state.currentCategory?._id === action.payload
            ? null
            : state.currentCategory,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_CURRENT_CATEGORY:
      return {
        ...state,
        currentCategory: action.payload,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};
