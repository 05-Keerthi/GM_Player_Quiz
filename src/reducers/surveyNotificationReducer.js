export const ACTIONS = {
    SET_LOADING: "SET_LOADING",
    SET_NOTIFICATIONS: "SET_NOTIFICATIONS",
    ADD_NOTIFICATION: "ADD_NOTIFICATION",
    UPDATE_NOTIFICATION: "UPDATE_NOTIFICATION",
    DELETE_NOTIFICATION: "DELETE_NOTIFICATION",
    SET_ERROR: "SET_ERROR",
  };
  
  export const initialState = {
    notifications: [],
    currentNotification: null,
    loading: false,
    error: null,
  };
  
  export const surveyNotificationReducer = (state, action) => {
    switch (action.type) {
      case ACTIONS.SET_LOADING:
        return {
          ...state,
          loading: action.payload,
        };
  
      case ACTIONS.SET_NOTIFICATIONS:
        return {
          ...state,
          notifications: action.payload,
          loading: false,
        };
  
      case ACTIONS.ADD_NOTIFICATION:
        return {
          ...state,
          notifications: [action.payload, ...state.notifications],
          loading: false,
        };
  
      case ACTIONS.UPDATE_NOTIFICATION:
        return {
          ...state,
          notifications: state.notifications.map((notification) =>
            notification.id === action.payload.id ? action.payload : notification
          ),
          loading: false,
        };
  
      case ACTIONS.DELETE_NOTIFICATION:
        return {
          ...state,
          notifications: state.notifications.filter(
            (notification) => notification.id !== action.payload
          ),
          loading: false,
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
  