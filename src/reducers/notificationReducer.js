
const notificationReducer = (state, action) => {
    switch (action.type) {
      case 'FETCH_NOTIFICATIONS_REQUEST':
        return {
          ...state,
          loading: true,
          error: null,
        };
      case 'FETCH_NOTIFICATIONS_SUCCESS':
        return {
          ...state,
          loading: false,
          notifications: action.payload,
        };
      case 'FETCH_NOTIFICATIONS_FAILURE':
        return {
          ...state,
          loading: false,
          error: action.payload,
        };
      case 'MARK_AS_READ':
        return {
          ...state,
          notifications: state.notifications.map((notification) =>
            notification._id === action.payload
              ? { ...notification, read: true }
              : notification
          ),
        };
      case 'DELETE_NOTIFICATION':
        return {
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification._id !== action.payload
          ),
        };
      default:
        return state;
    }
  };
  
  export default notificationReducer;
  