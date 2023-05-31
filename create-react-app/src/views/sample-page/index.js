import React, { useState, useEffect } from 'react';
import { Typography, LinearProgress, CircularProgress } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import MainCard from 'ui-component/cards/MainCard';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { useSelector } from 'react-redux';

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
            <Tab label="Item Two" value="2" />
            <Tab label="Item Three" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1"><VideoTranscript /></TabPanel>
        <TabPanel value="2">Item Two</TabPanel>
        <TabPanel value="3">Item Three</TabPanel>
      </TabContext>
    </Box>
  );
}

const VideoUpload = (props) => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [transcript, setTranscript] = useState("");
  const video = props.file;

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', video);
    try {
      setIsUploading(true);
      const response = await axios.post('http://3.125.247.51:8000/mock_upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(progress);
          if (progress == 100){
            setIsUploading(false);
            setIsTranscribing(true);
          }
        },
      });
      console.log(response.data);
      setTranscript(response.data.transcript_with_ts);
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      console.log("isUploaded=true");
      setIsUploading(false);
      setIsTranscribing(false);
      setIsUploaded(true);
      window.history.replaceState({}, "")
    }
  };

  useEffect(() => {
    if (!isUploaded) {
      handleUpload();
    }
  }, [video]);

  return (
    <MainCard>
      {isUploading &&
        <div>
          <Typography variant="body2">Upload Progress</Typography>
          <LinearProgress variant="determinate" value={progress} />
        </div>
      }
      {isTranscribing &&
        <div>
          <Typography variant="body2">Transcribing</Typography>
          <CircularProgress />
        </div>
      }
      {isUploaded &&
        <div style={{whiteSpace: "pre-line"}}>
          {transcript}
        </div>
      }
    </MainCard>
  );
};

const SamplePage = () => {
  const location = useLocation();
  const customization = useSelector((state) => state.customization);
  console.log(customization.input_type);
  
  if (location.state != null && 'file' in location.state){
    console.log(location.state.file);
    const VideoTranscript = () => <VideoUpload file={location.state.file}/>;
    return <ContentTabs component={VideoTranscript} />
  }
  return <div> hello </div>;
};

export default SamplePage;
