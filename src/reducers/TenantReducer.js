// Action types
export const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_TENANTS: "SET_TENANTS",
  ADD_TENANT: "ADD_TENANT",
  UPDATE_TENANT: "UPDATE_TENANT",
  DELETE_TENANT: "DELETE_TENANT",
  SET_CURRENT_TENANT: "SET_CURRENT_TENANT",
  SET_TENANT_ADMINS: "SET_TENANT_ADMINS",
  ADD_TENANT_ADMIN: "ADD_TENANT_ADMIN",
  UPDATE_TENANT_ADMIN: "UPDATE_TENANT_ADMIN",
  DELETE_TENANT_ADMIN: "DELETE_TENANT_ADMIN",
};

// Initial state
export const initialState = {
  tenants: [],
  currentTenant: null,
  loading: false,
  error: null,
};

export const tenantReducer = (state, action) => {
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

    case ACTIONS.SET_TENANTS:
      return {
        ...state,
        tenants: action.payload,
      };

    case ACTIONS.ADD_TENANT:
      return {
        ...state,
        tenants: [...state.tenants, action.payload],
      };

    case ACTIONS.UPDATE_TENANT:
      return {
        ...state,
        tenants: state.tenants.map((tenant) =>
          tenant.id === action.payload.id ? action.payload : tenant
        ),
        currentTenant:
          state.currentTenant?.id === action.payload.id
            ? action.payload
            : state.currentTenant,
      };

    case ACTIONS.DELETE_TENANT:
      return {
        ...state,
        tenants: state.tenants.filter((tenant) => tenant.id !== action.payload),
        currentTenant:
          state.currentTenant?.id === action.payload
            ? null
            : state.currentTenant,
      };

    case ACTIONS.SET_CURRENT_TENANT:
      return {
        ...state,
        currentTenant: action.payload,
      };

    // Tenant Admin-specific cases
    case ACTIONS.SET_TENANT_ADMINS:
      return {
        ...state,
        currentTenant: {
          ...state.currentTenant,
          admins: action.payload, // Assuming `admins` is part of the tenant object
        },
      };

    case ACTIONS.ADD_TENANT_ADMIN:
      return {
        ...state,
        currentTenant: {
          ...state.currentTenant,
          admins: [...(state.currentTenant?.admins || []), action.payload],
        },
      };

    case ACTIONS.UPDATE_TENANT_ADMIN:
      return {
        ...state,
        currentTenant: {
          ...state.currentTenant,
          admins: (state.currentTenant?.admins || []).map((admin) =>
            admin.id === action.payload.id ? action.payload : admin
          ),
        },
      };

    case ACTIONS.DELETE_TENANT_ADMIN:
      return {
        ...state,
        currentTenant: {
          ...state.currentTenant,
          admins: (state.currentTenant?.admins || []).filter(
            (admin) => admin.id !== action.payload
          ),
        },
      };

    default:
      return state;
  }
};
