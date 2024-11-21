export const authReducer = (state, action) => {
  switch (action.type) {
    // Register New User
    case "REGISTER":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };

    // Login Action
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user, // User includes role and other info
        token: action.payload.token, // Store the token as well
      };

    // Logout Action
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null, // Reset token on logout
      };

    // Update User Data (for cases where user info changes)
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload }, // Update specific user info
      };

    default:
      return state;
  }
};