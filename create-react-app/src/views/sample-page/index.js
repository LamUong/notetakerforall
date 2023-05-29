import React, { useState, useEffect } from 'react';
import { Typography, LinearProgress, CircularProgress } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import MainCard from 'ui-component/cards/MainCard';

const SamplePage = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [transcript, setTranscript] = useState("");

  const location = useLocation();
  const maybeVideo = location.state.file;

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', maybeVideo);
    try {
      setIsUploading(true);
      const response = await axios.post('http://3.125.247.51:8000/upload_file', formData, {
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
    }
  };

  useEffect(() => {
    if (maybeVideo && !isUploaded) {
      handleUpload();
    }
  }, [maybeVideo, isUploaded]);

  return (
    <MainCard title="Sample Card">
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

export default SamplePage;
