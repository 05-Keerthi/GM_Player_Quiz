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

const processSlideData = (slide) => {
  if (!slide) return null;

  return {
    ...slide,
    surveyTitle: slide.surveyTitle || slide.title || "",
    surveyContent: slide.surveyContent || slide.content || "",
    imageUrl: slide.imageUrl === null ? null : slide.imageUrl || null,
    position: slide.position || 0,
  };
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
      const newSlide = processSlideData(action.payload);
      return {
        ...state,
        slides: [...state.slides, newSlide],
        currentSlide: newSlide,
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.UPDATE_SLIDE_SUCCESS:
      const updatedSlide = processSlideData(action.payload);
      const updatedSlides = state.slides.map((slide) =>
        slide._id === updatedSlide._id
          ? {
              ...slide,
              ...updatedSlide,
              imageUrl:
                updatedSlide.imageUrl === null
                  ? null
                  : updatedSlide.imageUrl || slide.imageUrl,
            }
          : slide
      );

      return {
        ...state,
        slides: updatedSlides,
        currentSlide: {
          ...updatedSlide,
          imageUrl:
            updatedSlide.imageUrl === null
              ? null
              : updatedSlide.imageUrl || state.currentSlide?.imageUrl,
        },
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.DELETE_SLIDE_SUCCESS:
      return {
        ...state,
        slides: state.slides.filter((slide) => slide._id !== action.payload),
        currentSlide:
          state.currentSlide?._id === action.payload
            ? null
            : state.currentSlide,
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.FETCH_SLIDES_SUCCESS:
      return {
        ...state,
        slides: Array.isArray(action.payload)
          ? action.payload.map(processSlideData)
          : [],
        loading: false,
        error: null,
      };

    case SLIDE_ACTIONS.FETCH_SLIDE_SUCCESS:
      return {
        ...state,
        currentSlide: processSlideData(action.payload),
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
