import React, { useState, useEffect, useRef } from 'react';
import { Typography, LinearProgress, CircularProgress, Grid, Divider, Container, Card, Chip } from '@mui/material';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import IconButton from '@mui/material/IconButton';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import MainCard from 'ui-component/cards/MainCard';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useDispatch, useSelector } from 'react-redux';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';
import './index.css';

const MyCard = ({ onReplaceButtonClick }) => {
  const customization = useSelector((state) => state.customization);
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  function deltaToHtml(delta: string) {
    const cfg = {};
    const converter = new QuillDeltaToHtmlConverter(delta.ops, cfg);
    const html = converter.convert();
    return html;
  }
  
  function copyToClipBoard() {
    const htmlContent = customization.chat_response;
    // Create a temporary element to hold the HTML content
    const tempElement = document.createElement("div");
    tempElement.innerHTML = htmlContent;
    document.body.appendChild(tempElement);
    // Select the HTML content
    const range = document.createRange();
    range.selectNode(tempElement);
    // Copy the selected HTML content to the clipboard
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand("copy");
    selection.removeAllRanges();
    document.body.removeChild(tempElement);
}
  
  const chatStream = (valueType) => {
    dispatch({ type: 'SET_CHAT_ACTION_TYPE', payload: valueType });

    socketRef.current = new WebSocket('wss://3.125.247.51/back_end_stream_chat');
    
    socketRef.current.addEventListener('open', () => {
      // Send additional data to the server
      const is_pdf = customization.input_type == "pdf" ? true : false ;
      const additionalData = {
        input_type: valueType,
        input_text: customization.highlighted_notes.text,
        is_pdf: is_pdf
      };
      socketRef.current.send(JSON.stringify(additionalData));
    });
    
    // Handle received messages
    socketRef.current.addEventListener('message', () => {
      const data = event.data;
      console.log(data);
      dispatch({ type: 'SET_CHAT_RESPONSE', payload: data });
      dispatch({ type: 'SET_IS_STREAMING_CHAT_RESPONSE', payload: true });

      // Update state or perform any necessary actions with the received data
    });

    socketRef.current.addEventListener('close', () => {
      console.log("close");
      dispatch({ type: 'SET_IS_STREAMING_CHAT_RESPONSE', payload: false });
      return () => {
        socketRef.current.close();
      };
    });
  };

  return (
    <div>
    {customization.highlighted_notes &&
      <Card sx={{ borderColor: '#ccc', borderStyle: 'solid', margin: '10px' }}>
        {
          customization.chat_response && customization.chat_action_type && (
            <div>
                <div style={{ padding: '0px 10px 0px 10px', width: '100%', display: 'inline-flex', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#808080' }}>
                    {customization.chat_action_type}
                  </span>
                  <div style={{ marginLeft: 'auto' }}>
                    <Grid container rowSpacing={1} columnSpacing={1} >
                        <Grid item >
                          <Tooltip title="Replace selected text in editor" style={{ visibility: customization.chat_response && customization.is_streaming_chat_response == false ? 'visible': 'hidden'}}>
                            <IconButton onClick={() => onReplaceButtonClick()}>
                              <PublishedWithChangesIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy to clipboard" style={{ visibility: customization.chat_response && customization.is_streaming_chat_response == false ? 'visible': 'hidden'}}>
                            <IconButton onClick={() => copyToClipBoard()}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Tooltip>
                        </Grid>
                    </Grid>
                 </div>
              </div>
              <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
              <div style={{padding: '10px' }} className="chat-output-display" dangerouslySetInnerHTML={{ __html: customization.chat_response }}></div>
              <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
            </div>
          )
        }
        
        <div className = "smart-editor-container">
          <span className = "smart-editor-title" >Selected text</span>
        </div>
        <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
        <div className="selected-text-display" style={{ maxHeight: '150px', overflow: 'auto', padding: '0px 10px 0px 10px' }}
          dangerouslySetInnerHTML={{ __html: deltaToHtml(customization.highlighted_notes.delta) }}>
        </div>
        <br />
            
        {customization.chat_action_type ? (
          <div></div>          
          ) : (
            <Grid container rowSpacing={1} columnSpacing={1} style={{ padding: '10px 10px 10px 10px' }}>
              <Grid item >
                <Chip className="chat-action-chip" label="Title" variant="outlined" onClick={() => chatStream('Title')} />
              </Grid>
              <Grid item >
                <Chip className="chat-action-chip" label="Summary" variant="outlined" onClick={() => chatStream('Summary')} />
              </Grid>
              <Grid item >
                <Chip className="chat-action-chip" label="Bullet points" variant="outlined" onClick={() => chatStream('BulletPoints')} />
              </Grid>
              <Grid item >
                <Chip className="chat-action-chip" label="Outline" variant="outlined" onClick={() => chatStream('Outline')}  />
              </Grid>
            </Grid>
          )
        }
      </Card>
    }
    </div>
  );
};

const Notes = () => {
  const customization = useSelector((state) => state.customization);
  const [value, setValue] = useState(customization.notes);
  const quillRef = useRef();
  const dispatch = useDispatch();

  const handleChange = (newValue) => {
    if (value != newValue) {
      setValue(newValue);
      dispatch({ type: 'SET_NOTES', payload: newValue });
    }
  };
  
  const handleChangeSelection = (range) => {
    if (range == null) {
      console.log("range == null");
      return ;
    } 
    
    const editor = quillRef.current.getEditor();

    if (range.length > 0 ){
      console.log("range.length > 0");
      if (customization.highlighted_notes_range) {
         editor.formatText(customization.highlighted_notes_range.index, customization.highlighted_notes_range.length, {
          'background-color': 'white'
        }, 'api');  
      } 
      
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: null });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: null });
      dispatch({ type: 'SET_CHAT_RESPONSE', payload: null });
      dispatch({ type: 'SET_CHAT_ACTION_TYPE', payload: null });
      dispatch({ type: 'SET_IS_STREAMING_CHAT_RESPONSE', payload: null });
      
      const text = editor.getText(range.index, range.length);
      const delta = editor.getContents(range.index, range.length);       
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: {'text': text, 'delta': delta} });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: {'index': range.index, 'length': range.length} });
      
    } else {
      console.log("range.length = 0");
      if (customization.highlighted_notes_range) {
         editor.formatText(customization.highlighted_notes_range.index, customization.highlighted_notes_range.length, {
          'background-color': 'white'
        }, 'api');  
      } 

      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: null });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: null });
      dispatch({ type: 'SET_CHAT_RESPONSE', payload: null });
      dispatch({ type: 'SET_CHAT_ACTION_TYPE', payload: null });
      dispatch({ type: 'SET_IS_STREAMING_CHAT_RESPONSE', payload: null });
    }
  }
  
  const handleOnBlur = () => {
    if (!customization.highlighted_notes_range){
      return ;
    }
    const editor = quillRef.current.getEditor();
    editor.formatText(customization.highlighted_notes_range.index , customization.highlighted_notes_range.length, {
      'background-color': '#ccc'
    }); 
    console.log(editor);
  }
  
  const handleReplaceHighlightedNotes = () => {
    if(!customization.highlighted_notes_range){
      return ;
    }
    const start_index = customization.highlighted_notes_range.index;
    const length = customization.highlighted_notes_range.length;
    const response = customization.chat_response;
    const editor = quillRef.current.getEditor();
    editor.deleteText(start_index, length, 'user');
    editor.clipboard.dangerouslyPasteHTML(start_index, response, 'user');
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={8}> 
        <ReactQuill
          style={{ background: 'white'}}
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          onChangeSelection={handleChangeSelection}
          onBlur={handleOnBlur}
        />
      </Grid>
      <Grid item xs={4}> 
        <Box sx={{ width: '100%', border: '1px solid #ccc', height: '70vh', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <Container sx={{ my: 3, mx: 2, flex: '0 1 auto' }} className="smart-editor-container">
            <div className="smart-editor-title">
              Smart Editor
            </div>
          </Container>
          <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
          <div style={{ flex: '1 1 auto', overflowY: 'scroll' }} >
            <Box sx={{ m: 2 }}>
              <Typography gutterBottom variant="body1">
                Please highlight some text to edit.
              </Typography>
            </Box>
            <MyCard onReplaceButtonClick={handleReplaceHighlightedNotes} />
          </div>
        </Box>
      </Grid>
    </Grid>
  );
};

const ContentTabs = (props) => {
  const [value, setValue] = React.useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  
  const { component: VideoTranscript } = props;

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Transcript" value="1" />
            <Tab label="Notes" value="2" />
          </TabList>
        </Box>
        <TabPanel value="1"><VideoTranscript /></TabPanel>
        <TabPanel value="2"><Notes /></TabPanel>
      </TabContext>
    </Box>
  );
}

