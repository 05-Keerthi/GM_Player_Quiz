export const initialState = {
  tenants: [],
  currentTenant: null,
  loading: false,
  error: null,
};

export const ACTIONS = {
  ADD_TENANT: "ADD_TENANT",
  UPDATE_TENANT: "UPDATE_TENANT",
  DELETE_TENANT: "DELETE_TENANT",
  SET_TENANTS: "SET_TENANTS",
  SET_CURRENT_TENANT: "SET_CURRENT_TENANT",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
};

export const tenantReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_TENANT:
      return {
        ...state,
        tenants: [...state.tenants, action.payload],
        loading: false,
      };
    case ACTIONS.UPDATE_TENANT:
      return {
        ...state,
        tenants: state.tenants.map((tenant) =>
          tenant.id === action.payload.id ? action.payload : tenant
        ),
        loading: false,
      };
    case ACTIONS.DELETE_TENANT:
      return {
        ...state,
        tenants: state.tenants.filter((tenant) => tenant.id !== action.payload),
        loading: false,
      };
    case ACTIONS.SET_TENANTS:
      return {
        ...state,
        tenants: action.payload,
        loading: false,
      };
    case ACTIONS.SET_CURRENT_TENANT:
      return {
        ...state,
        currentTenant: action.payload,
        loading: false,
      };
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
    default:
      return state;
  }
};
