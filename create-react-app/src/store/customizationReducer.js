// project imports
import config from 'config';

// action - state management
import * as actionTypes from './actions';

export const initialState = {
  isOpen: [], // for active default menu
  defaultId: 'default',
  fontFamily: config.fontFamily,
  borderRadius: config.borderRadius,
  opened: true,
  input_type: null, // One of null, "audio_upload", "audio_recording", "pdf".
  transcript: '',
  notes: '',
  is_uploading: false,
  is_transcribing: false,
  is_processed: false,
  is_handle_upload_called: false,
  is_recording_audio: false,
  highlighted_notes: null,
  highlighted_notes_range: null,
  chat_response: null,
  is_streaming_chat_response: null,
  chat_action_type: null,
  upload_progress: null,
};

// ==============================|| CUSTOMIZATION REDUCER ||============================== //

const customizationReducer = (state = initialState, action) => {
  let id;
  switch (action.type) {
    case actionTypes.MENU_OPEN:
      id = action.id;
      return {
        ...state,
        isOpen: [id]
      };
    case actionTypes.SET_MENU:
      return {
        ...state,
        opened: action.opened
      };
    case actionTypes.SET_FONT_FAMILY:
      return {
        ...state,
        fontFamily: action.fontFamily
      };
    case actionTypes.SET_BORDER_RADIUS:
      return {
        ...state,
        borderRadius: action.borderRadius
      };
      
    // STATE
    case 'SET_IS_UPLOADING':
      return Object.assign({}, state, {
        is_uploading: action.payload, 
      })
    case 'SET_IS_TRANSCRIBING':
      return Object.assign({}, state, {
        is_transcribing: action.payload, 
      })
    case 'SET_TRANSCRIPT':
      return Object.assign({}, state, {
        transcript: action.payload, 
      })
    case 'SET_NOTES':
      return Object.assign({}, state, {
        notes: action.payload, 
      })
    case 'SET_INPUT_TYPE':
      return Object.assign({}, state, {
        input_type: action.payload, 
      })
    case 'SET_IS_PROCESSED':
      return Object.assign({}, state, {
        is_processed: action.payload, 
      })
    case 'SET_IS_HANDLE_UPLOAD_CALLED':
      return Object.assign({}, state, {
        is_handle_upload_called: action.payload, 
      })
    case 'SET_HIGHLIGHTED_NOTES':
      return Object.assign({}, state, {
        highlighted_notes: action.payload, 
      })
    case 'SET_HIGHLIGHTED_NOTES_RANGE':
      return Object.assign({}, state, {
        highlighted_notes_range: action.payload, 
      })
    case 'SET_CHAT_RESPONSE':
      return Object.assign({}, state, {
        chat_response: action.payload, 
      })
    case 'SET_CHAT_ACTION_TYPE':
      return Object.assign({}, state, {
        chat_action_type: action.payload, 
      })
    case 'SET_IS_STREAMING_CHAT_RESPONSE':
      return Object.assign({}, state, {
        is_streaming_chat_response: action.payload, 
      })
    case 'SET_IS_RECORDING_AUDIO':
      return Object.assign({}, state, {
        is_recording_audio: action.payload, 
      })
    case 'SET_UPLOAD_PROGRESS':
      return Object.assign({}, state, {
        upload_progress: action.payload, 
      })
    default:
      return state;
  }
};

export default customizationReducer;
