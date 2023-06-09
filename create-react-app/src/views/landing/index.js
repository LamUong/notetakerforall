import React, { useState, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Stack, Typography, useMediaQuery, Button, Box } from '@mui/material';
import MicIcon from "@material-ui/icons/Mic";
import StopIcon from "@material-ui/icons/Stop";
import Drop from "./Drop";
import Logo from 'ui-component/Logo';
import { useDispatch, useSelector } from 'react-redux';

const LogoSection = () => (
  <Grid item sx={{ mb: 3 }}>
    <Link to="#">
      <Logo />
    </Link>
  </Grid>
);

const AudioRecorder = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const dispatch = useDispatch();
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const formattedTime = `Recording ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleStartRecording = () => {
    
    dispatch({ type: 'SET_IS_RECORDING_AUDIO', payload: true });

    setInterval(() => {
      setTotalSeconds((prevTotalSeconds) => prevTotalSeconds + 1);
    }, 1000);
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', handleDataAvailable);
        mediaRecorder.addEventListener('stop', handleStop);

        mediaRecorder.start();

        setRecording(true);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    console.log('dataavailable');
    recordedChunksRef.current.push(event.data);
  };

  const handleStop = () => {
    const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
    console.log(blob);
    dispatch({ type: 'SET_IS_RECORDING_AUDIO', payload: false });
    dispatch({ type: 'SET_INPUT_TYPE', payload: 'video' });
    navigate('/sample-page', {state: {file: blob}});
  };

  return (
    <div>
      {recording ? (
           <div
            style={{
              minHeight: '40vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                flex: "1",
              }}>
              {formattedTime}
            </div>
            <div style={{ textAlign: 'center' }}>
              <Button onClick={handleStopRecording} variant="contained" endIcon={<StopIcon />} sx={{ marginTop: '30px !important' }}>
                 Stop Recording
              </Button>
            </div>
          </div>
      ) : (
        <Button onClick={handleStartRecording} variant="contained" endIcon={<MicIcon />} sx={{ marginTop: '30px !important' }}>
           Start Recording
        </Button>
      )}
    </div>
  );
};

const ContentSection = ({ matchDownSM }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const customization = useSelector((state) => state.customization);

  return (
    <Grid item xs={6} alignItems="center" justifyContent="center">
      <Grid item>
        <Stack alignItems="center" justifyContent="center" spacing={1}>
          <Stack style={{
              minHeight: '40vh',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <LogoSection />
            <Typography color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
              Your AI-powered note taker
            </Typography>
            <Typography variant="caption" fontSize="16px" textAlign="center" >
              Never take notes by hand again. Real time audio recording or uploaded video/audio that
              produce transcript, summaries, highlights and bullet points without hassle. 
              Ask questions and get answers from your notes powered by ChatGPT.
            </Typography>
          </Stack>
          <div style={{
              minHeight: '60vh'
            }}> 
              <AudioRecorder />
              { !customization.is_recording_audio && 
                 <Grid item xs={12} width="100%">
                  <Box sx={{ alignItems: 'center', display: 'flex' }}>
                    <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
                    <Button
                      variant="outlined"
                      sx={{
                        cursor: 'unset',
                        m: 2,
                        py: 0.5,
                        px: 7,
                        borderColor: `${theme.palette.grey[100]} !important`,
                        color: `${theme.palette.grey[900]}!important`,
                        fontWeight: 500,
                        borderRadius: '5px'
                      }}
                      disableRipple
                      disabled
                    >
                      OR
                    </Button>
                    <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
                  </Box>
                </Grid>    
              }
            { !customization.is_recording_audio && 
              <Drop
                onLoaded={async (files) => {
                    dispatch({ type: 'SET_INPUT_TYPE', payload: 'video' });
                    navigate('/sample-page', {state: {file: files[0]}});
                }}
              />
            }
          </div>
        </Stack>
      </Grid>
    </Grid>
  );
};

const Landing = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
      <Grid item xs={12}>
        <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
          <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
            <Grid container spacing={2} alignItems="center" justifyContent="center">
              <Grid container>
                <Grid item xs={3}></Grid>
                <ContentSection matchDownSM={matchDownSM} />
                <Grid item xs={3}></Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Landing;
