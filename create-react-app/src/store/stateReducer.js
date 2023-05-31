// src/redux/store.js
import { createStore } from 'redux';

// Define the initial state
const initialState = {
  input_type: null, // One of null, "audio_upload", "audio_recording", "pdf".
  transcript: '',
  is_uploading: false,
  is_transcribing: false,
};

// Define the reducer
const reducer = (state = initialState, action) => {
  switch (action.type) {
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

// Create the Redux store
const stateReducer = createStore(reducer);

export default stateReducer;
