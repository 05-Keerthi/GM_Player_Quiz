// surveySlideReducer.js
export const SLIDE_ACTIONS = {
  CREATE_SLIDE_START: "CREATE_SLIDE_START",
  CREATE_SLIDE_SUCCESS: "CREATE_SLIDE_SUCCESS",
  CREATE_SLIDE_FAILURE: "CREATE_SLIDE_FAILURE",

  UPDATE_SLIDE_START: "UPDATE_SLIDE_START",
  UPDATE_SLIDE_SUCCESS: "UPDATE_SLIDE_SUCCESS",
  UPDATE_SLIDE_FAILURE: "UPDATE_SLIDE_FAILURE",

  DELETE_SLIDE_START: "DELETE_SLIDE_START",
  DELETE_SLIDE_SUCCESS: "DELETE_SLIDE_SUCCESS",
  DELETE_SLIDE_FAILURE: "DELETE_SLIDE_FAILURE",

  FETCH_SLIDES_START: "FETCH_SLIDES_START",
  FETCH_SLIDES_SUCCESS: "FETCH_SLIDES_SUCCESS",
  FETCH_SLIDES_FAILURE: "FETCH_SLIDES_FAILURE",

  FETCH_SLIDE_START: "FETCH_SLIDE_START",
  FETCH_SLIDE_SUCCESS: "FETCH_SLIDE_SUCCESS",
  FETCH_SLIDE_FAILURE: "FETCH_SLIDE_FAILURE",

  CLEAR_ERROR: "CLEAR_ERROR",
};

export const initialState = {
  slides: [],
  currentSlide: null,
  loading: false,
  error: null,
};

export const slideReducer = (state, action) => {
  switch (action.type) {
    case SLIDE_ACTIONS.CREATE_SLIDE_START:
    case SLIDE_ACTIONS.UPDATE_SLIDE_START:
    case SLIDE_ACTIONS.DELETE_SLIDE_START:
    case SLIDE_ACTIONS.FETCH_SLIDES_START:
    case SLIDE_ACTIONS.FETCH_SLIDE_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case SLIDE_ACTIONS.CREATE_SLIDE_SUCCESS:
      return {
        ...state,
        slides: [...state.slides, action.payload],
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.UPDATE_SLIDE_SUCCESS:
      return {
        ...state,
        slides: state.slides.map((slide) =>
          slide._id === action.payload._id ? action.payload : slide
        ),
        currentSlide: action.payload,
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.DELETE_SLIDE_SUCCESS:
      return {
        ...state,
        slides: state.slides.filter((slide) => slide._id !== action.payload),
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.FETCH_SLIDES_SUCCESS:
      return {
        ...state,
        slides: action.payload,
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.FETCH_SLIDE_SUCCESS:
      return {
        ...state,
        currentSlide: action.payload,
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.CREATE_SLIDE_FAILURE:
    case SLIDE_ACTIONS.UPDATE_SLIDE_FAILURE:
    case SLIDE_ACTIONS.DELETE_SLIDE_FAILURE:
    case SLIDE_ACTIONS.FETCH_SLIDES_FAILURE:
    case SLIDE_ACTIONS.FETCH_SLIDE_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SLIDE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};
