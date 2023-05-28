import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import MainCard from 'ui-component/cards/MainCard';

const SamplePage = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const maybeVideo = location.state.file;

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', maybeVideo);

    try {
      const response = await axios.post('http://3.125.247.51:8000/upload_file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(progress);
        },
      });
      console.log('Video uploaded successfully:', response.data);
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  useEffect(() => {
    if (maybeVideo && !isUploading) {
      setIsUploading(true);
      handleUpload();
    }
  }, [maybeVideo, isUploading]);

  return (
    <MainCard title="Sample Card">
      <Typography variant="body2">Upload Progress</Typography>
      <LinearProgress variant="determinate" value={progress} />
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
