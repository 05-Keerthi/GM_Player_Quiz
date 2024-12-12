const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_NOTIFICATIONS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'FETCH_NOTIFICATIONS_SUCCESS':
      return {
        ...state,
        notifications: action.payload,
        loading: false,
        error: null
      };
    case 'FETCH_NOTIFICATIONS_FAILURE':
      return {
        ...state,
        notifications: [],
        loading: false,
        error: action.payload
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification._id === action.payload 
            ? { ...notification, read: true }
            : notification
        )
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification._id !== action.payload
        )
      };
    default:
      return state;
  }
};

export default notificationReducer;