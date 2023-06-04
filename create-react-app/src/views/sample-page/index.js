import React, { useState, useEffect, useRef } from 'react';
import { Typography, LinearProgress, CircularProgress, Grid, Divider, Container, Card, CardContent, Chip } from '@mui/material';
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
        <CardContent>
            <div>
                <Typography variant="body1" component="body1" sx={{ maxHeight: '40px' }}>
                Here is your selected text:
                </Typography>
                <br />
                <br />
                <Divider sx={{ borderColor: '#ccc' }} variant="fullWidth" />
                <div style={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.6em' }}
                  dangerouslySetInnerHTML={{ __html: deltaToHtml(customization.highlighted_notes.delta) }}>
                </div>
                <br />
                {customization.chat_action_type ? (
                  <Grid container rowSpacing={1} columnSpacing={1} >
                    <Grid item >
                      <Chip style={{ fontSize: '0.6em' }} label={customization.chat_action_type} variant="filled" />
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container rowSpacing={1} columnSpacing={1} >
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
                )}
                <br />
                {customization.chat_response &&
                  <div
                    style={{ fontSize: '0.6em' }}
                    dangerouslySetInnerHTML={{ __html: customization.chat_response }}>
                  </div>
                }
                <br />
                  
                {(customization.chat_response && customization.is_streaming_chat_response == false) &&
                  <Grid container rowSpacing={1} columnSpacing={1} >
                    <Grid item >
                      <Chip style={{ fontSize: '0.6em' }} label="Replace" variant="outlined" />
                    </Grid>
                  </Grid>
                }
            </div>
        </CardContent>
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
