export const initialState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

export const USER_ACTIONS = {
  FETCH_USERS_START: "FETCH_USERS_START",
  FETCH_USERS_SUCCESS: "FETCH_USERS_SUCCESS",
  FETCH_USERS_FAILURE: "FETCH_USERS_FAILURE",
  FETCH_USER_START: "FETCH_USER_START",
  FETCH_USER_SUCCESS: "FETCH_USER_SUCCESS",
  FETCH_USER_FAILURE: "FETCH_USER_FAILURE",
  UPDATE_USER_START: "UPDATE_USER_START",
  UPDATE_USER_SUCCESS: "UPDATE_USER_SUCCESS",
  UPDATE_USER_FAILURE: "UPDATE_USER_FAILURE",
  DELETE_USER_START: "DELETE_USER_START",
  DELETE_USER_SUCCESS: "DELETE_USER_SUCCESS",
  DELETE_USER_FAILURE: "DELETE_USER_FAILURE",
  CHANGE_PASSWORD_START: "CHANGE_PASSWORD_START",
  CHANGE_PASSWORD_SUCCESS: "CHANGE_PASSWORD_SUCCESS",
  CHANGE_PASSWORD_FAILURE: "CHANGE_PASSWORD_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
};

export const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.FETCH_USERS_START:
    case USER_ACTIONS.FETCH_USER_START:
    case USER_ACTIONS.UPDATE_USER_START:
    case USER_ACTIONS.DELETE_USER_START:
    case USER_ACTIONS.CHANGE_PASSWORD_START:
      return { ...state, loading: true, error: null };

    case USER_ACTIONS.FETCH_USERS_SUCCESS:
      return { ...state, users: action.payload, loading: false };

    case USER_ACTIONS.FETCH_USER_SUCCESS:
      return { ...state, currentUser: action.payload, loading: false };

    case USER_ACTIONS.UPDATE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.map((user) =>
          user._id === action.payload._id ? action.payload : user
        ),
        currentUser:
          state.currentUser?._id === action.payload._id
            ? action.payload
            : state.currentUser,
        loading: false,
      };

    case USER_ACTIONS.DELETE_USER_SUCCESS:
      return {
        ...state,
        users: state.users.filter((user) => user._id !== action.payload),
        currentUser:
          state.currentUser?._id === action.payload ? null : state.currentUser,
        loading: false,
      };

    case USER_ACTIONS.CHANGE_PASSWORD_SUCCESS:
      return { ...state, loading: false };

    case USER_ACTIONS.FETCH_USERS_FAILURE:
    case USER_ACTIONS.FETCH_USER_FAILURE:
    case USER_ACTIONS.UPDATE_USER_FAILURE:
    case USER_ACTIONS.DELETE_USER_FAILURE:
    case USER_ACTIONS.CHANGE_PASSWORD_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case USER_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
