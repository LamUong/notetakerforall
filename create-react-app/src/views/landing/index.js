import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Stack, Typography, useMediaQuery, Button, Box } from '@mui/material';
import MicIcon from "@material-ui/icons/Mic";
import Drop from "./Drop";
import Logo from 'ui-component/Logo';
import { useDispatch } from 'react-redux';

const LogoSection = () => (
  <Grid item sx={{ mb: 3 }}>
    <Link to="#">
      <Logo />
    </Link>
  </Grid>
);

const ContentSection = ({ matchDownSM }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <Grid item xs={6} alignItems="center" justifyContent="center">
      <Grid item>
        <Stack alignItems="center" justifyContent="center" spacing={1}>
          <Typography color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
            Your AI-powered note taker
          </Typography>
          <Typography variant="caption" fontSize="16px" textAlign="center" >
            Never take notes by hand again. Real time audio recording or uploaded video/audio that
            produce transcript, summaries, highlights and bullet points without hassle. 
            Ask questions and get answers from your notes powered by ChatGPT.
          </Typography>
          <Button variant="contained" endIcon={<MicIcon />} sx={{ marginTop: '30px !important' }}>
            Start Recording
          </Button>
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
          <Drop
            onLoaded={async (files) => {
                dispatch({ type: 'SET_INPUT_TYPE', payload: 'video' });
                navigate('/sample-page', {state: {file: files[0]}});
            }}
          />
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
              <LogoSection />
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
