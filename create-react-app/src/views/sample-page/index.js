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

const MyCard = () => {
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
    var textArea = document.createElement("textarea");
    // Place in the top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;

    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';

    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;

    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';

    // Avoid flash of the white box if rendered for any reason.
    textArea.style.background = 'transparent';
    textArea.value = customization.chat_response;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      console.log('Copying text command was ' + msg);
    } catch (err) {
      console.log('Oops, unable to copy');
    }
    document.body.removeChild(textArea);
  }
  
  const chatStream = (valueType) => {
    dispatch({ type: 'SET_CHAT_ACTION_TYPE', payload: valueType });

    socketRef.current = new WebSocket('ws://3.125.247.51:8000/stream_chat');
    
    socketRef.current.addEventListener('open', () => {
      // Send additional data to the server
      const additionalData = {
        input_type: valueType,
        input_text: customization.highlighted_notes.text
      };
      socketRef.current.send(JSON.stringify(additionalData));
    });
    
    // Handle received messages
    socketRef.current.addEventListener('message', () => {
      const data = event.data;
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
        <div style={{ padding: '10px 10px 10px 10px' }}>
          <span style={{ fontWeight: '600', color: '#808080' }}>Selected text</span>
        </div>
        <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />

        <div style={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.6em', padding: '0px 10px 0px 10px' }}
          dangerouslySetInnerHTML={{ __html: deltaToHtml(customization.highlighted_notes.delta) }}>
        </div>
        <br />
        {customization.chat_action_type ? (
          <div></div>          
          ) : (
            <Grid container rowSpacing={1} columnSpacing={1} style={{ padding: '10px 10px 10px 10px' }}>
              <Grid item >
                <Chip style={{ fontSize: '0.6em' }} label="Title" variant="outlined" onClick={() => chatStream('Title')} />
              </Grid>
              <Grid item >
                <Chip style={{ fontSize: '0.6em' }} label="Summary" variant="outlined" onClick={() => chatStream('Summary')} />
              </Grid>
              <Grid item >
                <Chip style={{ fontSize: '0.6em' }} label="Bullet points" variant="outlined" onClick={() => chatStream('BulletPoints')} />
              </Grid>
              <Grid item >
                <Chip style={{ fontSize: '0.6em' }} label="Outline" variant="outlined" onClick={() => chatStream('Outline')}  />
              </Grid>
            </Grid>
          )
        }
        
        {
          customization.chat_response && customization.chat_action_type && (
            <div>
              <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
              <div style={{ padding: '0px 10px 0px 10px', width: '100%', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: '#808080' }}>
                  {customization.chat_action_type}
                </span>
                  <div style={{ marginLeft: 'auto' }}>
                    <Grid container rowSpacing={1} columnSpacing={1} >
                        <Grid item >
                          <Tooltip title="Replace selected text in editor" style={{ visibility: customization.chat_response && customization.is_streaming_chat_response == false ? 'visible': 'hidden'}}>
                            <IconButton>
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
              <div style={{ fontSize: '0.6em', padding: '10px' }} dangerouslySetInnerHTML={{ __html: customization.chat_response }}></div>
            </div>
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
    console.log(quillRef);
    if (value != newValue) {
      setValue(newValue);
      dispatch({ type: 'SET_NOTES', payload: newValue });
    }
  };
  
  const handleChangeSelection = (range) => {
    if (range == null){
      return ;
    }
    
    const editor = quillRef.current.getEditor();
    if (range.length > 0 ){
      console.log("range.length > 0");
      if (customization.highlighted_notes_range) {
         editor.formatText(customization.highlighted_notes_range.index, customization.highlighted_notes_range.length, {
          'background-color': 'white'
        });  
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
      editor.formatText(range.index, range.length, {
        'background-color': '#ccc'
      }); 
    } else {
      console.log("range.length = 0");
      if (customization.highlighted_notes_range) {
         editor.formatText(customization.highlighted_notes_range.index, customization.highlighted_notes_range.length, {
          'background-color': 'white'
        });  
      } 
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: null });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: null });
      dispatch({ type: 'SET_CHAT_RESPONSE', payload: null });
      dispatch({ type: 'SET_CHAT_ACTION_TYPE', payload: null });
      dispatch({ type: 'SET_IS_STREAMING_CHAT_RESPONSE', payload: null });
    }
    
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
        />
      </Grid>
      <Grid item xs={4}> 
        <Box sx={{ width: '100%', border: '1px solid #ccc', height: '100%', background: 'white' }}>
          <Container sx={{ my: 3, mx: 2 }}>
            <Typography color="text.secondary" variant="body2">
              Smart Editor
            </Typography>
          </Container>
          <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
          <Box sx={{ m: 2 }}>
            <Typography gutterBottom variant="body1">
              Please highlight some text to edit.
            </Typography>
          </Box>
          <MyCard />
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
  const [progress, setProgress] = useState(0);
  const dispatch = useDispatch();
  const video = props.file;
  const customization = useSelector((state) => state.customization);
    
  function addParagraphTags(text) {
    const paragraphs = text.split('\n');
    const formattedText = paragraphs.map((paragraph, index) => (
      `<p key="${index}">${paragraph}</p>`
    )).join('');

    return formattedText;
  }    

  const handleUpload = async () => {
    dispatch({ type: 'SET_IS_HANDLE_UPLOAD_CALLED', payload: true });
    const formData = new FormData();
    formData.append('file', video);
    try {
      dispatch({ type: 'SET_IS_UPLOADING', payload: true });
      const response = await axios.post('http://3.125.247.51:8000/mock_upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(progress);
          if (progress == 100){
            dispatch({ type: 'SET_IS_UPLOADING', payload: false });
            dispatch({ type: 'SET_IS_TRANSCRIBING', payload: true });
          }
        },
      });
      
      const paragraph_transcripts = addParagraphTags(response.data.transcript_with_ts);
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
    <MainCard>
      {customization.is_uploading &&
        <div>
          <Typography variant="body2">Upload Progress</Typography>
          <LinearProgress variant="determinate" value={progress} />
        </div>
      }
      {customization.is_transcribing &&
        <div>
          <Typography variant="body2">Transcribing</Typography>
          <CircularProgress />
        </div>
      }
      {customization.is_processed &&
        <div dangerouslySetInnerHTML={{ __html: customization.transcript }}></div>
      }
    </MainCard>
  );
};

const SamplePage = () => {
  const location = useLocation();
  const customization = useSelector((state) => state.customization);
  
  if (customization.input_type =='video'){
    const VideoTranscript = () => <VideoUpload file={location.state.file}/>;
    return <ContentTabs component={VideoTranscript} />
  }
  return <div> hello </div>;
};

export default SamplePage;
