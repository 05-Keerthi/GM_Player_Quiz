// leaderboardReducer.js
export const LEADERBOARD_ACTIONS = {
    GET_LEADERBOARD_START: 'GET_LEADERBOARD_START',
    GET_LEADERBOARD_SUCCESS: 'GET_LEADERBOARD_SUCCESS',
    GET_LEADERBOARD_FAILURE: 'GET_LEADERBOARD_FAILURE',
    GET_USER_SCORE_START: 'GET_USER_SCORE_START',
    GET_USER_SCORE_SUCCESS: 'GET_USER_SCORE_SUCCESS',
    GET_USER_SCORE_FAILURE: 'GET_USER_SCORE_FAILURE',
    CLEAR_ERROR: 'CLEAR_ERROR'
  };
  
  export const initialState = {
    loading: false,
    error: null,
    leaderboard: [],
    userScore: null
  };
  
  export const leaderboardReducer = (state, action) => {
    switch (action.type) {
      case LEADERBOARD_ACTIONS.GET_LEADERBOARD_START:
      case LEADERBOARD_ACTIONS.GET_USER_SCORE_START:
        return { ...state, loading: true, error: null };
  
      case LEADERBOARD_ACTIONS.GET_LEADERBOARD_SUCCESS:
        return {
          ...state,
          loading: false,
          leaderboard: action.payload,
          error: null
        };
  
      case LEADERBOARD_ACTIONS.GET_USER_SCORE_SUCCESS:
        return {
          ...state,
          loading: false,
          userScore: action.payload,
          error: null
        };
  
      case LEADERBOARD_ACTIONS.GET_LEADERBOARD_FAILURE:
      case LEADERBOARD_ACTIONS.GET_USER_SCORE_FAILURE:
        return { ...state, loading: false, error: action.payload };
  
      case LEADERBOARD_ACTIONS.CLEAR_ERROR:
        return { ...state, error: null };
  
      default:
        return state;
    }
  };
  
  