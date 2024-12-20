// mediaReducer.js
export const MEDIA_ACTIONS = {
    UPLOAD_MEDIA_START: 'UPLOAD_MEDIA_START',
    UPLOAD_MEDIA_SUCCESS: 'UPLOAD_MEDIA_SUCCESS',
    UPLOAD_MEDIA_FAILURE: 'UPLOAD_MEDIA_FAILURE',
    
    GET_MEDIA_START: 'GET_MEDIA_START',
    GET_MEDIA_SUCCESS: 'GET_MEDIA_SUCCESS',
    GET_MEDIA_FAILURE: 'GET_MEDIA_FAILURE',
    
    DELETE_MEDIA_START: 'DELETE_MEDIA_START',
    DELETE_MEDIA_SUCCESS: 'DELETE_MEDIA_SUCCESS',
    DELETE_MEDIA_FAILURE: 'DELETE_MEDIA_FAILURE',
    
    DELETE_ALL_MEDIA_START: 'DELETE_ALL_MEDIA_START',
    DELETE_ALL_MEDIA_SUCCESS: 'DELETE_ALL_MEDIA_SUCCESS',
    DELETE_ALL_MEDIA_FAILURE: 'DELETE_ALL_MEDIA_FAILURE',
    
    CLEAR_ERROR: 'CLEAR_ERROR'
  };
  
  export const initialState = {
    mediaFiles: [],
    currentMedia: null,
    loading: false,
    error: null
  };
  
  export const mediaReducer = (state, action) => {
    switch (action.type) {
      // Upload Media
      case MEDIA_ACTIONS.UPLOAD_MEDIA_START:
        return {
          ...state,
          loading: true,
          error: null
        };
      case MEDIA_ACTIONS.UPLOAD_MEDIA_SUCCESS:
        return {
          ...state,
          loading: false,
          mediaFiles: [...state.mediaFiles, ...action.payload.media]
        };
      case MEDIA_ACTIONS.UPLOAD_MEDIA_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
  
      // Get Media
      case MEDIA_ACTIONS.GET_MEDIA_START:
        return {
          ...state,
          loading: true,
          error: null
        };
      case MEDIA_ACTIONS.GET_MEDIA_SUCCESS:
        return {
          ...state,
          loading: false,
          mediaFiles: action.payload.media
        };
      case MEDIA_ACTIONS.GET_MEDIA_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
  
      // Delete Media
      case MEDIA_ACTIONS.DELETE_MEDIA_START:
        return {
          ...state,
          loading: true,
          error: null
        };
      case MEDIA_ACTIONS.DELETE_MEDIA_SUCCESS:
        return {
          ...state,
          loading: false,
          mediaFiles: state.mediaFiles.filter(media => media._id !== action.payload)
        };
      case MEDIA_ACTIONS.DELETE_MEDIA_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
  
      // Delete All Media
      case MEDIA_ACTIONS.DELETE_ALL_MEDIA_START:
        return {
          ...state,
          loading: true,
          error: null
        };
      case MEDIA_ACTIONS.DELETE_ALL_MEDIA_SUCCESS:
        return {
          ...state,
          loading: false,
          mediaFiles: []
        };
      case MEDIA_ACTIONS.DELETE_ALL_MEDIA_FAILURE:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
  
      case MEDIA_ACTIONS.CLEAR_ERROR:
        return {
          ...state,
          error: null
        };
  
      default:
        return state;
    }
  };