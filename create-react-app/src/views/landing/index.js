import React, { useState, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Stack, Typography, useMediaQuery, Button, Box } from '@mui/material';
import MicIcon from "@material-ui/icons/Mic";
import StopIcon from "@material-ui/icons/Stop";
import Drop from "./Drop";
import Logo from 'ui-component/Logo';
import { useDispatch, useSelector } from 'react-redux';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

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
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const dispatch = useDispatch();
  const customization = useSelector((state) => state.customization);
  const socketRef = useRef(null);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleStartRecording = () => {
    
    dispatch({ type: 'SET_IS_RECORDING_AUDIO', payload: true });

    setInterval(() => {
      setTotalSeconds((prevTotalSeconds) => prevTotalSeconds + 1);
    }, 1000);
    
    console.log("Lam is here");
 
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        
        socketRef.current = new WebSocket('wss://3.125.247.51/stream_audio');
        socketRef.current.onopen = () => {
            console.log({ event: 'onopen' });
            mediaRecorder.addEventListener('dataavailable', async (event) => {
              if (event.data.size > 0 && socket.readyState == 1) {
                  socketRef.current.send(event.data);
              }
            })
            mediaRecorder.start(250);
        }
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDataAvailable = (event) => {
    console.log('dataavailable');
    recordedChunksRef.current.push(event.data);
    socketRef.current.send(event.data);
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
      {customization.is_recording_audio &&
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '10px',
                  backgroundColor: '#ececf1',
                  padding: '8px',
                }}
              >
                <RadioButtonCheckedIcon style={{ marginRight: '8px', color: 'red', height: '10px' }} />
                <span style={{ fontSize: '16px', color: '#323232' }}>{formattedTime}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Button color="error" onClick={handleStopRecording} variant="outlined" startIcon={<StopIcon />} sx={{ marginTop: '10px !important', width: '100%' }}>
                 Stop Recording
              </Button>
            </div>
          </div>
      } 
      { (!customization.input_type && !customization.is_recording_audio) && 
        <Button onClick={handleStartRecording} variant="contained" endIcon={<MicIcon />} sx={{ marginBotton: '20px' }}>
           Start Recording
        </Button>
      }
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
          <Stack style={{
              minHeight: '50vh',
              alignItems: 'center',
              marginBottom: '10vh',
              width: '100%',
            }}>
              <AudioRecorder />
              { (!customization.is_recording_audio && !customization.input_type) && 
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
            { (!customization.is_recording_audio && !customization.input_type) && 
              <Drop
                onLoaded={async (files) => {
                    if (files[0].type == "application/pdf"){
                      console.log('pdf');
                      dispatch({ type: 'SET_INPUT_TYPE', payload: 'pdf' });
                    } else {
                      console.log('video');
                      dispatch({ type: 'SET_INPUT_TYPE', payload: 'video' });                    
                    }
                    navigate('/sample-page', {state: {file: files[0]}});
                }}
              />
            }
          </Stack>
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
