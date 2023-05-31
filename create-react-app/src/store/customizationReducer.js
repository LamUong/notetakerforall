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
  is_uploading: false,
  is_transcribing: false,
};

// ==============================|| CUSTOMIZATION REDUCER ||============================== //

const customizationReducer = (state = initialState, action) => {
  console.log("Lam is here");
  console.log(action);
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
      return {
        is_uploading: action.payload, 
      };
    case 'SET_IS_TRANSCRIBING':
      return {
        is_transcribing: action.payload, 
      };
    case 'SET_TRANSCRIPT':
      return {
        transcript: action.payload, 
      };
    case 'SET_INPUT_TYPE':
      return {
        input_type: action.payload, 
      };
    default:
      return state;
  }
};

export default customizationReducer;
