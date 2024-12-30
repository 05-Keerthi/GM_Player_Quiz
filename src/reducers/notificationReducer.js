// notificationReducer.js
export const initialState = {
  notifications: [],
  currentNotification: null,
  loading: false,
  error: null,
};

export const ACTIONS = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  DELETE_NOTIFICATION: 'DELETE_NOTIFICATION',
  SET_CURRENT_NOTIFICATION: 'SET_CURRENT_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

export const notificationReducer = (state, action) => {
  switch (action.type) {
 // notificationReducer.js
case ACTIONS.SET_NOTIFICATIONS:
  return {
    ...state,
    notifications: Array.isArray(action.payload) ? action.payload : [], // Ensure it's an array
  };
    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification._id === action.payload._id ? action.payload : notification
        ),
      };
    case ACTIONS.DELETE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification._id !== action.payload
        ),
      };
    case ACTIONS.SET_CURRENT_NOTIFICATION:
      return {
        ...state,
        currentNotification: action.payload,
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
      };
    default:
      return state;
  }
};