export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_TEMPLATES: "SET_TEMPLATES",
  SET_CURRENT_TEMPLATE: "SET_CURRENT_TEMPLATE",
  ADD_TEMPLATE: "ADD_TEMPLATE",
  UPDATE_TEMPLATE: "UPDATE_TEMPLATE",
  DELETE_TEMPLATE: "DELETE_TEMPLATE",
};

export const initialState = {
  templates: [],
  currentTemplate: null,
  loading: false,
  error: null,
};

export const templateReducer = (state, action) => {
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

    case ACTIONS.SET_TEMPLATES:
      return {
        ...state,
        templates: action.payload,
      };

    case ACTIONS.SET_CURRENT_TEMPLATE:
      return {
        ...state,
        currentTemplate: action.payload,
      };

    case ACTIONS.ADD_TEMPLATE:
      return {
        ...state,
        templates: [...state.templates, action.payload],
      };

    case ACTIONS.UPDATE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.map((template) =>
          template._id === action.payload._id ? action.payload : template
        ),
        currentTemplate:
          state.currentTemplate?._id === action.payload._id
            ? action.payload
            : state.currentTemplate,
      };

    case ACTIONS.DELETE_TEMPLATE:
      return {
        ...state,
        templates: state.templates.filter(
          (template) => template._id !== action.payload
        ),
        currentTemplate:
          state.currentTemplate?._id === action.payload
            ? null
            : state.currentTemplate,
      };

    default:
      return state;
  }
};
