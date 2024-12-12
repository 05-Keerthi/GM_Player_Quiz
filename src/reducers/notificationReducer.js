// Action types
const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const UPDATE_NOTIFICATION = 'UPDATE_NOTIFICATION';
const SET_ERROR = 'SET_ERROR';

// Notification reducer
export const notificationReducer = (state, action) => {
  switch (action.type) {
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification._id === action.payload._id ? action.payload : notification
        ),
      };
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};
