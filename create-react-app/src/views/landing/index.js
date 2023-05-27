import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Divider, Grid, Stack, Typography, useMediaQuery, Button, Box } from '@mui/material';
import MicIcon from "@material-ui/icons/Mic";


// project imports
import Logo from 'ui-component/Logo';


// assets

// ================================|| AUTH3 - LOGIN ||================================ //

const Landing = () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));

  return (
      <Grid container direction="column" justifyContent="flex-end" sx={{ minHeight: '100vh' }}>
        <Grid item xs={12}>
          <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 'calc(100vh - 68px)' }}>
            <Grid item sx={{ m: { xs: 1, sm: 3 }, mb: 0 }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                  <Grid item sx={{ mb: 3 }}>
                    <Link to="#">
                      <Logo />
                    </Link>
                  </Grid>
                  <Grid container>
                    <Grid item xs={3}></Grid>
                    <Grid item xs={6} alignItems="center" justifyContent="center">
                      <Grid item>
                        <Stack alignItems="center" justifyContent="center" spacing={1}>
                          <Typography color={theme.palette.secondary.main} gutterBottom variant={matchDownSM ? 'h3' : 'h2'}>
                            Get notes with Berry
                          </Typography>
                          <Typography variant="caption" fontSize="16px" textAlign="center" >
                            Stop taking notes by hand. Get notes with real time audio recording or uploaded video/audio.
                            Automatically get transcript, summaries, highlights and bullet points without hassel. Ask questions
                            and answers from your notes powered by ChatGPT.
                          </Typography>
                          <Button variant="contained" endIcon={<MicIcon />} marginTop="30px" >
                            Start Recording
                          </Button>
                          <Grid item xs={12}>
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
                                  borderRadius: 5px
                                }}
                                disableRipple
                                disabled
                              >
                                OR
                              </Button>
                              <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
                            </Box>
                          </Grid>
                        </Stack>
                      </Grid>
                    </Grid>
                    <Grid item xs={3}></Grid>
                  </Grid>
                  <Grid item xs={12}>
                    <p>hello 2</p>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Grid item container direction="column" alignItems="center" xs={12}>
                      <Typography component={Link} to="/pages/register/register3" variant="subtitle1" sx={{ textDecoration: 'none' }}>
                        Don&apos;t have an account?
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sx={{ m: 3, mt: 1 }}>
          <p>hello 3</p>
        </Grid>
      </Grid>
  );
};

export default Landing;
