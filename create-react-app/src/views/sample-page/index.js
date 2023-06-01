import React, { useState, useEffect, useRef } from 'react';
import { Typography, LinearProgress, CircularProgress, Grid, Divider, Container, Card, CardContent } from '@mui/material';
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

const MyCard = () => {
  const customization = useSelector((state) => state.customization);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" sx={{ maxHeight: '70px' }}>
          Here is your selected text:
        </Typography>

        {customization.highlighted_notes &&
          <div style={{ maxHeight: '150px', overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: customization.highlighted_notes }}></div>
        }
                
      </CardContent>
    </Card>
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
    console.log("handleChangeSelection");
    if (range.length > 0 ){
      console.log("range.length > 0");
      const editor = quillRef.current.getEditor();
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: editor.getText(range.index, range.length) });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: {'index': range.index, 'length': range.length} });
    } else {
      console.log("range.length = 0");
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES', payload: null });
      dispatch({ type: 'SET_HIGHLIGHTED_NOTES_RANGE', payload: null });
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
