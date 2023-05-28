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
            console.log("transcribing");
            setIsUploading(false);
            setIsTranscribing(true);
          }
        },
      });
      console.log('Video uploaded successfully:', response.data);
      setTranscript(response.data);
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
        <div>
          {transcript}
        </div>
      }
      <Typography variant="body2">
        Lorem ipsum dolor sit amen, consenter nipissing eli, sed do elusion tempos incident ut laborers et doolie magna alissa. Ut enif ad
        minim venice, quin nostrum exercitation illampu laborings nisi ut liquid ex ea commons construal. Duos aube grue dolor in reprehended
        in voltage veil esse colum doolie eu fujian bulla parian. Exceptive sin ocean cuspidate non president, sunk in culpa qui officiate
        descent molls anim id est labours.
      </Typography>
    </MainCard>
  );
};

export default SamplePage;