const VideoUpload = (props) => {
  const dispatch = useDispatch();
  const video = props.file;
  const customization = useSelector((state) => state.customization);

  const handleUpload = async () => {
    dispatch({ type: 'SET_IS_HANDLE_UPLOAD_CALLED', payload: true });
    const formData = new FormData();
    formData.append('file', video);
    try {
      dispatch({ type: 'SET_IS_UPLOADING', payload: true });
      const response = await axios.post('https://3.125.247.51/back_end_upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'text',
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          console.log(progressEvent);
          console.log(progress);
          dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: progress });
          if (progress == 100){
            dispatch({ type: 'SET_IS_UPLOADING', payload: false });
            dispatch({ type: 'SET_IS_TRANSCRIBING', payload: true });
            dispatch({ type: 'SET_UPLOAD_PROGRESS', payload: 0 });
          }
        },
      });
      console.log(response);
      const paragraph_transcripts = response.data;
      dispatch({ type: 'SET_TRANSCRIPT', payload: paragraph_transcripts });
      dispatch({ type: 'SET_NOTES', payload: paragraph_transcripts });
      
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      dispatch({ type: 'SET_IS_UPLOADING', payload: false });
      dispatch({ type: 'SET_IS_TRANSCRIBING', payload: false });
      dispatch({ type: 'SET_IS_PROCESSED', payload: true });
    }
  };
  
  useEffect(() => {
    if(!customization.is_handle_upload_called) {
      handleUpload();
    }
  }, []);

  return (
    <MainCard className="scrolling-transcript-container">
      {customization.is_uploading &&
        <div>
          <Typography variant="body2">Upload Progress</Typography>
          <LinearProgress variant="determinate" value={customization.upload_progress} />
        </div>
      }
      {customization.is_transcribing &&
        <div className="transcript-block">
          <Typography variant="body2">Transcribing</Typography>
          <CircularProgress />
        </div>
      }
      {customization.is_processed &&
        <div className="transcript-block" dangerouslySetInnerHTML={{ __html: customization.transcript }}></div>
      }
    </MainCard>
  );
};

const SamplePage = () => {
  const location = useLocation();
  const customization = useSelector((state) => state.customization);
  
  if (customization.input_type != null){
    console.log(customization.input_type);
    const VideoTranscript = () => <VideoUpload file={location.state.file}/>;
    return <ContentTabs component={VideoTranscript} />
  }

  return <div> Please go to main page and upload something! </div>;
};

export default SamplePage;
